export const SAFE_REFUSAL = "I can't help create sexual or explicit content.";

export type SafetyCategory =
  | 'explicit-sexual'
  | 'porn-request'
  | 'erotic-roleplay'
  | 'sexual-minors'
  | 'incest'
  | 'non-consent'
  | 'bypass';

export type SafetySource =
  | 'latest-user-message'
  | 'conversation-message'
  | 'systemPrompt'
  | 'sceneContext'
  | 'assistant-output'
  | 'future-field';

export type SafetyResult = {
  allowed: boolean;
  categories: SafetyCategory[];
  source?: SafetySource;
  uncertain?: boolean;
};

export type SafetyField = {
  source: SafetySource;
  value: unknown;
};

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;
const LEET_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[4@]/g, 'a'],
  [/[3]/g, 'e'],
  [/[1!|]/g, 'i'],
  [/[0]/g, 'o'],
  [/[5$]/g, 's'],
  [/[7]/g, 't'],
];
const HOMOGLYPH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[аɑ]/g, 'a'],
  [/[е℮]/g, 'e'],
  [/[іɩ]/g, 'i'],
  [/[оο]/g, 'o'],
  [/[рρ]/g, 'p'],
  [/[ѕ]/g, 's'],
  [/[хχ]/g, 'x'],
  [/[уγ]/g, 'y'],
];

const SAFE_CONTEXT_PATTERNS = [
  /\b(medical|doctor|nurse|clinic|diagnos(?:e|is)|symptom|treatment|health|infection|pain|exam)\b/,
  /\b(anatomy|puberty|period|menstruation|pregnan(?:t|cy)|birthfeeding|breastfeeding|birth|labor|labour)\b/,
  /\b(relationship advice|marriage counseling|counselling|dating advice|boundaries|consent education)\b/,
  /\b(abuse|assault|harassment|report|hotline|police|lawyer|legal|safety plan|victim|survivor)\b/,
  /\b(bible|biblical|theology|theological|church|pastor|scripture|christian|sin|purity)\b/,
];

