import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      userId: true,
      interests: true,
      user: {
        select: {
          email: true,
          embedding: true,
        },
      },
    },
    take: 5,
  });

  console.log('\n📊 Profile Embedding Status:');
  profiles.forEach((profile) => {
    const embeddingStatus = profile.user.embedding ? '✅ Yes' : '❌ No';
    console.log(`  ${profile.user.email}: ${embeddingStatus} - ${profile.interests.slice(0, 50)}...`);
  });

  const totalProfiles = await prisma.profile.count();
  const profilesWithEmbeddings = await prisma.embedding.count();

  console.log(`\n📈 Summary: ${profilesWithEmbeddings}/${totalProfiles} profiles have embeddings\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
