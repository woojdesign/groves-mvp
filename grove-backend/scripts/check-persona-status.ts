#!/usr/bin/env ts-node

/**
 * Check persona generation status
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);

  const testUsers = await prisma.user.findMany({
    where: { isTestData: true },
    include: { embedding: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalUsers = testUsers.length;
  const withEmbeddings = testUsers.filter(u => u.embedding).length;
  const pendingEmbeddings = totalUsers - withEmbeddings;

  console.log(`Personas: ${totalUsers} total, ${withEmbeddings} with embeddings, ${pendingEmbeddings} pending`);

  await app.close();
}

main().catch(console.error);
