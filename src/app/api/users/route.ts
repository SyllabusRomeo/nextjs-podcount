import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        factoryId: true,
        fieldType: true,
        status: true,
        factory: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, factoryId, fieldType } = body;

    if (!email || !password) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        factoryId: factoryId || null,
        fieldType: fieldType || "OTHER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        factoryId: true,
        fieldType: true,
        status: true,
        factory: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 