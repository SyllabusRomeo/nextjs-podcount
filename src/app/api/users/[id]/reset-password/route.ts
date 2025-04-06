import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Function to generate a random password
function generateTemporaryPassword(length = 10) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

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
        { message: 'Only administrators can reset passwords' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Generate a temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash the temporary password
    const hashedPassword = await hash(temporaryPassword, 10);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    // Optional: Log password reset action for audit purposes
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'PASSWORD_RESET',
        performedBy: session.user.id,
        details: 'Password reset by administrator',
      },
    }).catch(() => {
      // If userActivity table doesn't exist or an error occurs, just continue
      console.log('Failed to log user activity, but password reset was successful');
    });
    
    // Return success with the temporary password (only shown to admin)
    return NextResponse.json(
      { 
        message: 'Password reset successfully', 
        temporaryPassword 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 