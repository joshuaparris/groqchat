import { describe, expect, it } from 'vitest';
import { getGroqApiKeys, normalizeGroqKeys } from '../lib/groq';
import { GET as healthGET } from '../app/api/health/route';

describe('Groq key helpers', () => {
  it('returns no keys when environment variables are missing', () => {
    process.env.GROQ_API_KEY = '';
    process.env.GROQ_API_KEYS = '';
    expect(getGroqApiKeys()).toEqual([]);
  });

  it('dedupes multiple backup keys and keeps primary first', () => {
    process.env.GROQ_API_KEY = 'primary';
    process.env.GROQ_API_KEYS = 'primary,secondary,secondary,tertiary';
    expect(getGroqApiKeys()).toEqual(['primary', 'secondary', 'tertiary']);
  });

  it('normalizes comma-separated keys cleanly', () => {
    expect(normalizeGroqKeys(' key1 , , key2, key1 ')).toEqual(['key1', 'key2']);
  });
});

describe('Health route', () => {
  it('exposes only safe health details', async () => {
    process.env.GROQ_API_KEY = 'primary';
    process.env.GROQ_API_KEYS = 'secondary';

    const response = await healthGET();
    const data = await response.json();

    expect(data).toMatchObject({
      ok: true,
      service: 'groqchat',
      provider: 'groq',
      keyCount: 2,
      model: expect.any(String),
      llmConfigured: true,
    });
    expect(data).not.toHaveProperty('GROQ_API_KEY');
    expect(data).not.toHaveProperty('GROQ_API_KEYS');
  });
});
