import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, AUTH_COOKIE } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const result = await authenticateUser(email, password);

    if (!result) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    await logActivity(result.user.id, "login", "auth", result.user.id, "Inicio de sesión");

    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    });

    response.cookies.set(AUTH_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
