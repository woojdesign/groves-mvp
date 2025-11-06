#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevService } from '../src/dev/dev.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const devService = app.get(DevService);

  console.log('🧪 Testing Project Field Generation (Phase 1 Fix)');
  console.log('=' .repeat(60));
  console.log('Generating 8 test personas (one per meta-persona)...\n');

  // Generate 8 personas (one per meta-persona type)
  const personas = await devService.generatePersonaBatchWithMetaPersonas(
    8,
    'mixed',
    undefined,
    'project_field_test',
  );

  // Check project fields
  console.log('📊 Project Fields Generated:\n');

  let totalLength = 0;
  let minLength = Infinity;
  let maxLength = 0;
  let workingOnPersonalCount = 0;

  personas.forEach((p, i) => {
    const projectLength = p.project.length;
    totalLength += projectLength;
    minLength = Math.min(minLength, projectLength);
    maxLength = Math.max(maxLength, projectLength);

    const containsPhrase = p.project.toLowerCase().includes('working on personal');
    if (containsPhrase) {
      workingOnPersonalCount++;
    }

    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Project: "${p.project}"`);
    console.log(`   Length: ${projectLength} chars`);
    console.log(`   Contains "working on personal"? ${containsPhrase ? '❌ YES (BAD!)' : '✅ No (Good!)'}`);
    console.log();
  });

  // Summary statistics
  console.log('=' .repeat(60));
  console.log('📈 Summary Statistics:\n');
  console.log(`Total personas generated: ${personas.length}`);
  console.log(`Average project length: ${Math.round(totalLength / personas.length)} chars`);
  console.log(`Min project length: ${minLength} chars`);
  console.log(`Max project length: ${maxLength} chars`);
  console.log(`Length range: ${maxLength - minLength} chars`);
  console.log(`\n"working on personal" count: ${workingOnPersonalCount}`);

  // Pass/Fail verdict
  console.log('\n' + '=' .repeat(60));
  if (workingOnPersonalCount === 0 && maxLength - minLength > 50) {
    console.log('✅ PHASE 1 TEST PASSED!');
    console.log('   - Zero "working on personal projects" instances');
    console.log(`   - Good length diversity (range: ${maxLength - minLength} chars)`);
  } else {
    console.log('❌ PHASE 1 TEST FAILED!');
    if (workingOnPersonalCount > 0) {
      console.log(`   - Found ${workingOnPersonalCount} instances of "working on personal"`);
    }
    if (maxLength - minLength <= 50) {
      console.log(`   - Insufficient length diversity (range: ${maxLength - minLength} chars)`);
    }
  }
  console.log('=' .repeat(60));

  await app.close();
}

main();
