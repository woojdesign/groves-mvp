#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Script to generate test personas using the meta-persona architecture
 *
 * Usage:
 *   npx ts-node scripts/generate-meta-persona-test.ts
 *
 * This will:
 * 1. Delete all existing test personas
 * 2. Generate 100 new personas using meta-persona architecture
 * 3. Track meta-persona distribution
 * 4. Wait for embeddings to be generated
 * 5. Report completion
 */

async function main() {
  console.log('🚀 Starting meta-persona test data generation...\n');

  // Bootstrap NestJS application
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);
  const prisma = app.get(PrismaService);

  try {
    // Step 1: Ensure test organization exists
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

    // Step 2: Delete existing test personas
    console.log('🗑️  Deleting existing test personas...');
    const deleteResult = await prisma.profile.deleteMany({
      where: { isTestData: true },
    });
    console.log(`   Deleted ${deleteResult.count} existing test personas\n`);

    // Step 3: Generate 100 new personas with meta-persona architecture
    console.log('✨ Generating 100 personas with meta-persona architecture...');
    console.log('   This may take several minutes (100 individual API calls)\n');

    const batchId = 'meta_persona_v1';
    const count = 100;

    // Use the new meta-persona generation method
    const personas = await devService.generatePersonaBatchWithMetaPersonas(
      count,
      'mixed',
      undefined,
      batchId,
    );

    console.log(`\n✅ Generated ${personas.length} personas with meta-persona architecture\n`);

    // Step 4: Create profiles in database
    console.log('💾 Creating profiles in database...');

    const orgId = testOrgId;
    let created = 0;

    for (const persona of personas) {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: persona.email },
        });

        // Create user if not exists
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

        // Create profile
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

    // Step 5: Wait for embeddings
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
      console.log('      npm run diversity:test -- --batch-id=meta_persona_v1 --count=100');
      console.log('   2. Compare with baseline metrics');
      console.log('   3. Document improvements in comparison document\n');
    } else {
      console.log(`\n⚠️  Timeout: Only ${embeddingCount}/${created} embeddings generated`);
      console.log('   You may need to wait longer or check the embedding queue\n');
    }

    console.log('🎉 Meta-persona test data generation complete!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
