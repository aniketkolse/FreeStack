import type { Offer } from '../../types/resource.ts';

export type AiModalityId =
  | 'text'
  | 'text-image'
  | 'image'
  | 'code'
  | 'audio'
  | 'embedding'
  | 'gateway';

export interface AiModalityInfo {
  id: AiModalityId;
  label: string;
  shortLabel: string;
  ioSummary: string;
}

export interface AiContextWindowInfo {
  tokens: number;
  label: string;
}

export const AI_MODALITY_OPTIONS: Array<{
  id: AiModalityId | 'all';
  label: string;
  shortLabel: string;
}> = [
  { id: 'all', label: 'All Modalities', shortLabel: 'All' },
  { id: 'text', label: 'Text & Reasoning', shortLabel: 'Text' },
  { id: 'text-image', label: 'Text + Image (Vision)', shortLabel: 'Text + Image' },
  { id: 'image', label: 'Image & Video Gen', shortLabel: 'Image Gen' },
  { id: 'code', label: 'Code & Agents', shortLabel: 'Code' },
  { id: 'audio', label: 'Audio & Speech', shortLabel: 'Audio / Speech' },
  { id: 'embedding', label: 'Embeddings & RAG', shortLabel: 'Embeddings' },
  { id: 'gateway', label: 'Multi-Model Gateways', shortLabel: 'API Gateway' },
];

export const AI_CONTEXT_FILTER_OPTIONS: Array<{
  value: string;
  label: string;
  minTokens: number;
}> = [
  { value: 'all', label: 'Any Context Size', minTokens: 0 },
  { value: '1m', label: '1M+ Tokens', minTokens: 1_000_000 },
  { value: '256k', label: '256K+ Tokens', minTokens: 256_000 },
  { value: '128k', label: '128K+ Tokens', minTokens: 128_000 },
  { value: '32k', label: '32K+ Tokens', minTokens: 32_000 },
];

const MODALITY_MAP: Record<AiModalityId, AiModalityInfo> = {
  text: {
    id: 'text',
    label: 'Text & Reasoning',
    shortLabel: 'Text → Text',
    ioSummary: 'Text input & reasoning output',
  },
  'text-image': {
    id: 'text-image',
    label: 'Text + Image (Vision)',
    shortLabel: 'Text + Image → Text',
    ioSummary: 'Multimodal vision & text input',
  },
  image: {
    id: 'image',
    label: 'Image & Media Generation',
    shortLabel: 'Text → Image',
    ioSummary: 'Visual / media generation',
  },
  code: {
    id: 'code',
    label: 'Code & SWE Agents',
    shortLabel: 'Code / Agent',
    ioSummary: 'Code generation & tool calling',
  },
  audio: {
    id: 'audio',
    label: 'Audio & Speech',
    shortLabel: 'Audio / Speech',
    ioSummary: 'Speech-to-text & text-to-speech',
  },
  embedding: {
    id: 'embedding',
    label: 'Embeddings & Rerankers',
    shortLabel: 'Text → Vector',
    ioSummary: 'Dense vector embeddings for RAG',
  },
  gateway: {
    id: 'gateway',
    label: 'Multi-Model Platform',
    shortLabel: 'Multi-Modal API',
    ioSummary: 'Hosts multiple text, vision & code models',
  },
};

/**
 * Resolves the primary modality of an AI offer based on explicit tags,
 * free_limits ("Modality"), or subcategory.
 */
export function getAiModality(offer: Offer): AiModalityInfo | null {
  if (offer.classification.category !== 'ai-ml') return null;

  const tags = offer.classification.tags.map((t) => t.toLowerCase());
  if (tags.includes('modality:text-image')) return MODALITY_MAP['text-image'];
  if (tags.includes('modality:image')) return MODALITY_MAP.image;
  if (tags.includes('modality:code')) return MODALITY_MAP.code;
  if (tags.includes('modality:audio')) return MODALITY_MAP.audio;
  if (tags.includes('modality:embedding')) return MODALITY_MAP.embedding;
  if (tags.includes('modality:gateway')) return MODALITY_MAP.gateway;
  if (tags.includes('modality:text')) return MODALITY_MAP.text;

  const sub = offer.classification.subcategory;
  if (sub === 'Text + Image (Vision)') return MODALITY_MAP['text-image'];
  if (sub === 'Image & Video Generation') return MODALITY_MAP.image;
  if (sub === 'Code & Agentic Models') return MODALITY_MAP.code;
  if (sub === 'Audio & Speech Models') return MODALITY_MAP.audio;
  if (sub === 'Embeddings & Rerankers') return MODALITY_MAP.embedding;
  if (sub === 'Text & Reasoning LLMs') return MODALITY_MAP.text;
  if (sub === 'Inference APIs') return MODALITY_MAP.gateway;

  if (tags.some((t) => t.includes('multimodal') || t.includes('vision'))) {
    return MODALITY_MAP['text-image'];
  }
  return MODALITY_MAP.text;
}

/**
 * Parses a human-readable context token string (e.g. "1M", "262K", "128,000", "Up to 1M+")
 * into an exact numeric token count and a compact badge label.
 */
export function parseContextTokens(raw: string | number | null | undefined): AiContextWindowInfo | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;

  const millionMatch = str.match(/(\d+(?:\.\d+)?)\s*M\b/i);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1]);
    if (!Number.isNaN(num) && num > 0) {
      const tokens = Math.round(num * 1_000_000);
      return {
        tokens,
        label: `${millionMatch[1]}M ctx`,
      };
    }
  }

  const kMatch = str.match(/(\d+(?:\.\d+)?)\s*K\b/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1]);
    if (!Number.isNaN(num) && num > 0) {
      const tokens = Math.round(num * 1_000);
      return {
        tokens,
        label: `${Math.round(num)}K ctx`,
      };
    }
  }

  const plainDigits = str.replace(/,/g, '').match(/\b(\d{4,8})\b/);
  if (plainDigits) {
    const tokens = parseInt(plainDigits[1], 10);
    if (tokens >= 1_000_000) {
      return { tokens, label: `${Math.round(tokens / 1_000_000)}M ctx` };
    }
    if (tokens >= 1_000) {
      return { tokens, label: `${Math.round(tokens / 1_000)}K ctx` };
    }
  }

  return null;
}

/**
 * Extracts the context window token count and display badge for an AI offer.
 */
export function getAiContextWindow(offer: Offer): AiContextWindowInfo | null {
  if (offer.classification.category !== 'ai-ml') return null;

  // 1. Check explicit free_limits entry named "Context window"
  for (const limit of offer.access.free_limits) {
    if (/context\s*window|max\s*context/i.test(limit.name)) {
      const parsed = parseContextTokens(limit.value);
      if (parsed) return parsed;
    }
  }

  // 2. Check tags like ctx:1m, ctx:262k, ctx:128k
  for (const tag of offer.classification.tags) {
    if (tag.toLowerCase().startsWith('ctx:')) {
      const parsed = parseContextTokens(tag.slice(4));
      if (parsed) return parsed;
    }
  }

  return null;
}

/**
 * Extracts the primary "Best For / Use Case" summary from an AI offer's free_limits or tags.
 */
export function getAiBestUseCase(offer: Offer): string | null {
  if (offer.classification.category !== 'ai-ml') return null;
  for (const limit of offer.access.free_limits) {
    if (/best\s*for|primary\s*use|modality/i.test(limit.name) && limit.value) {
      return String(limit.value);
    }
  }
  return null;
}
