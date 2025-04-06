import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        factory: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if the user is disabled
    if (user.status === "DISABLED") {
      return NextResponse.json(
        { error: "Your account has been disabled. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.NEXTAUTH_SECRET || "default-secret",
      { expiresIn: "1d" }
    );

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        factoryId: user.factoryId,
        factoryName: user.factory?.name,
      },
    });

    // Set auth cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[AUTH_LOGIN_POST]", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
} 