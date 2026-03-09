import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import fs from 'fs';

async function main() {
  const rawData = fs.readFileSync('./save_game.json', 'utf-8');
  const saveGame = JSON.parse(rawData);

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY nao definida no ambiente.');
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: openRouterApiKey,
  });

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    system: `Voce e o Mentor Supremo do sistema GLYPH.
    DADOS ATUAIS DO JOGADOR:
    - Nome: ${saveGame.jogador}
    - Perfil: ${saveGame.perfil}
    - Nivel Global: ${saveGame.nivel_global}
    - XP Total: ${saveGame.xp_total}
    - Status das Arenas: ${JSON.stringify(saveGame.status_arenas)}

    REGRAS DE CONVERSA:
    - Nunca saia do personagem Mentor do Glyph.
    - Use os dados do JSON para dar conselhos especificos.
    - Trate o progresso como um RPG real. Se ele ganhou XP em uma arena, comemore o "Level Up".`,
    prompt: 'Mentor, acabei de finalizar uma edicao pesada (area 8). Como isso afeta meu progresso global?',
  });

  console.log(`--- [ LOGADO COMO: ${saveGame.jogador} | LVL: ${saveGame.nivel_global} ] ---`);

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
}

main();
