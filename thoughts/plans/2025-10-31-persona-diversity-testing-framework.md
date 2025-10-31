# Persona Diversity Testing Framework

**Date:** 2025-10-31
**Purpose:** Quantitative framework for measuring and iterating on persona generation diversity

## Testing Architecture

### Tier 1: Quick Metrics (Run After Every Generation)
**Speed**: <5 seconds for 100 personas
**Purpose**: Immediate feedback

### Tier 2: Deep Analysis (Run Daily/Weekly)
**Speed**: 30-60 seconds for 100 personas
**Purpose**: Understand clustering patterns

### Tier 3: Human Validation (Run on Major Changes)
**Speed**: 30 minutes for 100 personas
**Purpose**: Qualitative validation of metrics

---

## Tier 1: Quick Metrics

### 1.1 Embedding Similarity Analysis

**What it measures**: Semantic similarity of persona content

**Implementation**:
```typescript
interface SimilarityMetrics {
  avgPairwiseSimilarity: number;      // 0-1 (lower = more diverse)
  minSimilarity: number;               // Least similar pair
  maxSimilarity: number;               // Most similar pair
  similarityStdDev: number;            // Variance in similarities
  clusteredPairs: number;              // Pairs with similarity > 0.85
}

async function calculateEmbeddingSimilarity(personas: Persona[]): Promise<SimilarityMetrics> {
  // 1. Generate embeddings for all personas
  const embeddings = await Promise.all(
    personas.map(p =>
      openai.generateEmbedding(`${p.interests}. ${p.project}. ${p.deepDive || ''}`)
    )
  );

  // 2. Calculate pairwise cosine similarities
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      similarities.push(sim);
    }
  }

  // 3. Calculate metrics
  return {
    avgPairwiseSimilarity: mean(similarities),
    minSimilarity: min(similarities),
    maxSimilarity: max(similarities),
    similarityStdDev: stdDev(similarities),
    clusteredPairs: similarities.filter(s => s > 0.85).length
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}
```

**Target Metrics**:
- `avgPairwiseSimilarity`: **< 0.40** (currently likely ~0.70-0.85)
- `clusteredPairs`: **< 5%** of total pairs (currently likely 20-40%)
- `similarityStdDev`: **> 0.15** (want high variance)

### 1.2 Length Distribution Analysis

**What it measures**: Variation in persona description lengths

**Implementation**:
```typescript
interface LengthMetrics {
  avgLength: number;
  minLength: number;
  maxLength: number;
  stdDev: number;
  distribution: {
    short: number;      // < 100 chars (%)
    medium: number;     // 100-200 chars (%)
    long: number;       // 200-300 chars (%)
    veryLong: number;   // > 300 chars (%)
  };
}

function analyzeLengthDistribution(personas: Persona[]): LengthMetrics {
  const lengths = personas.map(p =>
    `${p.interests} ${p.project} ${p.deepDive || ''}`.length
  );

  const buckets = {
    short: lengths.filter(l => l < 100).length / lengths.length,
    medium: lengths.filter(l => l >= 100 && l < 200).length / lengths.length,
    long: lengths.filter(l => l >= 200 && l < 300).length / lengths.length,
    veryLong: lengths.filter(l => l >= 300).length / lengths.length,
  };

  return {
    avgLength: mean(lengths),
    minLength: min(lengths),
    maxLength: max(lengths),
    stdDev: stdDev(lengths),
    distribution: buckets
  };
}
```

**Target Metrics**:
- `stdDev`: **> 50** (want significant variance)
- Distribution: Should match target (20% short, 30% medium, 30% long, 15% very long, 5% extreme)

### 1.3 N-gram Repetition Analysis

**What it measures**: Phrase-level repetition (word patterns)

