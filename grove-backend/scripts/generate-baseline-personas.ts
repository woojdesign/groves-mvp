#!/usr/bin/env ts-node

/**
 * Generate 100 baseline test personas for diversity analysis
 *
 * This script:
 * 1. Deletes existing test personas
 * 2. Generates 100 new personas using mixed_10 preset (10 batches of 10)
 * 3. Waits for all embeddings to be generated
 * 4. Reports completion status
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log('🚀 Starting baseline persona generation...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const devService = app.get(DevService);
  const prisma = app.get(PrismaService);

  // Get orgId for super admin (assuming first org)
  const org = await prisma.org.findFirst();
  if (!org) {
    console.error('❌ No organization found in database');
    process.exit(1);
  }

  console.log(`📋 Using organization: ${org.name} (${org.id})\n`);

  // Step 1: Delete existing test personas
  console.log('🧹 Deleting existing test personas...');
  const deleteResult = await devService.deleteAllPersonas(org.id);
  console.log(`   ✓ Deleted ${deleteResult.count} existing test personas\n`);

  // Step 2: Generate 100 personas (10 batches of 10)
  console.log('🎭 Generating 100 personas (10 batches of 10 using mixed_10 preset)...\n');

  let totalGenerated = 0;
  const batchCount = 10;

  for (let i = 1; i <= batchCount; i++) {
    console.log(`   Batch ${i}/${batchCount}...`);

    try {
      const result = await devService.generatePreset(
        { template: 'mixed_10' },
        org.id
      );

      totalGenerated += result.count;
      console.log(`   ✓ Generated ${result.count} personas (Total: ${totalGenerated})`);

      // Small delay between batches to avoid API rate limits
      if (i < batchCount) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Batch ${i} failed: ${error.message}`);
      console.error(`   Continuing with next batch...\n`);
    }
  }

  console.log(`\n✅ Generated ${totalGenerated} personas total\n`);

  // Step 3: Wait for embeddings to be generated
  console.log('⏳ Waiting for embeddings to be generated...');
  console.log('   This may take a few minutes. Checking every 10 seconds...\n');

  let allEmbeddingsReady = false;
  let checkCount = 0;
  const maxChecks = 60; // 10 minutes max

  while (!allEmbeddingsReady && checkCount < maxChecks) {
    checkCount++;

    // Get all test personas
    const testUsers = await prisma.user.findMany({
      where: { isTestData: true },
      include: { embedding: true },
    });

    const totalUsers = testUsers.length;
    const withEmbeddings = testUsers.filter(u => u.embedding).length;
    const pendingEmbeddings = totalUsers - withEmbeddings;

    console.log(`   Check ${checkCount}: ${withEmbeddings}/${totalUsers} embeddings ready (${pendingEmbeddings} pending)`);

    if (pendingEmbeddings === 0) {
      allEmbeddingsReady = true;
      console.log('\n✅ All embeddings generated!\n');
    } else {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }

  if (!allEmbeddingsReady) {
    console.log('\n⚠️  Timeout: Not all embeddings ready after 10 minutes');
    console.log('   You may need to wait longer or check the embedding queue');
    console.log('   Run this command to check status:');
    console.log('   npm run diversity:test -- --batch-id=baseline_current_system --count=100\n');
  }

  // Final summary
  const finalUsers = await prisma.user.findMany({
    where: { isTestData: true },
    include: { embedding: true },
  });

  const summary = {
    totalPersonas: finalUsers.length,
    withEmbeddings: finalUsers.filter(u => u.embedding).length,
    pendingEmbeddings: finalUsers.filter(u => !u.embedding).length,
  };

  console.log('📊 Final Summary:');
  console.log(`   Total personas: ${summary.totalPersonas}`);
  console.log(`   With embeddings: ${summary.withEmbeddings}`);
  console.log(`   Pending: ${summary.pendingEmbeddings}\n`);

  if (summary.withEmbeddings === summary.totalPersonas) {
    console.log('✅ Ready for diversity analysis!');
    console.log('\nNext step:');
    console.log('   npm run diversity:test -- --batch-id=baseline_current_system --count=100\n');
  } else {
    console.log('⚠️  Wait for remaining embeddings before running diversity analysis\n');
  }

  await app.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
