import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Redis } from "ioredis";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    database: "OFFLINE",
    redis: "OFFLINE",
    worker: "OFFLINE",
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Check Database
    await prisma.$queryRaw`SELECT 1`;
    health.database = "ONLINE";
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  try {
    // 2. Check Redis
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    
    const ping = await redis.ping();
    if (ping === "PONG") {
      health.redis = "ONLINE";
      
      // 3. Check Worker Heartbeat (set by worker process)
      const heartbeat = await redis.get("worker:heartbeat");
      if (heartbeat) {
        const lastHeartbeat = parseInt(heartbeat);
        const now = Date.now();
        // If worker updated heartbeat in last 2 minutes, consider it online
        if (now - lastHeartbeat < 120000) {
          health.worker = "ONLINE";
        }
      }
    }
    
    await redis.quit();
  } catch (error) {
    console.error("Redis health check failed:", error);
  }

  const isHealthy = health.database === "ONLINE" && health.redis === "ONLINE";

  return NextResponse.json(
    {
      success: true,
      data: health,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
