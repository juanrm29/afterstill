import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export type ActivityAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "PUBLISH" 
  | "UNPUBLISH" 
  | "SCHEDULE"
  | "ARCHIVE"
  | "RESTORE";

export type ActivityEntity = "Writing" | "Tag" | "Collection" | "Settings";

interface LogActivityParams {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logActivity({ action, entity, entityId, details }: LogActivityParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const log = await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });

    return log;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

export async function getRecentActivity(limit: number = 20) {
  try {
    const logs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return [];
  }
}
