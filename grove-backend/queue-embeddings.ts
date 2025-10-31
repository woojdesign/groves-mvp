import { PrismaClient } from '@prisma/client';
import Bull from 'bull';

const prisma = new PrismaClient();

// Redis connection (same as in app)
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

async function main() {
  // Connect to the embedding-generation queue
  const embeddingQueue = new Bull('embedding-generation', {
    redis: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  });

  console.log('🔍 Finding profiles without embeddings...\n');

  // Find all profiles that don't have embeddings
  const profilesWithoutEmbeddings = await prisma.profile.findMany({
    where: {
      user: {
        embedding: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  console.log(`📝 Found ${profilesWithoutEmbeddings.length} profiles without embeddings\n`);

  if (profilesWithoutEmbeddings.length === 0) {
    console.log('✅ All profiles already have embeddings!');
    await embeddingQueue.close();
    return;
  }

  console.log('⚡ Queuing embedding generation jobs...\n');

  for (const profile of profilesWithoutEmbeddings) {
    await embeddingQueue.add(
      {
        userId: profile.userId,
        profileId: profile.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    console.log(`  ✓ Queued: ${profile.user.email} - ${profile.nicheInterest.slice(0, 50)}...`);
  }

  console.log(`\n✨ Successfully queued ${profilesWithoutEmbeddings.length} embedding generation jobs!`);
  console.log('\n📊 Jobs will be processed by the background worker.');
  console.log('   Check the backend logs for processing status.\n');

  await embeddingQueue.close();
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
