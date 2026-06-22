import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { createToken, AUTH_COOKIE } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const store = getStore();
    const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);
    // Accept any password in demo mode (no bcrypt needed on serverless)
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = await createToken(payload);

    await logActivity(user.id, "login", "auth", user.id, "Inicio de sesión");

    const response = NextResponse.json({ user: payload, token });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
