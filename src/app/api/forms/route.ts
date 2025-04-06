import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_TEMPLATES = {
  CONVENTIONAL: {
    name: "Conventional Cocoa Pod Count Template",
    description: "Default template for conventional cocoa pod counting exercise",
    type: "CONVENTIONAL",
    fields: JSON.stringify([
      {
        name: "farmer_id",
        type: "text",
        label: "Farmer ID",
        required: true
      },
      {
        name: "farmer_name",
        type: "text",
        label: "Farmer Name",
        required: true
      },
      {
        name: "national_id",
        type: "text",
        label: "National ID Number",
        required: true
      },
      {
        name: "phone_number",
        type: "tel",
        label: "Phone Number",
        required: true
      },
      {
        name: "operational_area",
        type: "text",
        label: "Operational Area",
        required: true
      },
      {
        name: "community",
        type: "text",
        label: "Community",
        required: true
      },
      {
        name: "small_cherelles",
        type: "number",
        label: "Small Cherelles (S)",
        required: true,
        min: 0
      },
      {
        name: "medium",
        type: "number",
        label: "Medium (M)",
        required: true,
        min: 0
      },
      {
        name: "large",
        type: "number",
        label: "Large (L)",
        required: true,
        min: 0
      },
      {
        name: "matured_unriped",
        type: "number",
        label: "Matured Unriped (MUR)",
        required: true,
        min: 0
      },
      {
        name: "matured_riped",
        type: "number",
        label: "Matured Riped (MR)",
        required: true,
        min: 0
      },
      {
        name: "diseased",
        type: "number",
        label: "Diseased (D)",
        required: true,
        min: 0
      },
      {
        name: "count_date",
        type: "date",
        label: "Count Date",
        required: true
      }
    ])
  },
  ORGANIC: {
    name: "Organic Cocoa Pod Count Template",
    description: "Default template for organic cocoa pod counting exercise",
    type: "ORGANIC",
    fields: JSON.stringify([
      {
        name: "farmer_id",
        type: "text",
        label: "Farmer ID",
        required: true
      },
      {
        name: "farmer_name",
        type: "text",
        label: "Farmer Name",
        required: true
      },
      {
        name: "national_id",
        type: "text",
        label: "National ID Number",
        required: true
      },
      {
        name: "phone_number",
        type: "tel",
        label: "Phone Number",
        required: true
      },
      {
        name: "operational_area",
        type: "text",
        label: "Operational Area",
        required: true
      },
      {
        name: "community",
        type: "text",
        label: "Community",
        required: true
      },
      {
        name: "organic_certification_id",
        type: "text",
        label: "Organic Certification ID",
        required: true
      },
      {
        name: "small_cherelles",
        type: "number",
        label: "Small Cherelles (S)",
        required: true,
        min: 0
      },
      {
        name: "medium",
        type: "number",
        label: "Medium (M)",
        required: true,
        min: 0
      },
      {
        name: "large",
        type: "number",
        label: "Large (L)",
        required: true,
        min: 0
      },
      {
        name: "matured_unriped",
        type: "number",
        label: "Matured Unriped (MUR)",
        required: true,
        min: 0
      },
      {
        name: "matured_riped",
        type: "number",
        label: "Matured Riped (MR)",
        required: true,
        min: 0
      },
      {
        name: "diseased",
        type: "number",
        label: "Diseased (D)",
        required: true,
        min: 0
      },
      {
        name: "count_date",
        type: "date",
        label: "Count Date",
        required: true
      }
    ])
  }
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { name, description, type, fields, factoryId } = json;

    // Get user's role and factory
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        factoryId: true
      }
    });

    const isAdmin = user?.role === 'ADMIN';
    const targetFactoryId = factoryId || user?.factoryId;

    if (!targetFactoryId) {
      return new NextResponse('Factory ID is required', { status: 400 });
    }

    try {
      // Create the form with proper error handling
      const form = await prisma.form.create({
        data: {
          name,
          description,
          type,
          fields: typeof fields === 'string' ? fields : JSON.stringify(fields),
          factoryId: targetFactoryId,
          createdById: session.user.id
        },
        include: {
          factory: {
            select: {
              name: true,
              type: true
            }
          },
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Create form access for the creator
      await prisma.formAccess.create({
        data: {
          userId: session.user.id,
          formId: form.id,
          canView: true,
          canEdit: true,
          canDelete: isAdmin
        }
      });

      // Grant access to all users in the same factory
      const factoryUsers = await prisma.user.findMany({
        where: { 
          factoryId: targetFactoryId,
          id: { not: session.user.id } // Exclude creator as they already have access
        }
      });

      if (factoryUsers.length > 0) {
        await prisma.formAccess.createMany({
          data: factoryUsers.map(factoryUser => ({
            userId: factoryUser.id,
            formId: form.id,
            canView: true,
            canEdit: factoryUser.role === 'ADMIN' || factoryUser.role === 'SUPERVISOR' || factoryUser.role === 'FIELD_OFFICER',
            canDelete: factoryUser.role === 'ADMIN'
          }))
        });
      }

      return NextResponse.json({
        id: form.id,
        name: form.name,
        description: form.description,
        type: form.type,
        fields: form.fields,
        factoryId: form.factoryId,
        factoryName: form.factory?.name || 'Unknown Factory',
        factoryType: form.factory?.type || 'CONVENTIONAL',
        createdBy: {
          name: form.createdBy?.name || 'System',
          email: form.createdBy?.email || 'system@example.com'
        },
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: isAdmin
        },
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      });
    } catch (prismaError: any) {
      // Handle Prisma errors with proper status codes and error messages
      console.error('Error creating form:', prismaError);
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { 
            error: 'A form with this name already exists for this factory', 
            code: prismaError.code,
            fields: prismaError.meta?.target || ['name', 'factoryId']
          }, 
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: 'Database error', code: prismaError.code }, 
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error creating form:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const factoryId = searchParams.get('factoryId');

    // Get user's factory and role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        factoryId: true,
        role: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';

    // First, ensure default templates exist for the factory
    if (user.factoryId) {
      const factory = await prisma.factory.findUnique({
        where: { id: user.factoryId },
        select: { type: true }
      });

      if (factory) {
        // Check if default template exists for this factory type
        const defaultTemplateName = factory.type === 'ORGANIC' 
          ? "Organic Cocoa Pod Count Template"
          : "Conventional Cocoa Pod Count Template";

        const defaultTemplate = await prisma.form.findFirst({
          where: {
            factoryId: user.factoryId,
            name: defaultTemplateName
          }
        });

        if (!defaultTemplate) {
          // Create default template based on factory type
          const template = DEFAULT_TEMPLATES[factory.type === 'ORGANIC' ? 'ORGANIC' : 'CONVENTIONAL'];
          const newForm = await prisma.form.create({
            data: {
              ...template,
              factoryId: user.factoryId,
              createdById: session.user.id
            }
          });

          // Create form access for all users in the factory
          const factoryUsers = await prisma.user.findMany({
            where: { factoryId: user.factoryId }
          });

          if (factoryUsers.length > 0) {
            await prisma.formAccess.createMany({
              data: factoryUsers.map(factoryUser => ({
                userId: factoryUser.id,
                formId: newForm.id,
                canView: true,
                canEdit: factoryUser.role === 'ADMIN' || factoryUser.role === 'SUPERVISOR',
                canDelete: factoryUser.role === 'ADMIN'
              }))
            });
          }
        }
      }
    }

    // Build the where clause based on user role and factory
    let whereClause: any = {};
    
    // Factory filter
    if (factoryId) {
      whereClause.factoryId = factoryId;
    } else if (!isAdmin && user.factoryId) {
      // Non-admin users can only see forms from their factory
      whereClause.factoryId = user.factoryId;
    }

    // Access control filter for non-admin users
    if (!isAdmin) {
      whereClause.OR = [
        {
          // Forms they have explicit access to
          access: {
            some: {
              userId: session.user.id,
              canView: true
            }
          }
        },
        {
          // Forms they created
          createdById: session.user.id
        }
      ];
    }

    // First get all forms that match our criteria
    const forms = await prisma.form.findMany({
      where: whereClause,
      include: {
        factory: {
          select: {
            name: true,
            type: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        access: {
          where: {
            userId: session.user.id
          },
          select: {
            canView: true,
            canEdit: true,
            canDelete: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map to safe response objects with permissions
    const safeForms = await Promise.all(forms.map(async form => {
      // Get form access permissions
      const access = form.access[0] || { canView: false, canEdit: false, canDelete: false };
      
      // If user is admin or form creator, they have full access
      const hasFullAccess = isAdmin || form.createdById === session.user.id;
      
      return {
        id: form.id,
        name: form.name,
        description: form.description,
        type: form.type,
        fields: form.fields,
        factoryId: form.factoryId,
        factoryName: form.factory?.name || 'Unknown Factory',
        factoryType: form.factory?.type || 'CONVENTIONAL',
        createdBy: {
          name: form.createdBy?.name || 'System',
          email: form.createdBy?.email || 'system@example.com'
        },
        permissions: {
          canView: hasFullAccess || access.canView,
          canEdit: hasFullAccess || access.canEdit,
          canDelete: hasFullAccess || access.canDelete
        },
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      };
    }));

    return NextResponse.json(safeForms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 