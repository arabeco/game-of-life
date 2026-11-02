// Teste de ouvido: mesmo prompt, 3 modelos, N amostras cada.
// Raciocinio desligado e temperatura fixa, para medir a voz e nao a sorte.
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error('Falta OPENROUTER_API_KEY no ambiente.'); process.exit(1); }

const DIR = new URL('.', import.meta.url).pathname;
const PROMPT = readFileSync(DIR + '../docs/oraculo-ia/prompt-teste-de-voz.txt', 'utf8');
const AMOSTRAS = Number(process.env.AMOSTRAS || 3);

// Pedacos do slug -> o /models resolve o nome exato, que muda com o tempo.
const QUERO = [
  { nome: 'Qwen3.7 Flash',        busca: ['qwen', '3.7', 'flash'], provider: null },
  { nome: 'DeepSeek V4.1 Flash',  busca: ['deepseek', 'v4.1', 'flash'], provider: ['Wafer'] },
  { nome: 'Claude Haiku 5.5',     busca: ['anthropic', 'haiku', '5.5'], provider: null },
];

const api = async (caminho, body) => {
  const r = await fetch('https://openrouter.ai/api/v1' + caminho, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${txt.slice(0, 300)}`);
  return JSON.parse(txt);
};

const catalogo = (await api('/models')).data.map((m) => m.id);
const resolver = ({ busca }) => {
  const hits = catalogo.filter((id) => busca.every((p) => id.toLowerCase().includes(p)));
  hits.sort((a, b) => a.length - b.length);
  return hits[0] || null;
};

const linhas = ['# Teste de ouvido do Oráculo', '', `Rodado em ${new Date().toISOString()} · ${AMOSTRAS} amostras por modelo`, ''];
for (const alvo of QUERO) {
  const slug = resolver(alvo);
  linhas.push(`## ${alvo.nome}`, '');
  if (!slug) { linhas.push('_não encontrado no catálogo do OpenRouter_', ''); console.error('sem slug:', alvo.nome); continue; }
  linhas.push(`\`${slug}\`${alvo.provider ? ` · provedor fixado: ${alvo.provider.join(', ')}` : ''}`, '');
  for (let i = 1; i <= AMOSTRAS; i++) {
    try {
      const res = await api('/chat/completions', {
        model: slug,
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 500,
        temperature: 0.7,
        reasoning: { enabled: false },
        ...(alvo.provider ? { provider: { order: alvo.provider, allow_fallbacks: false } } : {}),
      });
      const texto = res.choices?.[0]?.message?.content?.trim() || '(vazio)';
      const u = res.usage || {};
      linhas.push(`### amostra ${i}`, '', '```', texto, '```', `entrada ${u.prompt_tokens ?? '?'} · saída ${u.completion_tokens ?? '?'} · servido por ${res.provider ?? '?'}`, '');
      console.error(`ok ${alvo.nome} #${i}`);
    } catch (e) {
      linhas.push(`### amostra ${i}`, '', `**ERRO:** ${e.message}`, '');
      console.error(`ERRO ${alvo.nome} #${i}: ${e.message}`);
    }
  }
}
writeFileSync(DIR + '../docs/oraculo-ia/resultado-teste-de-voz.md', linhas.join('\n'));
console.error('\nescrito em ' + DIR + '../docs/oraculo-ia/resultado-teste-de-voz.md');
