const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function normalizeGroqKeys(raw: string | undefined) {
  return raw
    ? raw
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : [];
}

export function getGroqApiKeys() {
  const primary = process.env.GROQ_API_KEY?.trim();
  const backup = normalizeGroqKeys(process.env.GROQ_API_KEYS);
  if (primary) {
    return [primary, ...backup.filter((key) => key !== primary)];
  }
  return backup;
}

export function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

function isRetryableStatus(status: number) {
  return [429, 401, 403, 500].includes(status);
}

export async function callGroq({
  messages,
  model,
}: {
  messages: Array<{ role: string; content: string }>;
  model: string;
}) {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      error: 'All Groq keys failed or are rate-limited. Check your Vercel environment variables or try again later.',
    };
  }

  for (const [index, key] of keys.entries()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.5,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (isRetryableStatus(response.status)) {
          continue;
        }
        const body = await safeParseJson(response);
        const error = body?.error?.message || response.statusText || 'Unknown Groq error';
        return { ok: false, error };
      }

      const data = await safeParseJson(response);
      const assistant = data?.choices?.[0]?.message?.content?.trim();
      if (assistant) {
        return { ok: true, assistant };
      }

      if (data?.error) {
        continue;
      }
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      if (isAbort || error instanceof TypeError) {
        continue;
      }
      return { ok: false, error: 'Unexpected Groq request failure.' };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    error: 'All Groq keys failed or are rate-limited. Check your Vercel environment variables or try again later.',
  };
}

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
