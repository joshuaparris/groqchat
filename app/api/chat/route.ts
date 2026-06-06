import { NextResponse } from 'next/server';
import { callGroq } from '../../../lib/groq';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatRequestBody = {
  systemPrompt?: string;
  sceneContext?: string;
  model?: string;
  messages?: ChatMessage[];
};

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: Request) {
  const body: ChatRequestBody = await request.json().catch(() => ({}));
  const systemPrompt = body.systemPrompt?.trim() || '';
  const sceneContext = body.sceneContext?.trim() || '';
  const model = body.model?.trim() || process.env.GROQ_MODEL || DEFAULT_MODEL;
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!systemPrompt || !sceneContext || messages.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Please provide systemPrompt, sceneContext, and messages.' },
      { status: 400 },
    );
  }

  const promptMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `Scene context:\n${sceneContext}` },
    ...messages,
  ];

  const result = await callGroq({ messages: promptMessages, model });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assistant: result.assistant });
}
