// Teste do Oraculo com IA (02/11/2026): os prompts de docs/oraculo-ia no
// Haiku 5.5, provedor Anthropic fixado, sem raciocinio. Mostra a resposta,
// o tempo, os tokens e o custo de cada chamada.
//
//   node --env-file=.env.local tools/teste-haiku-oraculo.mjs [prompt.txt ...]
import { readFileSync } from 'node:fs';

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error('Falta OPENROUTER_API_KEY no .env.local'); process.exit(1); }

const MODELO = 'anthropic/claude-haiku-5.5';
const DIR = new URL('../docs/oraculo-ia/', import.meta.url);
const arquivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['prompt-teste-ia-decide.txt', 'prompt-teste-dia-ruim.txt'];

for (const arquivo of arquivos) {
  const prompt = readFileSync(new URL(arquivo, DIR), 'utf8');
  const inicio = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
      reasoning: { enabled: false },
      provider: { order: ['Anthropic'], allow_fallbacks: false },
      usage: { include: true },
    }),
  });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  const corpo = await res.json();
  if (!res.ok) { console.log(`\n=== ${arquivo}: erro ${res.status}`, JSON.stringify(corpo.error || corpo)); continue; }
  const u = corpo.usage || {};
  console.log(`\n=== ${arquivo}`);
  console.log(`${segundos}s · entrada ${u.prompt_tokens} · saida ${u.completion_tokens} · US$ ${u.cost ?? '?'} · servido por ${corpo.provider}`);
  console.log(corpo.choices?.[0]?.message?.content?.trim());
}
