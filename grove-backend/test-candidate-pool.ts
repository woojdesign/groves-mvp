import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const riverUser = await prisma.user.findUnique({
    where: { email: 'river.santos@example.com' },
  });

  if (!riverUser) {
    console.error('User not found');
    return;
  }

  console.log('\n🔍 Testing Candidate Pool Query...\n');
  console.log('Source User:', riverUser.email);
  console.log('Source User ID:', riverUser.id);

  // Test the exact query from VectorMatchingEngine
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: riverUser.id },
      status: 'active',
      embedding: {
        isNot: null, // Must have embedding
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
    take: 100,
  });

  console.log(`\n📊 Found ${candidates.length} candidates with embeddings`);

  if (candidates.length > 0) {
    console.log('\n✅ Sample candidates:');
    candidates.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.email})`);
    });
  } else {
    console.log('\n❌ No candidates found! This is the problem.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
