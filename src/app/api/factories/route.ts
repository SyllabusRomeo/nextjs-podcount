import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const factories = await prisma.factory.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Add cache control headers for better performance
    const response = NextResponse.json(factories, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });

    return response;
  } catch (error) {
    console.error("[FACTORIES_GET]", error);
    return NextResponse.json(
      { message: "Failed to fetch factories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow admins to create factories
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can create factories" },
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

    const factory = await prisma.factory.create({
      data: {
        name,
        location,
        type: type || "OTHER",
      },
    });

    return NextResponse.json(factory);
  } catch (error) {
    console.error("[FACTORIES_POST]", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "A factory with this name already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to create factory" },
      { status: 500 }
    );
  }
} 