import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET method to fetch all password reset requests for admins
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only administrators can view password reset requests' },
        { status: 403 }
      );
    }
    
    // Get all password reset requests
    const resetRequests = await prisma.passwordResetRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' }, // Most recent first
      ],
    });
    
    return NextResponse.json(resetRequests);
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch password reset requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // For security reasons, still return success even if user doesn't exist
      // This prevents user enumeration attacks
      return NextResponse.json(
        { message: 'Password reset request received' },
        { status: 200 }
      );
    }

    // Create a password reset request record
    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING',
      },
    }).catch((error) => {
      console.error('Error creating password reset request:', error);
      // If the table doesn't exist, continue without error
      // In a production app, you'd want to create the table first
    });

    // Get all admin users to notify
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true },
    });

    // In a real application, you'd send emails to admins here
    // For this example, we'll just log the request
    console.log(`Password reset requested for ${user.email} by user ${user.name}`);
    console.log(`Admins to notify: ${admins.map(admin => admin.email).join(', ')}`);

    return NextResponse.json(
      { message: 'Password reset request received' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing password reset request:', error);
    return NextResponse.json(
      { message: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 