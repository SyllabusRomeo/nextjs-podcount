import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({ success: true });

    // Clear the auth token cookie
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("[AUTH_LOGOUT_POST]", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
} 