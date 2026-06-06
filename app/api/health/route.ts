import { NextResponse } from 'next/server';
import { getGroqApiKeys, getGroqModel } from '../../../lib/groq';

export async function GET() {
  const keys = getGroqApiKeys();
  return NextResponse.json({
    ok: true,
    service: 'groqchat',
    llmConfigured: keys.length > 0,
    provider: 'groq',
    keyCount: keys.length,
    model: getGroqModel(),
  });
}
