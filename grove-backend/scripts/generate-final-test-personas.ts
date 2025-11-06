#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Script to generate 100 test personas with ALL PHASE 1-4 FIXES applied
 *
 * Usage:
 *   npx ts-node scripts/generate-final-test-personas.ts
 *
 * This script generates personas with:
 * - Phase 1: Distinct project field templates per meta-persona
 * - Phase 2: 35 interest categories (expanded from 15)
 * - Phase 3: Deduplication check
 * - Phase 4: Enhanced conditioning (life stage, expertise, geographic hints)
 */

async function main() {
  console.log('🚀 Generating FINAL TEST PERSONAS with all Phase 1-4 fixes...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);
  const prisma = app.get(PrismaService);

  try {
    // Ensure test organization exists
    console.log('🏢 Ensuring test organization exists...');
    const testOrgId = '00000000-0000-0000-0000-000000000000';

    let testOrg = await prisma.org.findUnique({
      where: { id: testOrgId },
    });

    if (!testOrg) {
      testOrg = await prisma.org.create({
        data: {
          id: testOrgId,
          name: 'Test Organization',
          domain: 'test.grove.local',
          status: 'active',
        },
      });
      console.log('   ✅ Created test organization\n');
    } else {
      console.log('   ✅ Test organization already exists\n');
    }

    // Delete existing test personas
    console.log('🗑️  Deleting existing test personas...');
    const deleteResult = await prisma.profile.deleteMany({
      where: { isTestData: true },
    });
    console.log(`   Deleted ${deleteResult.count} existing test personas\n`);

    // Generate 100 new personas with ALL FIXES
    console.log('✨ Generating 100 personas with ALL Phase 1-4 fixes applied...');
    console.log('   - Phase 1: Distinct project field templates');
    console.log('   - Phase 2: 35 interest categories (up from 15)');
    console.log('   - Phase 3: Deduplication check');
    console.log('   - Phase 4: Enhanced conditioning (life stage, expertise, geographic)');
    console.log('   This may take several minutes (100 individual API calls)\n');

    const batchId = 'phase5_final_test';
    const count = 100;

    const startTime = Date.now();

    const personas = await devService.generatePersonaBatchWithMetaPersonas(
      count,
      'mixed',
      undefined,
      batchId,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Generated ${personas.length} personas in ${duration}s\n`);

    // Create profiles in database
    console.log('💾 Creating profiles in database...');

    const orgId = testOrgId;
    let created = 0;

    for (const persona of personas) {
      try {
        let user = await prisma.user.findUnique({
          where: { email: persona.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: persona.email,
              name: persona.name,
              orgId: orgId,
              isTestData: true,
            },
          });
        }

        await prisma.profile.create({
          data: {
            userId: user.id,
            interests: persona.interests,
            project: persona.project,
            deepDive: persona.deepDive,
            connectionType: persona.connectionType,
            preferences: persona.preferences,
            isTestData: true,
          },
        });

        created++;
      } catch (error: any) {
        console.error(`   ❌ Failed to create profile for ${persona.name}: ${error.message}`);
      }
    }

    console.log(`   Created ${created} profiles in database\n`);

    // Wait for embeddings
    console.log('⏳ Waiting for embeddings to be generated...');
    console.log('   (Checking every 5 seconds)\n');

    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max
    let embeddingCount = 0;

    while (attempts < maxAttempts) {
      embeddingCount = await prisma.embedding.count({
        where: {
          user: {
            isTestData: true,
          },
        },
      });

      const percentage = ((embeddingCount / created) * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${embeddingCount}/${created} embeddings (${percentage}%)`);

      if (embeddingCount === created) {
        console.log('\n');
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    if (embeddingCount === created) {
      console.log('✅ All embeddings generated successfully!\n');
      console.log('📊 Next steps:');
      console.log('   1. Run diversity analysis:');
      console.log('      cd /workspace/grove-backend/diversity-metrics');
      console.log('      npx ts-node analyze-diversity.ts phase5_final_test 100');
      console.log('   2. Check for "working on personal projects" phrase:');
      console.log('      grep -i "working on personal" diversity-metrics/phase5_final_test/*.json');
      console.log('   3. Compare metrics with baseline and phase 4 results\n');
    } else {
      console.log(`\n⚠️  Timeout: Only ${embeddingCount}/${created} embeddings generated`);
      console.log('   You may need to wait longer or check the embedding queue\n');
    }

    console.log('🎉 Phase 5 final test persona generation complete!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
