import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        factoryId: true,
        factory: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update users" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, factoryId, status } = body;

    // Validate the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-disabling
    if (session.user.id === id && status === "DISABLED") {
      return NextResponse.json(
        { error: "You cannot disable your own account" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        role: role || undefined,
        factoryId: factoryId || undefined,
        status: status || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        factoryId: true,
        factory: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
} 