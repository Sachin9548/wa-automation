// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Global object me store karte hain taaki dev mode me hot-reloads se multiple connections na bane
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'], // Sirf warnings aur errors log karega
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;