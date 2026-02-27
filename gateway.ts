import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import fs from 'fs'; // Importa o leitor de arquivos

async function main() {
  // 1. LER O SAVE GAME
  const rawData = fs.readFileSync('./save_game.json', 'utf-8');
  const saveGame = JSON.parse(rawData);

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: "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"
  });

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    
    // 2. PASSAR O SAVE PARA O SISTEMA
    system: `Você é o Mentor Supremo do sistema GLYPH. 
    DADOS ATUAIS DO JOGADOR:
    - Nome: ${saveGame.jogador}
    - Perfil: ${saveGame.perfil}
    - Nível Global: ${saveGame.nivel_global}
    - XP Total: ${saveGame.xp_total}
    - Status das Arenas: ${JSON.stringify(saveGame.status_arenas)}
    
    REGRAS DE CONVERSA:
    - Nunca saia do personagem Mentor do Glyph.
    - Use os dados do JSON para dar conselhos específicos.
    - Trate o progresso como um RPG real. Se ele ganhou XP em uma arena, comemore o "Level Up".`,

    prompt: 'Mentor, acabei de finalizar uma edição pesada (Área 8). Como isso afeta meu progresso global?',
  });

  console.log(`--- [ LOGADO COMO: ${saveGame.jogador} | LVL: ${saveGame.nivel_global} ] ---`);

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
}

main();