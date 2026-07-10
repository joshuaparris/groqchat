import { NextResponse } from 'next/server';
import { getGroqApiKeys, getGroqModel } from '../../../lib/groq';

export async function GET() {
  const keys = getGroqApiKeys();
  const model = getGroqModel();
  
  return NextResponse.json({
    ok: true,
    service: 'groqchat',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    llmConfigured: keys.length > 0,
    provider: 'groq',
    keyCount: keys.length,
    model,
  });
}
