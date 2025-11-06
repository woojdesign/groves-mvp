#!/usr/bin/env ts-node

/**
 * Fix missing embedding column in embeddings table
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log('🔧 Fixing embeddings table...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  try {
    // Add the embedding column back
    console.log('Adding embedding vector(1536) column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE embeddings
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
    `);
    console.log('✓ Column added\n');

    // Add the index
    console.log('Creating vector index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS embeddings_embedding_idx
      ON embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✓ Index created\n');

    console.log('✅ Database schema fixed!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