**Implementation**:
```typescript
interface NgramMetrics {
  uniqueTrigrams: number;
  totalTrigrams: number;
  trigramDiversity: number;        // unique/total (higher = better)
  top10RepeatedTrigrams: Array<{
    trigram: string;
    count: number;
  }>;
}

function analyzeNgrams(personas: Persona[]): NgramMetrics {
  const allText = personas
    .map(p => `${p.interests} ${p.project} ${p.deepDive || ''}`)
    .join(' ')
    .toLowerCase();

  // Extract trigrams
  const words = allText.split(/\s+/);
  const trigrams: string[] = [];
  for (let i = 0; i < words.length - 2; i++) {
    trigrams.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }

  const trigramCounts = new Map<string, number>();
  trigrams.forEach(t => {
    trigramCounts.set(t, (trigramCounts.get(t) || 0) + 1);
  });

  const uniqueTrigrams = trigramCounts.size;
  const totalTrigrams = trigrams.length;

  const top10 = Array.from(trigramCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([trigram, count]) => ({ trigram, count }));

  return {
    uniqueTrigrams,
    totalTrigrams,
    trigramDiversity: uniqueTrigrams / totalTrigrams,
    top10RepeatedTrigrams: top10
  };
}
```

**Target Metrics**:
- `trigramDiversity`: **> 0.80** (80%+ unique trigrams)
- `top10RepeatedTrigrams`: No trigram should appear > 5 times in 100 personas

---

## Tier 2: Deep Analysis

### 2.1 LLM Cluster-agent Analysis

**What it measures**: Semantic clustering across multiple dimensions

**Implementation**:
```typescript
interface ClusterMetrics {
  clusteringDimensions: string[];
  clusters: Map<string, Persona[]>;
  diversityScore: number;          // clusters / avg_cluster_size
  dimensionEntropy: Map<string, number>;  // Entropy per dimension
}

async function performClusterAnalysis(personas: Persona[]): Promise<ClusterMetrics> {
  // Step 1: Extract clustering dimensions
  const sampleSize = Math.min(20, personas.length);
  const samples = personas.slice(0, sampleSize);

  const dimensionsPrompt = `
Analyze these ${sampleSize} personas and identify 3-5 semantic dimensions
that meaningfully distinguish them.

Personas:
${samples.map((p, i) => `${i+1}. ${p.name}: ${p.interests}. ${p.project}`).join('\n')}

For each dimension, provide:
1. Dimension name (e.g., "writing_style", "complexity", "life_stage")
2. Possible values (e.g., ["minimalist", "verbose", "technical"])
3. Brief explanation

Return as JSON:
{
  "dimensions": [
    {
      "name": "writing_style",
      "values": ["minimalist", "verbose", "academic", "casual"],
      "description": "How the persona expresses themselves"
    },
    ...
  ]
}
  `;

  const dimensionsResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: dimensionsPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3  // Lower temp for consistent analysis
  });

  const { dimensions } = JSON.parse(dimensionsResponse.choices[0].message.content);

  // Step 2: Classify all personas
  const classifications = await Promise.all(
    personas.map(async (persona) => {
      const classifyPrompt = `
Classify this persona on these dimensions:
${dimensions.map(d => `- ${d.name}: [${d.values.join(', ')}]`).join('\n')}

Persona: ${persona.name}
Interests: ${persona.interests}
Project: ${persona.project}
${persona.deepDive ? `Deep Dive: ${persona.deepDive}` : ''}

Return JSON: {"classifications": {"dimension_name": "value", ...}}
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: classifyPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content).classifications;
    })
  );

  // Step 3: Build clusters
  const clusters = new Map<string, Persona[]>();
  personas.forEach((persona, i) => {
    const clusterKey = JSON.stringify(classifications[i]);
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey).push(persona);
  });

  // Step 4: Calculate diversity score
  const clusterSizes = Array.from(clusters.values()).map(c => c.length);
  const avgClusterSize = mean(clusterSizes);
  const diversityScore = clusters.size / avgClusterSize;

  // Step 5: Calculate entropy per dimension
  const dimensionEntropy = new Map<string, number>();
  dimensions.forEach(dim => {
    const valueCounts = new Map<string, number>();
    classifications.forEach(c => {
      const value = c[dim.name];
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });

    // Shannon entropy: -Σ p(x) * log2(p(x))
    const total = personas.length;
    const entropy = -Array.from(valueCounts.values())
      .map(count => {
        const p = count / total;
        return p * Math.log2(p);
      })
      .reduce((sum, val) => sum + val, 0);

    dimensionEntropy.set(dim.name, entropy);
  });

  return {
    clusteringDimensions: dimensions.map(d => d.name),
    clusters,
    diversityScore,
    dimensionEntropy
  };
}
```

**Target Metrics**:
- `diversityScore`: **> 0.70** (70+ clusters for 100 personas)
- `dimensionEntropy`: **> 1.5** per dimension (high entropy = balanced distribution)
- Largest cluster: **< 10%** of total personas

### 2.2 Topic Diversity Analysis

**What it measures**: Coverage of interest categories

**Implementation**:
```typescript
interface TopicMetrics {
  categoryDistribution: Map<string, number>;
  uniqueInterestKeywords: Set<string>;
  topicEntropy: number;
  underrepresentedCategories: string[];  // < 5% of total
  overrepresentedCategories: string[];   // > 15% of total
}

