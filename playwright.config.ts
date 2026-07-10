import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm.cmd dev --hostname 127.0.0.1 --port 3101',
    url: 'http://127.0.0.1:3101',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      GROQ_API_KEY: 'e2e-groq-key',
      GROQ_API_KEYS: '',
      OPENAI_API_KEY: '',
      GROQCHAT_MOCK_GROQ_RESPONSE: 'A safe family-friendly response.',
      GROQCHAT_GROQ_CALLED_FILE: 'test-results/groq-called.txt',
      GROQCHAT_MOCK_UNSAFE_TRIGGER: 'unsafe_output_probe',
      GROQCHAT_MOCK_MODERATION_ERROR_TRIGGER: 'moderation_error_probe',
      GROQCHAT_MOCK_MODERATION_UNCLEAR_TRIGGER: 'moderation_unclear_probe',
      GROQCHAT_MOCK_SAFETY_EXCEPTION_TRIGGER: 'safety_exception_probe',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
