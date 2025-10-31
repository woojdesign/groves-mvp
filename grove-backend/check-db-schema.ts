import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result: any = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'embeddings'
    ORDER BY ordinal_position;
  `;

  console.log('\n📊 Embeddings table schema:\n');
  result.forEach((row: any) => {
    console.log(`  ${row.column_name}: ${row.data_type}`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
