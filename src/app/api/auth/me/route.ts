import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (user) return NextResponse.json({ user });
  // Return default admin (no-auth mode)
  const store = getStore();
  const admin = store.users.find(u => u.role === "admin");
  if (admin) return NextResponse.json({ user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  return NextResponse.json({ user: { id: "anon", email: "anon@arena.com", name: "Usuario", role: "admin" } });
}
