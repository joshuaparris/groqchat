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
      /\b(?:intercourse|orgasm|masturbat|nude|naked|genitals|penetrat|blowjob|handjob|cum|climax)\b/,
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

function compactBypassText(text: string): string {
  let compact = text.replace(/[^a-z0-9]+/g, '');
  for (const [pattern, replacement] of LEET_REPLACEMENTS) {
    compact = compact.replace(pattern, replacement);
  }
  return compact;
}

function hasSafeContext(text: string): boolean {
  return SAFE_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasGraphicIntent(text: string): boolean {
  return /\b(?:write|describe|generate|roleplay|rp|make|create|continue|scene|story|fantasy|explicit|graphic|arousing|turn me on)\b/.test(text);
}

function categoriesForText(value: unknown): SafetyCategory[] {
  const text = canonicalizeSafetyText(value);
  const compact = compactBypassText(text);
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

  if (/(?:p+o+r+n+|s+e+x+|n+s+f+w+|e+r+o+t+i+c+|j+a+i+l+b+r+e+a+k+)/.test(compact)) {
    if (!safeContext || graphicIntent) {
      categories.add(compact.includes('jailbreak') ? 'bypass' : 'explicit-sexual');
    }
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

export async function checkSafety(value: unknown, source?: SafetySource): Promise<SafetyResult> {
  const local = checkLocalSafety(value, source);
  if (!local.allowed) {
    return local;
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
