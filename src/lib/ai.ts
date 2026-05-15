const AI_KEY = 'rt:aiKey';
const AI_PROVIDER = 'rt:aiProvider';

export type AiProvider = 'openai' | 'anthropic';

export function getAiKey() {
  return sessionStorage.getItem(AI_KEY);
}

export function getAiProvider(): AiProvider {
  return (sessionStorage.getItem(AI_PROVIDER) as AiProvider) || 'openai';
}

export function saveAiKey(key: string, provider: AiProvider) {
  sessionStorage.setItem(AI_KEY, key);
  sessionStorage.setItem(AI_PROVIDER, provider);
}

export function clearAiKey() {
  sessionStorage.removeItem(AI_KEY);
}

function parseAiErrorBody(raw: string): string {
  try {
    const j = JSON.parse(raw);
    const inner = j.error || j;
    return inner.message || inner.type || raw.slice(0, 280);
  } catch {
    return raw.slice(0, 280);
  }
}

export async function fetchAiCompletion(provider: AiProvider, key: string, system: string, userMsg: string) {
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1200,
        temperature: 0.3,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(parseAiErrorBody(raw));
    const data = JSON.parse(raw);
    const block = data.content?.[0];
    return block?.type === 'text' ? block.text : '(leere Antwort)';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg }
      ]
    })
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(parseAiErrorBody(raw));
  const data = JSON.parse(raw);
  return data.choices?.[0]?.message?.content || '(leere Antwort)';
}
