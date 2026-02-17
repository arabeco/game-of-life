import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import fs from 'fs'; // Importa o leitor de arquivos

async function main() {
  // 1. LER O SAVE GAME
  const rawData = fs.readFileSync('./save_game.json', 'utf-8');
  const saveGame = JSON.parse(rawData);

  const google = createGoogleGenerativeAI({
    apiKey: "AIzaSyAryjNyDFBRrwfvsHdQWvUTCRm1-yx83zo"
  });

  const result = streamText({
    model: google('models/gemini-3-flash-preview'),
    
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