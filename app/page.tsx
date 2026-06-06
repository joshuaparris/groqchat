'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (!draftRef.current) return;
    draftRef.current.style.height = '0px';
    draftRef.current.style.height = `${draftRef.current.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
    } catch {
      setError('Network error sending request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setDraft('');
    setError(null);
    setSettingsOpen(false);
  }

  const settingsPanel = (
    <div className="space-y-6">
      <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
        <p className="text-sm font-semibold text-slate-200">System Prompt</p>
        <textarea
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          rows={5}
          className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        />
      </div>
      <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
        <p className="text-sm font-semibold text-slate-200">Scene / NPC Context</p>
        <textarea
          value={sceneContext}
          onChange={(event) => setSceneContext(event.target.value)}
          rows={8}
          className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
          <p className="text-sm font-semibold text-slate-200">Model</p>
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
          />
        </div>
        <details className="group rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200 transition hover:text-slate-100">
            Prompt Preview
          </summary>
          <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{promptPreview}</pre>
        </details>
      </div>
    </div>
  );

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 px-4 py-4">
        <header className="shrink-0 flex flex-col gap-4 rounded-[32px] border border-slate-800 bg-slate-950/80 px-5 py-5 shadow-glow sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Groq Dungeon Master</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">GROQCHAT — Dungeon Master Chat</h1>
            <p className="max-w-2xl text-sm text-slate-400">A modern conversation experience for tabletop roleplaying prompts, scene context, and Groq-powered responses.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 lg:hidden"
            >
              Scene & Prompt
            </button>
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Clear Chat
            </button>
          </div>
        </header>

        <div className="flex h-full gap-6 xl:grid xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="hidden xl:block min-h-0">
            <div className="sticky top-4 flex h-[calc(100vh-4.5rem)] min-h-0 flex-col overflow-hidden space-y-6 rounded-[32px] border border-slate-800 bg-slate-950/90 p-6 shadow-glow">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Settings</p>
                <h2 className="text-xl font-semibold text-slate-100">Scene & Prompt</h2>
                <p className="text-sm text-slate-400">Keep the conversation centred while editing the DM context and model.</p>
              </div>
              {settingsPanel}
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90 shadow-glow">
            <div className="border-b border-slate-800 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Chat Transcript</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-100">Your adventure with Mira</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  {loading ? <span>Waiting for Groq…</span> : <span>Ready for your next move.</span>}
                </div>
              </div>
            </div>

            <div ref={transcriptRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400">
                  <p className="text-lg font-medium text-slate-100">Start your investigation</p>
                  <p className="mt-3 max-w-xl text-sm leading-7">Begin by greeting Mira, looking around the inn, or asking about the missing courier.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} `}
                    >
                      <div className={`max-w-[min(760px,100%)] rounded-[28px] border p-5 text-sm leading-7 shadow-sm ${
                        message.role === 'user'
                          ? 'border-slate-700 bg-slate-800/90 text-slate-100'
                          : 'border-slate-700/70 bg-slate-900/95 text-slate-100'
                      }`}>
                        <p className="text-[0.75rem] uppercase tracking-[0.25em] text-slate-500">
                          {message.role === 'user' ? 'You' : 'Dungeon Master'}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error ? (
              <div className="border-t border-rose-600/20 bg-rose-950/80 px-6 py-4 text-sm text-rose-200 sm:px-8">
                {error}
              </div>
            ) : null}

            <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 px-6 py-5 backdrop-blur sm:px-8">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <textarea
                  ref={draftRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={1}
                  placeholder="Message your Dungeon Master…"
                  className="min-h-[64px] w-full resize-none rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">Shift+Enter for a new line. Enter to send.</p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={sendMessage}
                    className="inline-flex items-center justify-center rounded-3xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/70"
                  >
                    {loading ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/95 p-4 backdrop-blur sm:hidden">
          <div className="w-full overflow-hidden rounded-t-[32px] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Scene & Prompt</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">Edit your adventure</h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            {settingsPanel}
          </div>
        </div>
      ) : null}
    </main>
  );
}