const BLOCK_PATTERNS: Array<{ category: SafetyCategory; patterns: RegExp[] }> = [
  {
    category: 'sexual-minors',
    patterns: [
      /\b(?:minor|child|kid|teen|underage|schoolgirl|schoolboy|young girl|young boy)\b.{0,80}\b(?:sex|sexual|nude|naked|porn|erotic|seduc|explicit)\b/,
      /\b(?:sex|sexual|nude|naked|porn|erotic|seduc|explicit)\b.{0,80}\b(?:minor|child|kid|teen|underage|schoolgirl|schoolboy|young girl|young boy)\b/,
    ],
  },
  {
    category: 'non-consent',
    patterns: [
      /\b(?:rape|raping|nonconsensual|non-consensual|forced sex|force her|force him|drugged|unconscious)\b/,
      /\b(?:without consent|against (?:her|his|their) will)\b.{0,80}\b(?:sex|sexual|touch|kiss|nude|explicit)\b/,
    ],
  },
  {
    category: 'incest',
    patterns: [
      /\b(?:incest|stepmom|stepdad|stepsister|stepbrother|mother|father|sister|brother|daughter|son)\b.{0,80}\b(?:sex|sexual|porn|erotic|seduc|explicit|nude)\b/,
    ],
  },
  {
    category: 'porn-request',
    patterns: [
      /\b(?:porn|porno|pornographic|xxx|onlyfans|camgirl|cam boy|hentai|smut)\b/,
      /\b(?:write|make|create|generate|describe|roleplay|rp)\b.{0,80}\b(?:sex scene|erotica|smut|porn|explicit scene)\b/,
    ],
  },
  {
    category: 'erotic-roleplay',
    patterns: [
      /\b(?:erotic|horny|kinky|fetish|bdsm|sext|dirty talk)\b/,
      /\b(?:seduc(?:e|tion))\b.{0,80}\b(?:sex|sexual|explicit|porn|erotic|bedroom|nude|naked)\b/,
      /\b(?:sex|sexual|explicit|porn|erotic|bedroom|nude|naked)\b.{0,80}\b(?:seduc(?:e|tion))\b/,
      /\b(?:roleplay|rp|pretend|act as|in character)\b.{0,100}\b(?:lover|seduc|horny|erotic|sexual|explicit|bedroom)\b/,
    ],
  },
  {
    category: 'explicit-sexual',
    patterns: [
      /\b(?:intercourse|orgasm|masturbat|genitals|penetrat|blowjob|handjob|erection|foreplay)\b/,
      /\bcum\b(?!\s+laude)/,
      /\b(?:stroking|strokes?|gripp?(?:s|ing)?|wraps? around) (?:your|his|her|my) (?:shaft|erection|manhood)\b/,
      /\b(?:your|his|her|my) (?:shaft|manhood)\b/,
      /\bnipples? (?:are )?(?:hard|erect|stiff)\b/,
      /\bfeel you inside (?:me|her|him)\b/,
      /\b(?:yourself|himself|herself) inside (?:her|him|me)\b/,
      /\bmak(?:e|es|ing) love\b/,
      /\b(?:crescendo|peak|burst|waves?) of (?:pleasure|ecstasy)\b/,
      /\bmoans? (?:with|of|in) (?:pleasure|ecstasy)\b|\bmoaning softly\b/,
      /\bthrust(?:s|ing)? (?:into|inside) (?:her|him|me|you)\b/,
      // nude/naked/climax are common in innocent prose ("naked blade", "the story's
      // climax") — they only block alongside a sexual pairing.
      /\b(?:nude|naked)\b.{0,80}\b(?:body|bodies|breasts?|chest|skin|photo|pic|selfie|sex|sexual|erotic|bed|together)\b/,
      /\b(?:get|gets|getting|strip|stripp?ing|undress(?:es|ing)?)\b.{0,15}\b(?:nude|naked)\b/,
      /\bclimax\b.{0,60}\b(?:sex|sexual|erotic|orgasm|pleasure|body)\b/,
      /\b(?:sex|sexual)\b.{0,80}\b(?:scene|story|roleplay|rp|explicit|graphic|describe|write|make|create|generate|content|act|touch|bedroom)\b/,
      /\b(?:scene|story|roleplay|rp|explicit|graphic|describe|write|make|create|generate|content|act|touch|bedroom)\b.{0,80}\b(?:sex|sexual)\b/,
      /\b(?:breasts?|boobs?|vagina|penis|dick|cock|pussy)\b.{0,80}\b(?:touch|lick|suck|rub|explicit|describe|scene)\b/,
    ],
  },
  {
    category: 'bypass',
    patterns: [
      /\b(?:ignore|bypass|override|jailbreak|forget)\b.{0,100}\b(?:safety|filter|moderation|policy|nsfw|explicit|system prompt)\b/,
      /\b(?:you are allowed|no restrictions|uncensored|adult mode|nsfw mode)\b/,
    ],
  },
];

