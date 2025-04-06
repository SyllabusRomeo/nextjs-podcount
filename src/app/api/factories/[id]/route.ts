import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow admins to update factories
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can update factories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, location, type } = body;

    if (!name || !location) {
      return NextResponse.json(
        { message: "Name and location are required" },
        { status: 400 }
      );
    }

    const factory = await prisma.factory.update({
      where: {
        id,
      },
      data: {
        name,
        location,
        type: type || "OTHER",
      },
    });

    return NextResponse.json(factory);
  } catch (error) {
    console.error("[FACTORY_PUT]", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "A factory with this name already exists" },
          { status: 400 }
        );
      }

      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: "Factory not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to update factory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow admins to delete factories
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can delete factories" },
        { status: 403 }
      );
    }

    // Check if factory has associated users
    const factory = await prisma.factory.findUnique({
      where: { id },
      include: { users: true }
    });

    if (!factory) {
      return NextResponse.json(
        { message: "Factory not found" },
        { status: 404 }
      );
    }

    if (factory.users.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete factory with associated users" },
        { status: 400 }
      );
    }

    await prisma.factory.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Factory deleted successfully" });
  } catch (error) {
    console.error("[FACTORY_DELETE]", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { message: "Factory not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to delete factory" },
      { status: 500 }
    );
  }
}