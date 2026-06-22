import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
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

// Cached default user from DB
let cachedDefaultUser: UserPayload | null = null;

async function getDefaultUser(): Promise<UserPayload> {
  if (cachedDefaultUser) return cachedDefaultUser;
  const [adminUser] = await db.select({
    id: users.id, email: users.email, name: users.name, role: users.role,
  }).from(users).where(eq(users.role, "admin")).limit(1);
  if (adminUser) {
    cachedDefaultUser = adminUser as UserPayload;
    return cachedDefaultUser;
  }
  // Fallback - should never happen if seeded
  return { id: "00000000-0000-0000-0000-000000000000", email: "anon@arena.com", name: "Usuario", role: "admin" };
}

export async function requireAuth(): Promise<UserPayload> {
  const user = await getCurrentUser();
  if (user) return user;
  return getDefaultUser();
}

export async function requireAdmin(): Promise<UserPayload> {
  const user = await requireAuth();
  return user; // Everyone is admin now
}

export function setAuthCookie(token: string): void {
  // This will be called in the route handler
}

export const AUTH_COOKIE = COOKIE_NAME;

export async function authenticateUser(email: string, password: string): Promise<{
  user: UserPayload;
  token: string;
} | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.active) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(payload);
  return { user: payload, token };
}
