import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST - Grant access to a user
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Only admins can manage form access" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, canView = true, canEdit = false, canDelete = false } = body;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the form exists
    const form = await prisma.form.findUnique({
      where: { id }
    });

    if (!form) {
      return new NextResponse(
        JSON.stringify({ error: "Form not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create or update form access
    const formAccess = await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          formId: id,
          userId: userId
        }
      },
      update: {
        canView,
        canEdit,
        canDelete
      },
      create: {
        formId: id,
        userId: userId,
        canView,
        canEdit,
        canDelete
      }
    });

    return NextResponse.json(formAccess);
  } catch (error) {
    console.error("[FORM_ACCESS_POST]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update form access" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET - List all users with access to this form
export async function GET(
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

    // Only admins and users with access can view the access list
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin) {
      const hasAccess = await prisma.formAccess.findFirst({
        where: {
          formId: id,
          userId: session.user.id,
          canView: true
        }
      });

      if (!hasAccess) {
        return new NextResponse(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const formAccess = await prisma.formAccess.findMany({
      where: { formId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(formAccess);
  } catch (error) {
    console.error("[FORM_ACCESS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch form access" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE - Remove a user's access to the form
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Only admins can remove form access" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.formAccess.delete({
      where: {
        userId_formId: {
          formId: id,
          userId: userId
        }
      }
    });

    return new NextResponse(
      JSON.stringify({ message: "Form access removed successfully" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("[FORM_ACCESS_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to remove form access" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 