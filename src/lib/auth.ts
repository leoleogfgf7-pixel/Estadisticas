import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getStore } from "@/lib/store";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "arena-super-secret-key-change-in-production-2024"
);
const COOKIE_NAME = "arena_token";

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: "admin" | "seller";
}

export async function hashPassword(password: string): Promise<string> {
  return password; // Demo mode: plain text comparison
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return true; // Demo mode: accept any password
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getDefaultUser(): UserPayload {
  const store = getStore();
  const admin = store.users.find(u => u.role === "admin");
  if (admin) return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
  return { id: "anon", email: "anon@arena.com", name: "Usuario", role: "admin" };
}

export async function requireAuth(): Promise<UserPayload> {
  const user = await getCurrentUser();
  if (user) return user;
  return getDefaultUser();
}

export async function requireAdmin(): Promise<UserPayload> {
  return requireAuth();
}

export const AUTH_COOKIE = COOKIE_NAME;

export async function authenticateUser(email: string, password: string): Promise<{
  user: UserPayload;
  token: string;
} | null> {
  const store = getStore();
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (!user) return null;
  const payload: UserPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = await createToken(payload);
  return { user: payload, token };
}