function analyzeTopicDistribution(personas: Persona[]): TopicMetrics {
  const INTEREST_CATEGORIES = [
    'Creative', 'Tech', 'Outdoor', 'Food', 'Wellness',
    'Maker', 'Sports', 'Music', 'Gaming', 'Reading',
    'DIY', 'Collecting', 'Social', 'Learning', 'Craft'
  ];

  // Extract keywords from all personas
  const keywords = new Set<string>();
  personas.forEach(p => {
    const text = `${p.interests} ${p.project} ${p.deepDive || ''}`.toLowerCase();
    // Simple keyword extraction (production: use NLP)
    text.split(/\s+/).forEach(word => {
      if (word.length > 4) keywords.add(word);
    });
  });

  // Classify personas into categories (simplified)
  const categoryDistribution = new Map<string, number>();
  INTEREST_CATEGORIES.forEach(cat => categoryDistribution.set(cat, 0));

  personas.forEach(p => {
    const text = `${p.interests} ${p.project}`.toLowerCase();
    // Classify based on keyword matching (simplified)
    INTEREST_CATEGORIES.forEach(cat => {
      if (text.includes(cat.toLowerCase())) {
        categoryDistribution.set(cat, categoryDistribution.get(cat) + 1);
      }
    });
  });

  // Calculate entropy
  const total = personas.length;
  const entropy = -Array.from(categoryDistribution.values())
    .filter(count => count > 0)
    .map(count => {
      const p = count / total;
      return p * Math.log2(p);
    })
    .reduce((sum, val) => sum + val, 0);

  // Identify imbalanced categories
  const underrepresented = Array.from(categoryDistribution.entries())
    .filter(([_, count]) => count / total < 0.05)
    .map(([cat, _]) => cat);

  const overrepresented = Array.from(categoryDistribution.entries())
    .filter(([_, count]) => count / total > 0.15)
    .map(([cat, _]) => cat);

  return {
    categoryDistribution,
    uniqueInterestKeywords: keywords,
    topicEntropy: entropy,
    underrepresentedCategories: underrepresented,
    overrepresentedCategories: overrepresented
  };
}
```

**Target Metrics**:
- `topicEntropy`: **> 3.5** (balanced across 15 categories)
- `underrepresentedCategories`: **0** (all categories > 5%)
- `overrepresentedCategories`: **0** (no category > 15%)

---

## Tier 3: Human Validation

### 3.1 Qualitative Review Process

**Sample Size**: 20 random personas per batch

**Review Dimensions**:
1. **Authenticity** (1-5): Does this feel like a real person?
2. **Diversity** (1-5): Compared to previous 5, how different is this?
3. **Complexity** (1-5): How nuanced is this persona?
4. **Writing Quality** (1-5): Natural language or "AI-generated"?

**Implementation**:
```typescript
interface HumanReview {
  personaId: string;
  authenticity: 1 | 2 | 3 | 4 | 5;
  diversity: 1 | 2 | 3 | 4 | 5;
  complexity: 1 | 2 | 3 | 4 | 5;
  writingQuality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}