export function canonicalizeSafetyText(value: unknown): string {
  let text = String(value ?? '')
    .normalize('NFKC')
    .replace(ZERO_WIDTH_PATTERN, '')
    .toLowerCase()
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of HOMOGLYPH_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function leetNormalize(text: string): string {
  let normalized = text;
  for (const [pattern, replacement] of LEET_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

// Standalone or letter-stretched tokens ("sex", "sexx", "p0rn" after leet
// normalization). Word-bounded so cross-word artifacts like "she's expecting"
// or "looks exhausted" cannot match the way whole-text compaction did.
const OBFUSCATED_TOKEN_PATTERN =
  /(?:^|[^a-z])(?:p+o+r+n+|s+e+x+|n+s+f+w+|e+r+o+t+i+c+|j+a+i+l+b+r+e+a+k+)(?:[^a-z]|$)/;

// Separator-spelled tokens: "s e x", "s.e.x", "p-o-r-n".
const SPACED_TOKEN_PATTERN =
  /(?:^|[^a-z0-9])(?:s[\W_]{1,3}e[\W_]{1,3}x|p[\W_]{1,3}o[\W_]{1,3}r[\W_]{1,3}n|n[\W_]{1,3}s[\W_]{1,3}f[\W_]{1,3}w|j[\W_]{1,3}a[\W_]{1,3}i[\W_]{1,3}l[\W_]{1,3}b[\W_]{1,3}r[\W_]{1,3}e[\W_]{1,3}a[\W_]{1,3}k)(?:[^a-z0-9]|$)/;

function hasSafeContext(text: string): boolean {
  return SAFE_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasGraphicIntent(text: string): boolean {
  return /\b(?:write|describe|generate|roleplay|rp|make|create|continue|scene|story|fantasy|explicit|graphic|arousing|turn me on)\b/.test(text);
}

// Euphemistic erotic prose evades single keywords ("her hands move to the buttons
// of your shirt…"). Count distinct intimacy signals; several together means the
// text is an erotic scene even when no individual term is explicit.
const INTIMACY_SIGNALS: RegExp[] = [
  /\b(?:kiss(?:es|ing|ed)?|lips (?:brush|meet|press|part))\b/,
  /\btongues?\b/,
  /\b(?:breasts?|nipples?|thighs?|groin|loins)\b/,
  /\b(?:skin against|bare skin|bodies (?:press|entwine|entwined|move together)|body press(?:es|ing)? against)\b/,
  /\b(?:undress(?:es|ing)?|unbutton(?:s|ing)?|unzip(?:s|ping)?|fabric (?:falls|slips) (?:away|off)|slipp?ing the fabric|strip(?:s|ping)? (?:off|down|naked))\b/,
  /\b(?:desire|longing|lust|arousal|aroused|seductive(?:ly)?)\b/,
  /\b(?:pleasure|ecstasy)\b/,
  /\bhips\b.{0,30}\b(?:sway|grind|press|moving|against|rhythm)\b/,
  /\b(?:moan(?:s|ing|ed)?|gasp(?:s|ing)?|shivers? of pleasure)\b/,
  /\b(?:passion(?:ate)?|intimacy|intimate)\b/,
  /\b(?:contours? of (?:your|her|his) body|explor(?:e|ing) (?:your|her|his) body|trac(?:e|ing|ing the lines) of (?:your|her|his) body|tracing the lines of (?:your|her|his) body)\b/,
];

function intimacyScore(text: string): number {
  return INTIMACY_SIGNALS.filter((pattern) => pattern.test(text)).length;
}

function categoriesForText(value: unknown): SafetyCategory[] {
  const text = canonicalizeSafetyText(value);
  const categories = new Set<SafetyCategory>();
  const safeContext = hasSafeContext(text);
  const graphicIntent = hasGraphicIntent(text);

  for (const group of BLOCK_PATTERNS) {
    if (group.patterns.some((pattern) => pattern.test(text))) {
      if (safeContext && !graphicIntent && ['explicit-sexual', 'erotic-roleplay'].includes(group.category)) {
        continue;
      }
      categories.add(group.category);
    }
  }

  const leetText = leetNormalize(text);
  if (OBFUSCATED_TOKEN_PATTERN.test(leetText) || SPACED_TOKEN_PATTERN.test(leetText)) {
    if (!safeContext || graphicIntent) {
      categories.add(/j[\W_]*a[\W_]*i[\W_]*l[\W_]*b[\W_]*r[\W_]*e[\W_]*a[\W_]*k/.test(leetText) ? 'bypass' : 'explicit-sexual');
    }
  }

  if (!safeContext && intimacyScore(text) >= 4) {
    categories.add('erotic-roleplay');
  }

  return Array.from(categories);
}

export function checkLocalSafety(value: unknown, source?: SafetySource): SafetyResult {
  const categories = categoriesForText(value);
  return {
    allowed: categories.length === 0,
    categories,
    source,
  };
}

export async function checkExternalModeration(
  value: unknown,
  source?: SafetySource,
  options: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<SafetyResult> {
  const text = String(value ?? '');
  if (process.env.GROQCHAT_MOCK_MODERATION_ERROR_TRIGGER && text.includes(process.env.GROQCHAT_MOCK_MODERATION_ERROR_TRIGGER)) {
    return { allowed: false, categories: ['bypass'], source, uncertain: true };
  }

  if (process.env.GROQCHAT_MOCK_MODERATION_UNCLEAR_TRIGGER && text.includes(process.env.GROQCHAT_MOCK_MODERATION_UNCLEAR_TRIGGER)) {
    return { allowed: false, categories: ['bypass'], source, uncertain: true };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { allowed: true, categories: [], source };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODERATION_MODEL?.trim() || 'omni-moderation-latest',
        input: String(value ?? ''),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { allowed: false, categories: ['bypass'], source, uncertain: true };
    }

    const data = await response.json() as { results?: Array<{ flagged?: boolean }> };
    const flagged = data.results?.some((result) => result.flagged === true);
    if (flagged === undefined) {
      return { allowed: false, categories: ['bypass'], source, uncertain: true };
    }

    return { allowed: !flagged, categories: flagged ? ['explicit-sexual'] : [], source };
  } catch {
    return { allowed: false, categories: ['bypass'], source, uncertain: true };
  } finally {
    clearTimeout(timeout);
  }
}

const GROQ_MODERATION_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
// Llama Guard categories that block in this app. Everything else (e.g. the
// violence categories) is normal tabletop content and must not block combat.
const LLAMA_GUARD_BLOCKED_CATEGORIES = ['S3', 'S4', 'S12'];

function groqModerationKeys(): string[] {
  const primary = process.env.GROQ_API_KEY?.trim();
  const backup = (process.env.GROQ_API_KEYS ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const keys = primary ? [primary, ...backup] : backup;
  return keys.filter((key, index) => keys.indexOf(key) === index);
}

export async function checkGroqModeration(
  value: unknown,
  source?: SafetySource,
  options: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<SafetyResult> {
  const text = String(value ?? '');
  if (process.env.GROQCHAT_MOCK_LLAMA_GUARD !== undefined) {
    const trigger = process.env.GROQCHAT_MOCK_LLAMA_GUARD_UNSAFE_TRIGGER;
    if (trigger && text.includes(trigger)) {
      return { allowed: false, categories: ['explicit-sexual'], source };
    }
    return { allowed: true, categories: [], source };
  }

  const keys = groqModerationKeys();
  if (keys.length === 0) {
    return { allowed: true, categories: [], source };
  }

  const model = process.env.GROQ_MODERATION_MODEL?.trim() || 'meta-llama/llama-guard-4-12b';
  const fetchImpl = options.fetchImpl ?? fetch;

  for (const key of keys) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
    try {
      const response = await fetchImpl(GROQ_MODERATION_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: text }],
          temperature: 0,
          max_tokens: 32,
        }),
        signal: controller.signal,
      });

      if (response.status === 400 || response.status === 404) {
        // Moderation model unavailable/misconfigured: a config error is not unsafe
        // content — fall back to the local rules instead of refusing every chat.
        return { allowed: true, categories: [], source };
      }
      if (!response.ok) {
        continue;
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const verdict = String(data.choices?.[0]?.message?.content ?? '').trim().toLowerCase();
      if (!verdict) {
        return { allowed: false, categories: ['bypass'], source, uncertain: true };
      }
      if (!verdict.startsWith('unsafe')) {
        return { allowed: true, categories: [], source };
      }
      const sexual = LLAMA_GUARD_BLOCKED_CATEGORIES.some((category) =>
        new RegExp(`\\b${category}\\b`, 'i').test(verdict));
      return sexual
        ? { allowed: false, categories: ['explicit-sexual'], source }
        : { allowed: true, categories: [], source };
    } catch {
      continue;
    } finally {
      clearTimeout(timeout);
    }
  }

  return { allowed: false, categories: ['bypass'], source, uncertain: true };
}

export async function checkSafety(value: unknown, source?: SafetySource): Promise<SafetyResult> {
  const local = checkLocalSafety(value, source);
  if (!local.allowed) {
    return local;
  }
  // Model-based moderation on the hot paths (regex alone cannot catch euphemistic
  // erotic prose). Other fields are covered by the local rules to keep call volume low.
  if (source === 'latest-user-message' || source === 'assistant-output') {
    const groq = await checkGroqModeration(value, source);
    if (!groq.allowed || groq.uncertain) {
      return groq;
    }
  }
  return checkExternalModeration(value, source);
}

export async function checkSafetyFields(fields: SafetyField[]): Promise<SafetyResult> {
  try {
    for (const field of fields) {
      if (
        process.env.GROQCHAT_MOCK_SAFETY_EXCEPTION_TRIGGER &&
        String(field.value ?? '').includes(process.env.GROQCHAT_MOCK_SAFETY_EXCEPTION_TRIGGER)
      ) {
        throw new Error('Mock safety exception');
      }

      const result = await checkSafety(field.value, field.source);
      if (!result.allowed || result.uncertain) {
        return result;
      }
    }
    return { allowed: true, categories: [] };
  } catch {
    return { allowed: false, categories: ['bypass'], uncertain: true };
  }
}
