import { Injectable } from '@nestjs/common';

export interface MetaPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  writingStyle: string[];
  lengthTarget: { min: number; max: number };
  toneKeywords: string[];
  exampleOutput: string;
}

@Injectable()
export class MetaPersonaService {
  private readonly metaPersonas: MetaPersona[] = [
    {
      id: 'minimalist',
      name: 'The Minimalist',
      description: 'Terse, direct, economical with words',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in an extremely MINIMALIST style.

CRITICAL RULES FOR BIO (interests field):
- Use VERY short sentences or sentence fragments
- Target length: 20-60 characters total
- NO fluff, NO elaboration, NO descriptive adjectives
- Use periods to separate terse statements
- Think: "Philosophy. Logic. Truth." NOT "I'm fascinated by philosophy"
- Be direct and economical with every single word
- Strip away ALL unnecessary words

CRITICAL RULES FOR PROJECT FIELD:
- Use 1-3 words maximum
- Format: "[Verb] [noun]." or "[Noun]."
- Examples: "Building app.", "Training.", "Writing poetry.", "Coding.", "Learning Rust."
- NO explanations, NO context, NO filler words
- Target length: 10-30 characters
- Be ruthlessly concise

Examples of GOOD minimalist bios:
- "Coffee. Code. Cats."
- "Mountains. Silence. Books."
- "Data. Patterns. Insight."
- "Film noir. Jazz. Solitude."

Examples of BAD (too verbose):
- "I love exploring the fascinating world of..." (TOO LONG, TOO WORDY)
- "I'm really into..." (UNNECESSARY FILLER)

Your bio MUST be under 60 characters. Be ruthlessly concise.`,
      writingStyle: ['terse', 'direct', 'minimal', 'fragmentary'],
      lengthTarget: { min: 20, max: 60 },
      toneKeywords: ['economical', 'stripped-down', 'essential'],
      exampleOutput: 'Philosophy. Logic. Truth.',
    },
    {
      id: 'enthusiast',
      name: 'The Enthusiast',
      description: 'Energetic, exclamatory, passionate',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in an ENTHUSIASTIC, energetic style.

CRITICAL RULES FOR BIO (interests field):
- Use exclamation points naturally (but not excessively)
- Show GENUINE excitement and passion
- Use dynamic, energetic language
- Target length: 150-250 characters
- Vary sentence structure: short excited bursts AND longer passionate explanations
- Use words like: love, amazing, incredible, fascinating (when genuine)
- Convey momentum and energy in the writing

CRITICAL RULES FOR PROJECT FIELD:
- Use exclamation points naturally to show excitement
- Format: "I'm [action]! [Why it's exciting]!"
- Examples: "I'm building a recipe app from scratch! Learning so much about UI design!", "Training for my first marathon! The progress feels incredible!"
- Show genuine enthusiasm about the project
- Target length: 80-150 characters
- Convey energy and passion

Examples of GOOD enthusiast bios:
- "I absolutely LOVE tinkering with electronics! Give me a soldering iron and a pile of components, and I'll disappear into my workshop for hours. There's something magical about bringing circuits to life!"
- "Theatre is my everything! Whether I'm on stage or in the audience, the energy of live performance just electrifies me. Every show is a new adventure!"

Examples of BAD (wrong tone):
- "I'm interested in technology and enjoy learning new things." (TOO FLAT, NO ENERGY)
- "Technology!!! Electronics!!! Programming!!!" (TOO MANY EXCLAMATIONS, NO SUBSTANCE)

Show real passion, not fake enthusiasm. Make the reader feel your energy.`,
      writingStyle: ['energetic', 'exclamatory', 'passionate', 'dynamic'],
      lengthTarget: { min: 150, max: 250 },
      toneKeywords: ['excited', 'vibrant', 'animated'],
      exampleOutput:
        "I LOVE diving into new technologies! Every framework, every language - they're all puzzles waiting to be solved! There's nothing better than that aha moment when everything clicks!",
    },
    {
      id: 'academic',
      name: 'The Academic',
      description: 'Formal, analytical, precise',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in a formal ACADEMIC style.

CRITICAL RULES FOR BIO (interests field):
- Use precise, formal language
- Employ academic vocabulary and structure
- Target length: 200-350 characters
- Use phrases like: "research interests", "particular emphasis on", "intersection of"
- NO contractions (use "I am" not "I'm")
- NO casual language or slang
- Structure: state field, specify focus area, mention methodology or approach
- Sound like an academic profile or research statement

CRITICAL RULES FOR PROJECT FIELD:
- Use formal, precise academic language
- Format: "Developing [X] to [research goal/theoretical framework]."
- Examples: "Developing a computational model to analyze sentiment patterns in social media discourse.", "Researching applications of machine learning in clinical diagnostics."
- NO contractions, NO casual language
- Target length: 100-200 characters
- Sound scholarly and methodical

Examples of GOOD academic bios:
- "My research interests center on the intersection of cognitive psychology and behavioral economics, with particular emphasis on decision-making heuristics under conditions of uncertainty and information asymmetry."
- "I specialize in comparative literature, focusing on postcolonial narratives in twentieth-century African and Caribbean fiction. My methodological approach combines close textual analysis with historical contextualization."

Examples of BAD (too casual):
- "I'm really into psychology and economics!" (TOO CASUAL, NOT SCHOLARLY)
- "I study books from different countries." (TOO SIMPLE, LACKS PRECISION)

Write as if this will appear in an academic journal or university faculty page.`,
      writingStyle: ['formal', 'analytical', 'precise', 'scholarly'],
      lengthTarget: { min: 200, max: 350 },
      toneKeywords: ['rigorous', 'methodical', 'academic'],
      exampleOutput:
        'My research interests center on the intersection of cognitive psychology and behavioral economics, with particular emphasis on decision-making heuristics under conditions of uncertainty and information asymmetry.',
    },
    {
      id: 'storyteller',
      name: 'The Storyteller',
      description: 'Narrative, personal, evocative',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in a STORYTELLING, narrative style.

CRITICAL RULES FOR BIO (interests field):
- Tell a mini-story with a beginning and arc
- Use evocative, sensory details
- Target length: 250-400 characters
- Create a narrative connection: past experience → present passion
- Use vivid imagery and personal memories
- Make it feel like the opening of a memoir
- Include specific details (places, moments, sensations)
- Show transformation or journey

CRITICAL RULES FOR PROJECT FIELD:
- Create a narrative arc (past → present)
- Format: "Started [X] when [backstory]. Now I'm [progress]..."
- Examples: "Started documenting local food vendors when I moved to the city. Now I'm building a photo series and interviewing them about their journey.", "Began learning woodworking in my grandfather's workshop. These days I'm crafting furniture pieces that tell stories."
- Use evocative language and personal context
- Target length: 120-250 characters
- Make it feel like part of a larger story

Examples of GOOD storytelling bios:
- "Growing up in a small coastal town, I spent my summers watching the tides come and go, each one bringing new treasures from the deep. That early fascination with the ocean's rhythms eventually led me to marine biology, where I now study the complex ecosystems of coral reefs."
- "My grandmother's kitchen always smelled of cardamom and cinnamon. Watching her hands work the dough, I learned that baking wasn't just about recipes - it was about memory, tradition, and love. Today, as a pastry chef, I carry those lessons into every creation."

Examples of BAD (not narrative):
- "I like marine biology because oceans are interesting." (NO STORY, NO DETAIL)
- "I studied marine biology in school and now work in the field." (FACTUAL, NOT EVOCATIVE)

Write a micro-memoir. Make us see, feel, and understand the journey.`,
      writingStyle: ['narrative', 'evocative', 'personal', 'sensory'],
      lengthTarget: { min: 250, max: 400 },
      toneKeywords: ['story-driven', 'vivid', 'journey-oriented'],
      exampleOutput:
        "Growing up in a small coastal town, I spent my summers watching the tides come and go, each one bringing new treasures from the deep. That early fascination with the ocean's rhythms eventually led me to marine biology, where I now study the complex ecosystems of coral reefs.",
    },
    {
      id: 'pragmatist',
      name: 'The Pragmatist',
      description: 'Goal-oriented, structured, efficient',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in a PRAGMATIC, goal-oriented style.

CRITICAL RULES FOR BIO (interests field):
- Use structured, list-like format (but in prose, not bullet points)
- Focus on OUTCOMES and GOALS, not feelings
- Target length: 100-180 characters
- Use phrases like: "focus areas", "key skills", "core competencies", "goal:"
- Be efficient and action-oriented
- NO flowery language or emotional appeals
- Think like a LinkedIn profile or project brief
- Emphasize what you DO and what you DELIVER

CRITICAL RULES FOR PROJECT FIELD:
- Use structured, goal-oriented format
- Format: "Current project: [X]. Goal: [measurable outcome]."
- Examples: "Current project: Home automation system. Goal: reduce energy consumption by 30%.", "Project: Mobile app for budget tracking. Goal: launch MVP by Q2."
- Focus on concrete outcomes and deliverables
- Target length: 50-120 characters
- Be direct and results-focused

Examples of GOOD pragmatist bios:
- "Focus areas: project management, team coordination, delivery optimization. Key skills: Agile, Scrum, stakeholder communication. Goal: ship quality products on time."
- "Specialization: data pipeline architecture. Core competencies: ETL design, cloud infrastructure, performance tuning. Objective: reliable, scalable data systems."

Examples of BAD (too soft or emotional):
- "I'm passionate about helping teams succeed and love seeing projects come to life!" (TOO EMOTIONAL)
- "I work with data and enjoy solving problems." (TOO VAGUE, NO STRUCTURE)

Be direct, structured, and results-focused. Cut the fluff.`,
      writingStyle: ['structured', 'goal-oriented', 'efficient', 'action-focused'],
      lengthTarget: { min: 100, max: 180 },
      toneKeywords: ['practical', 'outcome-driven', 'professional'],
      exampleOutput:
        'Focus areas: project management, team coordination, delivery optimization. Key skills: Agile, Scrum, stakeholder communication. Goal: ship quality products on time.',
    },
    {
      id: 'casual',
      name: 'The Casual',
      description: 'Conversational, everyday, relatable',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in a CASUAL, conversational style.

CRITICAL RULES FOR BIO (interests field):
- Write like you're chatting with a friend
- Use contractions naturally (I'm, I've, don't)
- Target length: 80-150 characters
- Be warm and relatable, but NOT overly enthusiastic
- Use everyday language and common phrases
- OK to mention hobbies, weekend activities, simple pleasures
- Think: coffee shop conversation, not job interview
- NO corporate speak, NO buzzwords

CRITICAL RULES FOR PROJECT FIELD:
- Conversational, understated tone
- Format: "Working on [X]. [Casual observation]."
- Examples: "Working on a veggie garden. Pretty straightforward so far.", "Building a photo app. Still figuring out the UI stuff."
- Use everyday language and contractions
- Target length: 30-80 characters
- Sound relatable and down-to-earth

Examples of GOOD casual bios:
- "Love good coffee, better books, and weekend hikes. Always up for trying new restaurants or catching a live show downtown."
- "I spend way too much time browsing vinyl records and not enough time actually listening to them. Also into cycling and terrible puns."

Examples of BAD (wrong tone):
- "I am passionate about optimizing my lifestyle through curated experiences." (TOO FORMAL, BUZZWORD-Y)
- "Coffee books hiking restaurants shows!!!" (TOO SCATTERED, NO FLOW)

Write like a real person having a normal conversation. Relatable, not remarkable.`,
      writingStyle: ['conversational', 'relatable', 'everyday', 'friendly'],
      lengthTarget: { min: 80, max: 150 },
      toneKeywords: ['approachable', 'natural', 'down-to-earth'],
      exampleOutput:
        "Love good coffee, better books, and weekend hikes. Always up for trying new restaurants or catching a live show downtown.",
    },
    {
      id: 'deep-diver',
      name: 'The Deep Diver',
      description: 'Technical, detailed, comprehensive',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in a DEEP, technical style.

CRITICAL RULES FOR BIO (interests field):
- Go DEEP into technical details and complexity
- Use domain-specific terminology and concepts
- Target length: 300-500 characters
- Explain specific technologies, methodologies, or approaches
- Show sophisticated understanding of the domain
- Use precise technical language
- Reference specific frameworks, algorithms, or techniques
- Structure: introduce domain → explain focus → describe technical approach

CRITICAL RULES FOR PROJECT FIELD:
- Include technical details and depth
- Format: "Currently [action] with focus on [technical specifics]. [Methodology/tools/challenges]."
- Examples: "Currently building a distributed task queue with focus on exactly-once delivery semantics. Exploring consensus algorithms and implementing idempotency patterns.", "Developing a neural architecture for low-resource language translation with transformer-based models and cross-lingual transfer learning."
- Use domain-specific terminology
- Target length: 150-300 characters
- Show expert-level understanding

Examples of GOOD deep diver bios:
- "My work focuses on distributed systems architecture, specifically the challenges of maintaining consistency in eventually-consistent databases across multiple data centers. I'm particularly interested in conflict-free replicated data types (CRDTs) and their applications in real-time collaborative editing systems, where low latency and high availability are critical requirements."
- "I specialize in computational linguistics, developing neural architectures for low-resource language translation. My current research explores transformer-based models with cross-lingual transfer learning, focusing on morphologically rich languages where traditional tokenization approaches fail."

Examples of BAD (not technical enough):
- "I work with computer systems and databases." (TOO VAGUE, NO DEPTH)
- "I'm interested in technology and like solving complex problems." (NO TECHNICAL DETAIL)

Show mastery. Use the language of experts. Go deep.`,
      writingStyle: ['technical', 'detailed', 'comprehensive', 'expert-level'],
      lengthTarget: { min: 300, max: 500 },
      toneKeywords: ['sophisticated', 'in-depth', 'specialized'],
      exampleOutput:
        "My work focuses on distributed systems architecture, specifically the challenges of maintaining consistency in eventually-consistent databases across multiple data centers. I'm particularly interested in conflict-free replicated data types (CRDTs) and their applications in real-time collaborative editing systems.",
    },
    {
      id: 'explorer',
      name: 'The Explorer',
      description: 'Curious, open-ended, questioning',
      systemPrompt: `You are a helpful assistant that generates realistic employee profiles for a connection-matching platform. Always respond with valid JSON only, no markdown formatting.

You are generating persona bios in an EXPLORATORY, questioning style.

CRITICAL RULES FOR BIO (interests field):
- Use QUESTIONS (but not exclusively - mix statements and questions)
- Express curiosity and wonder
- Target length: 120-220 characters
- Focus on "what ifs" and "whys"
- Show intellectual curiosity across boundaries
- Use phrases like: "I'm curious about", "What makes", "How do", "I wonder"
- Connect disparate fields or ideas
- Sound genuinely inquisitive, not rhetorical

CRITICAL RULES FOR PROJECT FIELD:
- Use questions or curiosity-driven language
- Format: "Exploring [X]. What [question]? How [question]?"
- Examples: "Exploring urban foraging. What grows in cities that we can eat? How do we balance harvesting with ecosystem health?", "Diving into generative art. What makes a pattern feel organic? How can code capture randomness?"
- Express genuine curiosity and wonder
- Target length: 60-140 characters
- Sound inquisitive and open-ended

Examples of GOOD explorer bios:
- "What makes people change their minds? How do cultural narratives shape individual identity? I'm endlessly curious about the spaces between psychology, anthropology, and philosophy."
- "Why do some cities feel alive while others feel empty? I explore urban design through the lens of human behavior, always asking: what makes a place feel like home?"

Examples of BAD (wrong tone):
- "I like learning about different subjects." (NO QUESTIONS, TOO GENERIC)
- "What is psychology? What is philosophy? What is anthropology?" (TOO MANY BASIC QUESTIONS, NO DEPTH)

Ask real questions that show sophisticated curiosity. Connect unexpected domains.`,
      writingStyle: ['questioning', 'curious', 'exploratory', 'cross-disciplinary'],
      lengthTarget: { min: 120, max: 220 },
      toneKeywords: ['inquisitive', 'open', 'wondering'],
      exampleOutput:
        "What makes people change their minds? How do cultural narratives shape individual identity? I'm endlessly curious about the spaces between psychology, anthropology, and philosophy.",
    },
  ];

  /**
   * Get a random meta-persona
   */
  getRandomMetaPersona(): MetaPersona {
    const randomIndex = Math.floor(Math.random() * this.metaPersonas.length);
    return this.metaPersonas[randomIndex];
  }

  /**
   * Get a balanced distribution of meta-personas for a given count
   * Ensures relatively even distribution across all 8 types
   */
  getBalancedDistribution(count: number): MetaPersona[] {
    const distribution: MetaPersona[] = [];
    const personasPerType = Math.floor(count / this.metaPersonas.length);
    const remainder = count % this.metaPersonas.length;

    // Assign base amount to each type
    for (const metaPersona of this.metaPersonas) {
      for (let i = 0; i < personasPerType; i++) {
        distribution.push(metaPersona);
      }
    }

    // Distribute remainder randomly
    const shuffled = [...this.metaPersonas].sort(() => Math.random() - 0.5);
    for (let i = 0; i < remainder; i++) {
      distribution.push(shuffled[i]);
    }

    // Shuffle the final distribution
    return distribution.sort(() => Math.random() - 0.5);
  }

  /**
   * Get all meta-personas
   */
  getAllMetaPersonas(): MetaPersona[] {
    return [...this.metaPersonas];
  }

  /**
   * Get a meta-persona by ID
   */
  getMetaPersonaById(id: string): MetaPersona | undefined {
    return this.metaPersonas.find((mp) => mp.id === id);
  }

  /**
   * Get distribution statistics
   */
  getDistributionStats(assignments: MetaPersona[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const metaPersona of assignments) {
      stats[metaPersona.name] = (stats[metaPersona.name] || 0) + 1;
    }
    return stats;
  }
}
