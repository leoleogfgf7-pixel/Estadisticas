import { getStore } from "@/lib/store";

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> {
  // Skip logging for anonymous/default user
  if (!userId || userId === "00000000-0000-0000-0000-000000000000" || userId === "anon") return;
  try {
    const store = getStore();
    store.activityLogs.push({
      id: crypto.randomUUID(),
      userId,
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
