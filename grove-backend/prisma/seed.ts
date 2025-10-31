import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Diverse user personas with various interests, life stages, and company roles
const userPersonas = [
  // Early career / Junior roles
  {
    email: 'maya.chen@example.com',
    name: 'Maya Chen',
    role: 'user' as const,
    profile: {
      interests: 'Mechanical keyboard building and custom keycap design. I love the tactile feedback and the endless customization options.',
      project: 'Building my first split ergonomic keyboard with hot-swappable switches and designing a cyberpunk-themed keycap set',
      connectionType: 'collaboration' as const,
      deepDive: 'Learning about different switch types, lubing techniques, and PCB design for custom keyboards',
      preferences: 'Love meeting people who share niche hobbies! Remote chats work best for me.',
    },
  },
  {
    email: 'alex.rivera@example.com',
    name: 'Alex Rivera',
    role: 'user' as const,
    profile: {
      interests: 'Film photography with vintage cameras, especially Soviet-era cameras like the Zenit and Kiev series',
      project: 'Shooting a photo essay about urban landscapes using only expired film stock from the 1990s',
      connectionType: 'friendship' as const,
      deepDive: 'Developing my own black and white film at home and experimenting with alternative processing techniques',
      preferences: 'Would love to meet fellow photographers for weekend photo walks!',
    },
  },

  // Mid-career / Individual contributors
  {
    email: 'jordan.kim@example.com',
    name: 'Jordan Kim',
    role: 'user' as const,
    profile: {
      interests: 'Sourdough bread baking and exploring ancient grain varieties like einkorn and spelt',
      project: 'Maintaining three different sourdough starters and perfecting my naturally leavened croissants',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Reading about the microbiology of fermentation and how different flours affect gluten development',
      preferences: 'Happy to do bread trades or share starter! Flexible on meeting times.',
    },
  },
  {
    email: 'sam.okonkwo@example.com',
    name: 'Sam Okonkwo',
    role: 'user' as const,
    profile: {
      interests: 'Urban foraging and learning about edible plants in city environments, especially in neglected spaces',
      project: 'Creating a field guide to edible plants in my neighborhood and teaching foraging basics to community members',
      connectionType: 'collaboration' as const,
      deepDive: 'Studying ethnobotany and the history of Indigenous plant knowledge in my region',
      preferences: 'Love in-person meetups for actual foraging walks! Weekends work best.',
    },
  },
  {
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    role: 'user' as const,
    profile: {
      interests: 'Retro computing and restoring vintage computers from the 80s and 90s, especially Commodore and Amiga systems',
      project: 'Restoring a Commodore 64 and learning to code demos in 6502 assembly language',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Exploring the demoscene and understanding how programmers pushed hardware to its absolute limits',
      preferences: 'Remote coffee chats are perfect. Love talking tech history!',
    },
  },

  // Senior / Leadership roles
  {
    email: 'chris.martinez@example.com',
    name: 'Chris Martinez',
    role: 'org_admin' as const,
    profile: {
      interests: 'Bonsai cultivation and Japanese aesthetics, especially the wabi-sabi philosophy',
      project: 'Developing a 10-year plan for a juniper bonsai and studying traditional Japanese pruning techniques',
      connectionType: 'mentorship' as const,
      deepDive: 'Reading about Zen Buddhism and how it influences Japanese garden design',
      preferences: 'Morning coffee or lunch works well. Prefer in-person for building real connections.',
    },
  },
  {
    email: 'taylor.johnson@example.com',
    name: 'Taylor Johnson',
    role: 'org_admin' as const,
    profile: {
      interests: 'Letterpress printing and bookbinding, especially creating limited edition artist books',
      project: 'Setting up a small letterpress studio in my garage and learning traditional printing techniques',
      connectionType: 'collaboration' as const,
      deepDive: 'Collecting vintage type specimens and studying the history of typography',
      preferences: 'Flexible schedule. Happy to show people my studio!',
    },
  },

  // Different interest areas
  {
    email: 'riley.patel@example.com',
    name: 'Riley Patel',
    role: 'user' as const,
    profile: {
      interests: 'Mycology and mushroom cultivation, especially growing gourmet and medicinal mushrooms at home',
      project: 'Cultivating lion\'s mane and oyster mushrooms using low-tech methods and experimenting with different substrates',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Learning about the ecological role of fungi and their potential in bioremediation',
      preferences: 'Love meeting outdoors! Foraging season is the best time to connect.',
    },
  },
  {
    email: 'morgan.wu@example.com',
    name: 'Morgan Wu',
    role: 'user' as const,
    profile: {
      interests: 'Vintage synthesizers and creating ambient music with modular gear and tape loops',
      project: 'Building a home studio focused on generative music systems and releasing monthly ambient albums',
      connectionType: 'collaboration' as const,
      deepDive: 'Exploring West Coast synthesis techniques and the philosophy of Brian Eno\'s ambient music',
      preferences: 'Evening hangs or studio sessions welcome. Love collaborating with other musicians!',
    },
  },
  {
    email: 'casey.brown@example.com',
    name: 'Casey Brown',
    role: 'user' as const,
    profile: {
      interests: 'Fountain pens and handwritten correspondence, especially vintage flex nib pens from the 1920s-40s',
      project: 'Writing weekly letters to friends and family using different vintage pens and learning calligraphy',
      connectionType: 'friendship' as const,
      deepDive: 'Studying different ink properties and how they interact with various paper types',
      preferences: 'Love the idea of having a pen pal! Flexible on meeting times.',
    },
  },

  // More diverse interests
  {
    email: 'avery.lee@example.com',
    name: 'Avery Lee',
    role: 'user' as const,
    profile: {
      interests: 'Fermentation beyond food - kombucha, kimchi, miso, and experimental ferments with unusual ingredients',
      project: 'Maintaining a fermentation station with 12+ active projects and documenting flavor development over time',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Reading about lactic acid bacteria strains and their role in flavor development',
      preferences: 'Happy to trade ferments and share cultures! Flexible schedule.',
    },
  },
  {
    email: 'skylar.anderson@example.com',
    name: 'Skylar Anderson',
    role: 'user' as const,
    profile: {
      interests: 'Urban cycling and bicycle mechanics, especially restoring vintage steel frame bikes',
      project: 'Converting a 1980s Schwinn into a modern single-speed commuter with period-appropriate components',
      connectionType: 'collaboration' as const,
      deepDive: 'Learning about bicycle frame geometry and how it affects ride quality',
      preferences: 'Love group rides or wrenching sessions! Weekends work best.',
    },
  },
  {
    email: 'quinn.garcia@example.com',
    name: 'Quinn Garcia',
    role: 'user' as const,
    profile: {
      interests: 'Zine making and DIY publishing, especially exploring risograph printing and collage techniques',
      project: 'Creating a quarterly zine about local music scenes and teaching zine-making workshops',
      connectionType: 'collaboration' as const,
      deepDive: 'Collecting vintage magazines for collage material and studying underground publishing history',
      preferences: 'Coffee shop meetups are my favorite. Love sharing zines in person!',
    },
  },

  // Tech-adjacent interests
  {
    email: 'rowan.nguyen@example.com',
    name: 'Rowan Nguyen',
    role: 'user' as const,
    profile: {
      interests: 'Building mechanical automata and kinetic sculptures inspired by 19th-century clockwork designs',
      project: 'Creating a wooden automaton that writes with a pen, using only gears and cams for movement',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Studying the work of Pierre Jaquet-Droz and modern makers like Cabaret Mechanical Theatre',
      preferences: 'Love showing works in progress! Studio visits welcome.',
    },
  },
  {
    email: 'dakota.thompson@example.com',
    name: 'Dakota Thompson',
    role: 'user' as const,
    profile: {
      interests: 'Analog electronics and building guitar effects pedals from scratch, especially fuzz and overdrive circuits',
      project: 'Designing and etching my own PCBs for a series of boutique-style effects pedals',
      connectionType: 'collaboration' as const,
      deepDive: 'Learning about transistor characteristics and how different components affect tone',
      preferences: 'Evening hangs work great. Love jamming with other musicians!',
    },
  },

  // Creative pursuits
  {
    email: 'emerson.lopez@example.com',
    name: 'Emerson Lopez',
    role: 'user' as const,
    profile: {
      interests: 'Botanical illustration and nature journaling, combining watercolor painting with scientific observation',
      project: 'Creating a year-long nature journal documenting seasonal changes in my local park',
      connectionType: 'friendship' as const,
      deepDive: 'Studying historical botanical illustrators like Maria Sibylla Merian and learning plant identification',
      preferences: 'Love outdoor sketching sessions! Flexible schedule, prefer daytime.',
    },
  },
  {
    email: 'reese.walker@example.com',
    name: 'Reese Walker',
    role: 'user' as const,
    profile: {
      interests: 'Home coffee roasting and exploring single-origin beans from small farms around the world',
      project: 'Roasting beans in a popcorn popper and developing my cupping skills to better understand flavor profiles',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Learning about coffee processing methods and how they affect flavor - natural vs washed vs honey',
      preferences: 'Morning coffee meetings are perfect! Love doing cuppings together.',
    },
  },

  // Outdoor/physical activities
  {
    email: 'sage.mitchell@example.com',
    name: 'Sage Mitchell',
    role: 'user' as const,
    profile: {
      interests: 'Rock climbing route setting and understanding movement patterns, especially on bouldering problems',
      project: 'Training for outdoor climbing season and learning to read rock features and plan routes',
      connectionType: 'collaboration' as const,
      deepDive: 'Studying climbing movement analysis and how body mechanics affect performance',
      preferences: 'Climbing sessions or outdoor adventures! Weekends and evenings work.',
    },
  },
  {
    email: 'charlie.davis@example.com',
    name: 'Charlie Davis',
    role: 'user' as const,
    profile: {
      interests: 'Orienteering and map reading, especially enjoying the challenge of navigation without GPS',
      project: 'Training for orienteering competitions and creating detailed mental maps of local trail systems',
      connectionType: 'collaboration' as const,
      deepDive: 'Learning about topographic map interpretation and historical surveying techniques',
      preferences: 'Outdoor meetups preferred! Love combining hiking with navigation challenges.',
    },
  },

  // Wellness/lifestyle
  {
    email: 'river.santos@example.com',
    name: 'River Santos',
    role: 'user' as const,
    profile: {
      interests: 'Herbalism and making plant-based remedies, tinctures, and salves from garden-grown herbs',
      project: 'Growing a medicinal herb garden and learning about traditional herbal medicine practices',
      connectionType: 'knowledge_exchange' as const,
      deepDive: 'Studying the history of folk medicine and modern research on herbal compounds',
      preferences: 'Love garden visits and plant swaps! Flexible schedule.',
    },
  },
];

