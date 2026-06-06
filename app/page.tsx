'use client';

import { useEffect, useMemo, useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const DEFAULT_SYSTEM_PROMPT = `You are a grounded, imaginative Dungeon Master. Respond like a helpful tabletop RPG DM. Keep the world consistent. Do not invent major lore unless it follows naturally from the scene. Ask clarifying questions when needed. Treat ordinary player actions flexibly. Do not be a brittle command parser.`;

const DEFAULT_SCENE_CONTEXT = `Scene: The Last Lantern at Brindlehook Inn.
Goal: Learn where the missing courier went.
NPCs:
- Mira, the innkeeper, guarded but not hostile.
- Several damp patrons keeping to themselves.
Visible details:
- Rain taps the windows.
- Lantern light warms the common room.
- The inn is worn but still functioning.
- People seem tense about recent travellers.`;

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const STORAGE_KEYS = {
  systemPrompt: 'groqchat-system-prompt',
  sceneContext: 'groqchat-scene-context',
  messages: 'groqchat-messages',
  model: 'groqchat-model',
};

export default function HomePage() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [sceneContext, setSceneContext] = useState(DEFAULT_SCENE_CONTEXT);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedSystem = window.localStorage.getItem(STORAGE_KEYS.systemPrompt);
    const savedScene = window.localStorage.getItem(STORAGE_KEYS.sceneContext);
    const savedMessages = window.localStorage.getItem(STORAGE_KEYS.messages);
    const savedModel = window.localStorage.getItem(STORAGE_KEYS.model);

    if (savedSystem) setSystemPrompt(savedSystem);
    if (savedScene) setSceneContext(savedScene);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
        setMessages(parsedMessages);
      } catch {
        setMessages([]);
      }
    }
    if (savedModel) setModel(savedModel);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.systemPrompt, systemPrompt);
    window.localStorage.setItem(STORAGE_KEYS.sceneContext, sceneContext);
    window.localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    window.localStorage.setItem(STORAGE_KEYS.model, model);
  }, [systemPrompt, sceneContext, messages, model]);

  const promptPreview = useMemo(() => {
    return `${systemPrompt}\n\nScene context:\n${sceneContext}`;
  }, [systemPrompt, sceneContext]);

  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setDraft('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          sceneContext,
          model,
          messages: nextMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || 'Unable to get a response from Groq.');
      } else {
        setMessages((current) => [...current, { role: 'assistant', content: data.assistant }]);
      }
    } catch (fetchError) {
      setError('Network error sending request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setDraft('');
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">GROQCHAT — Dungeon Master Chat</h1>
            <p className="mt-1 text-slate-400">Simple Groq-powered DM chat with system prompt, scene context, and fallback key support.</p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          >
            Clear Chat
          </button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-glow">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Scene / NPC Context</label>
              <textarea
                value={sceneContext}
                onChange={(event) => setSceneContext(event.target.value)}
                rows={10}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Model</label>
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-400">
                <p className="font-medium text-slate-200">Prompt Preview</p>
                <p className="mt-3 whitespace-pre-wrap text-slate-300">{promptPreview}</p>
              </div>
            </div>
          </section>

          <section className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-glow">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Chat Transcript</h2>
                <p className="text-sm text-slate-400">Talk to your Groq-powered DM and watch the conversation grow.</p>
              </div>
              {loading && <span className="text-sm text-slate-400">Loading...</span>}
            </div>

            <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
              {messages.length === 0 ? (
                <p className="text-slate-500">No messages yet. Send your first player action to begin.</p>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={message.role === 'user' ? 'rounded-3xl bg-slate-800/80 p-4' : 'rounded-3xl bg-slate-700/20 p-4'}>
                    <p className="text-[0.84rem] uppercase tracking-[0.12em] text-slate-400">{message.role === 'user' ? 'Player' : 'Dungeon Master'}</p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-100">{message.content}</p>
                  </div>
                ))
              )}
            </div>

            {error ? <div className="mb-4 rounded-2xl border border-rose-600/40 bg-rose-950/70 p-4 text-sm text-rose-200">{error}</div> : null}

            <div className="grid gap-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Enter your player message..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={sendMessage}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-700/70"
              >
                Send Message
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
