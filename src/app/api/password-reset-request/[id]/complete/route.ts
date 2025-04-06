import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { message: 'Only administrators can complete password reset requests' },
        { status: 403 }
      );
    }
    
    const requestId = params.id;
    
    // Check if the request exists
    const request = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!request) {
      return NextResponse.json(
        { message: 'Password reset request not found' },
        { status: 404 }
      );
    }
    
    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'This request has already been processed' },
        { status: 400 }
      );
    }
    
    // Update the request status to completed
    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    
    // Optional: Log the completion for audit purposes
    await prisma.userActivity.create({
      data: {
        userId: request.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        performedBy: session.user.id,
        details: 'Password reset request completed by administrator',
      },
    }).catch(() => {
      // If userActivity table doesn't exist or an error occurs, just continue
      console.log('Failed to log user activity, but request was marked as completed');
    });
    
    return NextResponse.json(
      { message: 'Password reset request marked as completed' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error completing password reset request:', error);
    return NextResponse.json(
      { message: 'Failed to complete password reset request' },
      { status: 500 }
    );
  }
} 