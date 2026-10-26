import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // سجل الاستعلامات في التطوير فقط — إنتاجًا نظيفًا وأداء أفضل على serverless
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db