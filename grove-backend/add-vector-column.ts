import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding vector column to embeddings table...\n');

  try {
    // First, enable the pgvector extension
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');

    // Add the embedding column
    await prisma.$executeRawUnsafe('ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS embedding vector(1536);');
    console.log('✅ Added embedding column (vector(1536))');

    // Create the IVFFlat index for fast similarity search
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS embeddings_embedding_idx
      ON embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Created IVFFlat index for similarity search');

    console.log('\n✨ Database schema updated successfully!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
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
