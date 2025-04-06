import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, factoryId } = session.user;

    // Default filters - for regular users, only show data from their factory
    let factoryFilter = {};
    if (role !== "ADMIN" && factoryId) {
      factoryFilter = { factoryId };
    }

    // Count forms
    const formsCount = await prisma.form.count({
      where: factoryFilter,
    });

    // Count entries
    const entriesCount = await prisma.formEntry.count({
      where: {
        form: {
          ...factoryFilter,
        },
      },
    });

    // Admin-only stats
    let usersCount = 0;
    let factoriesCount = 0;

    if (role === "ADMIN") {
      usersCount = await prisma.user.count();
      factoriesCount = await prisma.factory.count();
    }

    return NextResponse.json({
      forms: formsCount,
      entries: entriesCount,
      users: usersCount,
      factories: factoriesCount,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
} 