# GROQCHAT

A minimal Groq-powered Dungeon Master chatbot built with Next.js, TypeScript, and Tailwind CSS.

## What it does

- Lets you edit a Dungeon Master system prompt.
- Lets you describe the scene / NPC / context.
- Sends player messages to Groq chat completion API.
- Shows Groq responses as a DM in a chat transcript.
- Persists prompt, scene, model, and chat history in `localStorage`.

## Run locally

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env.local` and add your Groq key(s):

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
pnpm dev
```

4. Open `http://localhost:3000`

## Environment variables

Set these in `.env.local` or in Vercel:

```env
GROQ_API_KEY=
GROQ_API_KEYS=
GROQ_MODEL=llama-3.3-70b-versatile
```

- `GROQ_API_KEY` is the primary Groq API key.
- `GROQ_API_KEYS` supports comma-separated backup keys.
- `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`.

## Vercel deployment

This app is ready for Vercel deploy. Make sure your project environment variables include:

- `GROQ_API_KEY`
- optionally `GROQ_API_KEYS`
- `GROQ_MODEL`

Then run:

```bash
pnpm build
```

## Tests

Run:

```bash
pnpm test
```

## Notes

- API keys are never exposed to the browser.
- If all Groq keys fail, the app shows a helpful error message.
