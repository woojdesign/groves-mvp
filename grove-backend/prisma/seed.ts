import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create organization
  const org = await prisma.org.upsert({
    where: { domain: 'example.com' },
    update: {},
    create: {
      name: 'Example Company',
      domain: 'example.com',
      status: 'active',
    },
  });

  console.log('✅ Created org:', org.name);

  // 2. Create test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        orgId: org.id,
        status: 'active',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        orgId: org.id,
        status: 'active',
      },
    }),
    prisma.user.upsert({
      where: { email: 'carol@example.com' },
      update: {},
      create: {
        email: 'carol@example.com',
        name: 'Carol Williams',
        orgId: org.id,
        status: 'active',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // 3. Create profiles for each user
  const profileData = [
    {
      nicheInterest: 'Vintage synthesizers and modular sound design',
      project: 'Building a custom Eurorack modular synth setup',
      connectionType: 'Share a hobby',
      rabbitHole: 'Learning about West Coast synthesis and generative music',
      preferences: 'Remote coffee chats work great for me',
    },
    {
      nicheInterest: 'Sourdough bread baking and fermentation science',
      project: 'Perfecting my starter and exploring different flour types',
      connectionType: 'Share a hobby',
      rabbitHole: 'Reading about the microbiology of fermentation',
      preferences: 'Happy to meet in person or chat online',
    },
    {
      nicheInterest: 'Urban gardening and food sustainability',
      project: 'Converting my balcony into a productive vegetable garden',
      connectionType: 'Learn something new',
      rabbitHole: 'Studying permaculture principles and companion planting',
      preferences: 'Would love to meet fellow gardeners nearby',
    },
  ];

  for (let i = 0; i < users.length; i++) {
    await prisma.profile.upsert({
      where: { userId: users[i].id },
      update: {},
      create: {
        userId: users[i].id,
        ...profileData[i],
      },
    });
  }

  console.log('✅ Created profiles for all users');

  console.log('✨ Seeding complete!');
  console.log('\nCreated:');
  console.log('  - 1 organization (Example Company)');
  console.log('  - 3 users (Alice, Bob, Carol)');
  console.log('  - 3 profiles with diverse interests');
  console.log('\nNext steps:');
  console.log('  1. Generate embeddings for users (Phase 4)');
  console.log('  2. Run matching algorithm (Phase 5)');
  console.log('  3. Test intro flow (Phase 6)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
