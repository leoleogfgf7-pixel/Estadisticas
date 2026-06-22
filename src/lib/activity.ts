import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> {
  // Skip logging for anonymous/default user
  if (userId === "00000000-0000-0000-0000-000000000000" || userId === "anon") return;
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