async function main() {
  console.log('🌱 Seeding database with diverse personas...');

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

  // 2. Create super admin user (separate from personas)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      orgId: org.id,
      role: 'super_admin',
      status: 'active',
    },
  });

  console.log('✅ Created super admin:', admin.email);

  // 3. Create users with diverse personas
  console.log(`\n📝 Creating ${userPersonas.length} users with diverse backgrounds...`);

  for (const persona of userPersonas) {
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: {},
      create: {
        email: persona.email,
        name: persona.name,
        orgId: org.id,
        role: persona.role,
        status: 'active',
      },
    });

    // Create profile for this user
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ...persona.profile,
      },
    });

    console.log(`   ✓ ${persona.name} - ${persona.profile.interests.slice(0, 50)}...`);
  }

  console.log('\n✨ Seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  - 1 organization (Example Company)');
  console.log(`  - ${userPersonas.length + 1} total users:`);
  console.log('    • 1 super admin (admin@example.com)');
  console.log(`    • ${userPersonas.filter(p => p.role === 'org_admin').length} org admins`);
  console.log(`    • ${userPersonas.filter(p => p.role === 'user').length} regular users`);
  console.log(`  - ${userPersonas.length} diverse profiles with interests spanning:`);
  console.log('    • Creative arts (photography, printing, illustration)');
  console.log('    • Maker culture (keyboards, electronics, automata)');
  console.log('    • Food & fermentation (bread, coffee, mushrooms)');
  console.log('    • Outdoor activities (climbing, cycling, foraging)');
  console.log('    • Vintage tech (computers, synths, cameras)');
  console.log('    • And more...');
  console.log('\n🎯 Next steps:');
  console.log('  1. Embeddings will be generated automatically for all profiles');
  console.log('  2. Matching algorithm will find connections based on shared interests');
  console.log('  3. Test with any user email (e.g., maya.chen@example.com)');
  console.log('\n💡 Tip: Users with overlapping interests will get better matches!');
  console.log('  Example matches to expect:');
  console.log('  • Maya (keyboards) + Dakota (electronics) = shared interest in building things');
  console.log('  • Jordan (bread) + Avery (fermentation) = fermentation science');
  console.log('  • Alex (film) + Emerson (illustration) = visual arts');
  console.log('  • Sam (foraging) + Riley (mushrooms) = nature exploration');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
