import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, verify the form exists
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        factory: true,
        access: true,
        responses: true,
        entries: true
      }
    });

    if (!form) {
      return new NextResponse(
        JSON.stringify({ error: "Form not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to delete the form
    const isAdmin = session.user.role === "ADMIN";
    const formAccess = await prisma.formAccess.findFirst({
      where: {
        formId: id,
        userId: session.user.id,
        canDelete: true,
      },
    });

    if (!formAccess && !isAdmin) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: You don't have permission to delete this form" }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete all associated data in the correct order to maintain referential integrity
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Delete form access records
        await tx.formAccess.deleteMany({
          where: { formId: id }
        });

        // 2. Delete form responses
        await tx.formResponse.deleteMany({
          where: { formId: id }
        });

        // 3. Delete form entries
        await tx.formEntry.deleteMany({
          where: { formId: id }
        });

        // 4. Finally, delete the form itself
        await tx.form.delete({
          where: { id }
        });
      });

      // Verify the form was actually deleted
      const verifyDeletion = await prisma.form.findUnique({
        where: { id }
      });

      if (verifyDeletion) {
        throw new Error("Form deletion failed verification");
      }

      return new NextResponse(
        JSON.stringify({ message: "Form and associated data deleted successfully" }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } catch (txError) {
      console.error("[FORM_DELETE_TRANSACTION]", txError);
      throw new Error("Failed to delete form and associated data");
    }
  } catch (error) {
    console.error("[FORM_DELETE]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to delete form and associated data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await prisma.form.findUnique({
      where: {
        id,
      },
      include: {
        factory: {
          select: {
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        access: {
          where: {
            userId: session.user.id,
          },
          select: {
            canView: true,
            canEdit: true,
            canDelete: true,
          },
        },
      },
    });

    if (!form) {
      return new NextResponse("Form not found", { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const hasAccess = form.access.length > 0 && form.access[0].canView;

    if (!isAdmin && !hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Return response with cache control headers
    return NextResponse.json({
      ...form,
      permissions: isAdmin 
        ? { canView: true, canEdit: true, canDelete: true }
        : form.access[0] || { canView: false, canEdit: false, canDelete: false },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[FORM_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, description, factoryId, fields } = body;

    // Verify the form exists
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        access: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!form) {
      return new NextResponse(
        JSON.stringify({ error: "Form not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permission
    const isAdmin = session.user.role === "ADMIN";
    const canEdit = form.access.length > 0 && form.access[0].canEdit;

    if (!isAdmin && !canEdit) {
      return new NextResponse(
        JSON.stringify({ error: "You don't have permission to edit this form" }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the form
    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        name: name || form.name,
        description: description !== undefined ? description : form.description,
        factoryId: factoryId || form.factoryId,
        fields: fields ? (typeof fields === 'string' ? fields : JSON.stringify(fields)) : form.fields,
      },
      include: {
        factory: {
          select: {
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedForm,
      factoryName: updatedForm.factory?.name || 'Unknown Factory',
      factoryType: updatedForm.factory?.type || 'CONVENTIONAL',
      permissions: {
        canView: true,
        canEdit: true,
        canDelete: isAdmin,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[FORM_UPDATE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update form" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 