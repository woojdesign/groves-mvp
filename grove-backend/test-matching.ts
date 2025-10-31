import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find River Santos
  const user = await prisma.user.findUnique({
    where: { email: 'river.santos@example.com' },
    include: {
      profile: true,
      embedding: true,
    },
  });

  if (!user) {
    console.error('❌ User not found');
    return;
  }

  console.log('\n👤 Testing matches for:', user.name);
  console.log('📧 Email:', user.email);
  console.log('✅ Has Profile:', !!user.profile);
  console.log('✅ Has Embedding:', !!user.embedding);

  if (user.profile) {
    console.log('\n📝 Profile:');
    console.log('  Interest:', user.profile.nicheInterest.slice(0, 80) + '...');
    console.log('  Project:', user.profile.project.slice(0, 80) + '...');
  }

  // Check for existing matches
  const existingMatches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
      status: 'pending',
    },
    include: {
      userA: { select: { name: true, email: true } },
      userB: { select: { name: true, email: true } },
    },
  });

  console.log('\n📊 Existing Matches:', existingMatches.length);

  if (existingMatches.length > 0) {
    console.log('\n🎯 Current Matches:');
    existingMatches.forEach((match, i) => {
      const partner = match.userAId === user.id ? match.userB : match.userA;
      console.log(`  ${i + 1}. ${partner.name} (${partner.email})`);
      console.log(`     Score: ${match.similarityScore.toFixed(3)}`);
      console.log(`     Reason: ${match.context || match.sharedInterest}`);
    });
  }

  // Check how many users have embeddings
  const usersWithEmbeddings = await prisma.embedding.count();
  const totalUsers = await prisma.user.count({
    where: { status: 'active' },
  });

  console.log('\n📈 System Stats:');
  console.log(`  ${usersWithEmbeddings}/${totalUsers} users have embeddings`);

  // Test cosine similarity query directly
  if (user.embedding) {
    console.log('\n🔬 Testing Vector Similarity Query...');

    const similarUsers: any = await prisma.$queryRaw`
      SELECT
        u.email,
        u.name,
        p.niche_interest,
        1 - (e.embedding <=> (SELECT embedding FROM embeddings WHERE user_id::text = ${user.id})) AS similarity_score
      FROM embeddings e
      JOIN users u ON e.user_id::text = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE e.user_id::text != ${user.id}
        AND e.embedding IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT 5
    `;

    console.log('\n🎯 Top 5 Similar Users (by embedding):');
    similarUsers.forEach((u: any, i: number) => {
      console.log(`  ${i + 1}. ${u.name} (${u.email})`);
      console.log(`     Score: ${u.similarity_score.toFixed(3)}`);
      console.log(`     Interest: ${u.niche_interest.slice(0, 60)}...`);
    });
  }

  console.log('\n✨ Test complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
