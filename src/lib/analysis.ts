import type { Writing } from "@/types/writing";

type Vector = Map<string, number>;

type AtlasModel = {
  stats: {
    constellations: number;
    activePaths: number;
    deepReads: number;
  };
  atlasCards: { id: string; title: string; cluster: string; clusterId: number }[];
  path: { id: string; title: string }[];
  concepts: string[];
};

const stopWords = new Set([
  "dan",
  "yang",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "pada",
  "sebagai",
  "itu",
  "ini",
  "adalah",
  "atau",
  "the",
  "and",
  "of",
  "to",
  "a",
  "in",
  "is",
  "are",
]);

const pivotWords = ["namun", "tetapi", "meski", "walau", "sebaliknya", "but"];

const calmWords = [
  "sunyi",
  "hening",
  "tenang",
  "napas",
  "perlahan",
  "quiet",
  "silence",
];

const brightWords = [
  "pagi",
  "cahaya",
  "terbit",
  "harapan",
  "dawn",
  "light",
  "hope",
];

const melancholicWords = ["gelap", "rindu", "sedih", "blue", "malam"];
const counterpointPairs: Array<[string, string]> = [
  ["sunyi", "keramaian"],
  ["hening", "riuh"],
  ["gelap", "cahaya"],
  ["rindu", "pulang"],
  ["lambat", "gesit"],
  ["tenang", "bergejolak"],
  ["diam", "bergerak"],
  ["rapuh", "tegar"],
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));

const vectorize = (text: string): Vector => {
  const tokens = tokenize(text);
  const vector = new Map<string, number>();
  tokens.forEach((token) => {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  });
  const max = Math.max(1, ...Array.from(vector.values()));
  vector.forEach((value, key) => vector.set(key, value / max));
  return vector;
};

const buildVocabulary = (writings: Writing[]) => {
  const vocab = new Set<string>();
  writings.forEach((writing) => {
    tokenize(`${writing.title} ${writing.content}`).forEach((token) =>
      vocab.add(token)
    );
  });
  return Array.from(vocab);
};

const vectorizeToArray = (text: string, vocab: string[]) => {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  const max = Math.max(1, ...Array.from(counts.values()));
  return vocab.map((term) => (counts.get(term) ?? 0) / max);
};

const cosineArray = (a: number[], b: number[]) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const kMeansCosine = (vectors: number[][], k: number) => {
  // Handle empty vectors array
  if (vectors.length === 0) {
    return [];
  }
  
  // Ensure k is not larger than the number of vectors
  const actualK = Math.min(k, vectors.length);
  if (actualK === 0) {
    return [];
  }
  
  const centroids = vectors.slice(0, actualK).map((vec) => [...vec]);
  const assignments = new Array(vectors.length).fill(0);

  for (let iteration = 0; iteration < 6; iteration += 1) {
    for (let i = 0; i < vectors.length; i += 1) {
      let bestIndex = 0;
      let bestScore = -Infinity;
      for (let c = 0; c < actualK; c += 1) {
        const score = cosineArray(vectors[i], centroids[c]);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = c;
        }
      }
      assignments[i] = bestIndex;
    }

    const vectorDim = vectors[0]?.length ?? 0;
    const sums = Array.from({ length: actualK }, () =>
      new Array(vectorDim).fill(0)
    );
    const counts = new Array(actualK).fill(0);
    for (let i = 0; i < vectors.length; i += 1) {
      const cluster = assignments[i];
      counts[cluster] += 1;
      for (let j = 0; j < vectors[i].length; j += 1) {
        sums[cluster][j] += vectors[i][j];
      }
    }
    for (let c = 0; c < actualK; c += 1) {
      if (counts[c] === 0) continue;
      for (let j = 0; j < sums[c].length; j += 1) {
        sums[c][j] /= counts[c];
      }
      centroids[c] = sums[c];
    }
  }

  return assignments;
};