```

**Target Metrics**:
- Avg authenticity: **> 3.5**
- Avg diversity: **> 4.0**
- Avg complexity: **> 3.0**

### 3.2 A/B Comparison Tests

**Purpose**: Compare two generation strategies

**Process**:
1. Generate 50 personas with Strategy A
2. Generate 50 personas with Strategy B
3. Shuffle and present pairs to reviewer (blind)
4. Ask: "Which feels more diverse/realistic?"

**Track win rate**: Strategy should win > 60% to be considered improvement

---

## Testing Workflow

### After Each Generation Batch (100 personas)

```bash
# 1. Run quick metrics
npm run test:diversity:quick

# Output:
# ✓ Embedding Similarity
#   - Average: 0.38 ✓ (target: < 0.40)
#   - Clustered pairs: 3.2% ✓ (target: < 5%)
#   - Std dev: 0.18 ✓ (target: > 0.15)
#
# ✓ Length Distribution
#   - Std dev: 62 ✓ (target: > 50)
#   - Distribution: 18% short, 32% medium, 28% long, 17% veryLong, 5% extreme
#
# ⚠ N-gram Diversity
#   - Trigram diversity: 0.76 ⚠ (target: > 0.80)
#   - Top repeated: "I've been into" (8 times)

# 2. Store results
npm run test:diversity:save -- --batch-id=batch_20251031_001
```

### Weekly Deep Analysis

```bash
# Run cluster analysis on latest 100 personas
npm run test:diversity:deep

# Output:
# ✓ Cluster Analysis
#   - Diversity score: 0.73 ✓ (target: > 0.70)
#   - Clusters found: 68 unique
#   - Largest cluster: 4 personas (6%)
#   - Dimensions: writing_style, complexity, life_stage, tone
#
# Dimension entropy:
#   - writing_style: 1.8 ✓
#   - complexity: 1.6 ✓
#   - life_stage: 1.4 ⚠
#   - tone: 1.9 ✓
#
# ⚠ Topic Distribution
#   - Overrepresented: Tech (18%)
#   - Underrepresented: Music (3%)
```

### On Strategy Changes

```bash
# Compare current strategy vs new meta-persona approach
npm run test:diversity:compare -- --baseline=batch_001 --experiment=batch_002

# Output:
# Comparison: Baseline vs Meta-Persona Architecture
#
# Embedding Similarity:
#   Baseline: 0.78 → Meta-Persona: 0.32 (↓59% improvement ✓✓✓)
#
# Cluster Diversity:
#   Baseline: 0.42 → Meta-Persona: 0.81 (↑93% improvement ✓✓✓)
#
# Trigram Diversity:
#   Baseline: 0.72 → Meta-Persona: 0.84 (↑17% improvement ✓)
```

---

## Implementation Plan

### Phase 1: Quick Metrics (Week 1)
1. Implement embedding similarity calculator
2. Implement length distribution analyzer
3. Implement n-gram repetition detector
4. Build CLI tool: `npm run test:diversity:quick`

### Phase 2: Deep Analysis (Week 2)
1. Implement LLM cluster-agent
2. Implement topic diversity analyzer
3. Build CLI tool: `npm run test:diversity:deep`
4. Create comparison framework

### Phase 3: Dashboard (Week 3)
1. Build metrics storage (SQLite or JSON files)
2. Create visualization dashboard
3. Track metrics over time
4. A/B test framework

---

## Success Criteria

### Minimum Viable Diversity (MVD)
- ✓ Embedding similarity: < 0.50
- ✓ Cluster diversity: > 0.60
- ✓ Trigram diversity: > 0.75

### Target Diversity
- ✓ Embedding similarity: < 0.40
- ✓ Cluster diversity: > 0.70
- ✓ Trigram diversity: > 0.80
- ✓ All categories: 5-15% representation

### Aspirational Diversity
- ✓ Embedding similarity: < 0.30
- ✓ Cluster diversity: > 0.80
- ✓ Trigram diversity: > 0.85
- ✓ Human reviewers rate diversity > 4.0/5

---

## Next Steps

1. Implement Tier 1 quick metrics first (highest ROI)
2. Run baseline measurement on current generation
3. Implement meta-persona architecture
4. Re-run metrics to validate improvement
5. Iterate based on data
