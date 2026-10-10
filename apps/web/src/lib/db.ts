import { PrismaClient } from '@prisma/client';

/** Reuse one client during local hot reloads to avoid exhausting DB connections. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