const cosine = (a: Vector, b: Vector) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.forEach((value, key) => {
    dot += value * (b.get(key) ?? 0);
    normA += value * value;
  });
  b.forEach((value) => {
    normB += value * value;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const semanticScore = (query: string, text: string) => {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  const queryVector = vectorize(trimmed);
  const textVector = vectorize(text);
  return cosine(queryVector, textVector);
};

const topKeywords = (writing: Writing, limit = 4) => {
  const freq = vectorize(`${writing.title} ${writing.content}`);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

export const detectTone = (writing: Writing) => {
  const tokens = tokenize(writing.content);
  const score = (words: string[]) =>
    tokens.filter((token) => words.includes(token)).length;
  const calm = score(calmWords);
  const bright = score(brightWords);
  const melancholic = score(melancholicWords);
  if (bright >= calm && bright >= melancholic) return "bright";
  if (calm >= melancholic) return "calm";
  return "melancholic";
};

const buildEmbeddings = (writings: Writing[]) => {
  const embeddings = new Map<string, Vector>();
  writings.forEach((writing) => {
    embeddings.set(writing.id, vectorize(writing.content));
  });
  return embeddings;
};

const buildEdges = (writings: Writing[], embeddings: Map<string, Vector>) => {
  const edges: Array<{ from: string; to: string; weight: number }> = [];
  for (let i = 0; i < writings.length; i += 1) {
    for (let j = i + 1; j < writings.length; j += 1) {
      const a = embeddings.get(writings[i].id) ?? new Map();
      const b = embeddings.get(writings[j].id) ?? new Map();
      const sim = cosine(a, b);
      if (sim > 0.14) {
        edges.push({ from: writings[i].id, to: writings[j].id, weight: sim });
      }
    }
  }
  return edges;
};

const generatePath = (writings: Writing[], edges: ReturnType<typeof buildEdges>) => {
  if (writings.length === 0) return [];
  const byId = new Map(writings.map((writing) => [writing.id, writing]));
  const adjacency = new Map<string, { id: string; weight: number }[]>();
  edges.forEach((edge) => {
    adjacency.set(edge.from, [
      ...(adjacency.get(edge.from) ?? []),
      { id: edge.to, weight: edge.weight },
    ]);
    adjacency.set(edge.to, [
      ...(adjacency.get(edge.to) ?? []),
      { id: edge.from, weight: edge.weight },
    ]);
  });

  const start = writings[0].id;
  const path = [start];
  const used = new Set(path);

  while (path.length < Math.min(4, writings.length)) {
    const current = path[path.length - 1];
    const nextCandidates = (adjacency.get(current) ?? [])
      .filter((candidate) => !used.has(candidate.id))
      .sort((a, b) => b.weight - a.weight);

    const next = nextCandidates[0] ?? {
      id: writings.find((w) => !used.has(w.id))?.id,
    };

    if (!next?.id || !byId.has(next.id)) break;
    used.add(next.id);
    path.push(next.id);
  }

  return path.map((id) => ({
    id,
    title: byId.get(id)?.title ?? id,
  }));
};

const extractConcepts = (writings: Writing[]) => {
  const pool = writings.flatMap((writing) => [
    ...writing.tags,
    ...topKeywords(writing, 3),
  ]);
  const counts = new Map<string, number>();
  pool.forEach((item) => {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([item]) => item);
};

export const buildAtlasModel = (writings: Writing[]): AtlasModel => {
  const embeddings = buildEmbeddings(writings);
  const edges = buildEdges(writings, embeddings);
  const vocab = buildVocabulary(writings);
  const vectors = writings.map((writing) =>
    vectorizeToArray(`${writing.title} ${writing.content}`, vocab)
  );
  const k = Math.min(5, Math.max(2, Math.round(Math.sqrt(writings.length))));
  const assignments = kMeansCosine(vectors, k);
  const clusterKeywords = new Map<number, string[]>();
  assignments.forEach((clusterId, index) => {
    const keywords = topKeywords(writings[index], 3);
    clusterKeywords.set(clusterId, [
      ...(clusterKeywords.get(clusterId) ?? []),
      ...keywords,
    ]);
  });
  const clusterLabels = new Map<number, string>();
  clusterKeywords.forEach((keywords, clusterId) => {
    const counts = new Map<string, number>();
    keywords.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
    const label = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)[0];
    clusterLabels.set(clusterId, label ? label : `cluster ${clusterId + 1}`);
  });

  const constellations = new Set(assignments).size;
  const deepReads = clamp(
    Math.round(
      writings.reduce((acc, writing) => acc + writing.content.length, 0) /
        (writings.length * 30)
    ),
    78,
    97
  );

  return {
    stats: {
      constellations,
      activePaths: Math.min(36, constellations * 3 + 6),
      deepReads,
    },
    atlasCards: writings.slice(0, 6).map((writing, index) => {
      const clusterId = assignments[index] ?? 0;
      return {
        id: writing.id,
        title: writing.title,
        cluster: clusterLabels.get(clusterId) ?? writing.tags[0],
        clusterId,
      };
    }),
    path: generatePath(writings, edges),
    concepts: extractConcepts(writings),
  };
};

export const buildKnowledgeGraph = (writings: Writing[]) => {
  const conceptSet = new Set<string>();
  const edges = new Map<string, Set<string>>();
  const writingMap = new Map<string, Set<string>>();

  writings.forEach((writing) => {
    const keywords = topKeywords(writing, 3);
    const concepts = Array.from(new Set([...writing.tags, ...keywords]));
    concepts.forEach((concept) => conceptSet.add(concept));

    for (let i = 0; i < concepts.length; i += 1) {
      for (let j = i + 1; j < concepts.length; j += 1) {
        const a = concepts[i];
        const b = concepts[j];
        if (!edges.has(a)) edges.set(a, new Set());
        if (!edges.has(b)) edges.set(b, new Set());
        edges.get(a)?.add(b);
        edges.get(b)?.add(a);
      }
    }

    concepts.forEach((concept) => {
      if (!writingMap.has(concept)) writingMap.set(concept, new Set());
      writingMap.get(concept)?.add(writing.id);
    });
  });

  const concepts = Array.from(conceptSet).slice(0, 12);
  const connections = concepts.map((concept) => ({
    concept,
    links: Array.from(edges.get(concept) ?? []).filter((item) =>
      concepts.includes(item)
    ),
    writings: Array.from(writingMap.get(concept) ?? []),
  }));

  return { concepts, connections };
};

export const getInsightCards = (writings: Writing[]) => {
  const highlight = writings[0];
  const pivotSentences = highlight.content
    .split(/\.(?=\s|$)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) =>
      pivotWords.some((word) => sentence.toLowerCase().includes(word))
    );

  const quotes = highlight.content
    .split(/\.(?=\s|$)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .slice(0, 2);

  const counterpoint = () => {
    const text = highlight.content.toLowerCase();
    const match = counterpointPairs.find(([word]) => text.includes(word));
    if (match) {
      return `Jika ${match[0]} menuntun, maka ${match[1]} bisa menjadi poros baru.`;
    }
    return "Jika teks ini adalah napas, maka jedanya adalah ruang refleksi.";
  };

  return [
    {
      title: "Ringkas",
      text: `${highlight.excerpt} (${detectTone(highlight)} tone)`,
    },
    {
      title: "Pivot Moments",
      text: pivotSentences[0] ?? "Titik balik halus terdeteksi pada bagian tengah.",
    },
    {
      title: "Counterpoint",
      text: counterpoint(),
    },
    {
      title: "Key Quotes",
      text: quotes.join(". ") + ".",
    },
  ];
};
