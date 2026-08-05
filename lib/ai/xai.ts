import OpenAI from 'openai';

/**
 * SpaceXAI / xAI client (OpenAI-compatible).
 * Server-side only — never import from client components.
 */
export function getXaiClient(): OpenAI | null {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
  });
}

export function getXaiModel(): string {
  return process.env.XAI_MODEL || 'grok-4.5';
}

/** Multimodal model for image understanding (body / meal photos). */
export function getXaiVisionModel(): string {
  return process.env.XAI_VISION_MODEL || process.env.XAI_MODEL || 'grok-4.5';
}

export function isXaiConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}
