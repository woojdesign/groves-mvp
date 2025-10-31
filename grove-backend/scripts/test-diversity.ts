#!/usr/bin/env ts-node

/**
 * CLI tool for testing persona diversity
 *
 * Usage:
 *   npm run diversity:test -- --batch-id=batch_001 --count=100
 *   npm run diversity:compare -- --baseline=batch_001 --experiment=batch_002
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DiversityTestingService } from '../src/dev/diversity-testing/diversity-testing.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const app = await NestFactory.createApplicationContext(AppModule);
  const diversityService = app.get(DiversityTestingService);
  const prisma = app.get(PrismaService);

  if (command === 'analyze') {
    // Get batch ID and count from args
    const batchId = args.find(a => a.startsWith('--batch-id='))?.split('=')[1] || 'unnamed';
    const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '100');

    console.log(`Analyzing ${count} most recent test personas...`);

    // Fetch personas from database
    const users = await prisma.user.findMany({
      where: { isTestData: true },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: count,
    });

    if (users.length === 0) {
      console.error('No test personas found in database. Generate some first!');
      process.exit(1);
    }

    const personas = users.map(u => ({
      id: u.id,
      interests: u.profile?.interests || '',
      project: u.profile?.project || '',
      deepDive: u.profile?.deepDive || undefined,
    }));

    const result = await diversityService.analyzeQuick({
      personas,
      batchId,
      saveResults: true,
    });

    console.log('\n' + result.summary);
  } else if (command === 'compare') {
    const baseline = args.find(a => a.startsWith('--baseline='))?.split('=')[1];
    const experiment = args.find(a => a.startsWith('--experiment='))?.split('=')[1];

    if (!baseline || !experiment) {
      console.error('Usage: npm run diversity:compare -- --baseline=batch_001 --experiment=batch_002');
      process.exit(1);
    }

    const result = await diversityService.compare(baseline, experiment);
    console.log('\n' + result.summary);
  } else {
    console.error('Unknown command. Use "analyze" or "compare"');
    process.exit(1);
  }

  await app.close();
}

main().catch(console.error);
