import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a bulk import or a single response
    if (body.responses && Array.isArray(body.responses)) {
      // Bulk import
      const { responses } = body;
      
      if (!responses.length) {
        return new NextResponse('No responses provided', { status: 400 });
      }
      
      // Validate the first response to check formId
      const firstResponse = responses[0];
      if (!firstResponse.formId) {
        return new NextResponse('Form ID is required', { status: 400 });
      }
      
      // Validate form exists
      const form = await prisma.form.findUnique({
        where: { id: firstResponse.formId },
      });

      if (!form) {
        return new NextResponse('Form not found', { status: 404 });
      }
      
      // Create all responses in a transaction
      const createdResponses = await prisma.$transaction(
        responses.map(response => 
          prisma.formResponse.create({
            data: {
              formId: response.formId,
              data: JSON.stringify(response.data),
              submittedById: session.user.id,
            }
          })
        )
      );
      
      return NextResponse.json({
        success: true,
        count: createdResponses.length,
        message: `Created ${createdResponses.length} responses`
      });
    } else {
      // Single response
      const { formId, data } = body;
      
      if (!formId) {
        return new NextResponse('Form ID is required', { status: 400 });
      }

      // Validate form exists
      const form = await prisma.form.findUnique({
        where: { id: formId },
      });

      if (!form) {
        return new NextResponse('Form not found', { status: 404 });
      }

      // Create response
      const response = await prisma.formResponse.create({
        data: {
          formId,
          data: JSON.stringify(data),
          submittedById: session.user.id,
        },
        include: {
          form: {
            select: {
              name: true,
            },
          },
          submittedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('[RESPONSES_POST]', error);
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
    const formId = searchParams.get('formId');

    const responses = await prisma.formResponse.findMany({
      where: formId ? { formId } : undefined,
      include: {
        form: {
          select: {
            name: true,
          },
        },
        submittedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map responses to safe objects
    const safeResponses = responses.map(response => ({
      id: response.id,
      formId: response.formId,
      formName: response.form?.name || 'Unknown Form',
      data: JSON.parse(response.data),
      submittedBy: {
        name: response.submittedBy?.name || 'Unknown User',
        email: response.submittedBy?.email || 'unknown@example.com',
      },
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }));

    return NextResponse.json(safeResponses);
  } catch (error) {
    console.error('[RESPONSES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 