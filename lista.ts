import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

async function main() {
  console.log("--- Iniciando com o ID Exato da Lista ---");

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: "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" 
  });

  try {
    const result = streamText({
      // Usando o ID exato que apareceu na sua lista (o mais estável)
      model: openrouter('google/gemini-2.0-flash-001'), 
      prompt: 'Se você está lendo isso, o código finalmente funcionou! Comemore com uma frase épica.',
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    
    console.log("\n\n--- FOI! FINALMENTE! ---");

  } catch (erro) {
    // Se der erro de cota (429), é porque o Google limita o uso grátis por minuto.
    // Espere 60 segundos e tente de novo.
    console.error("Erro técnico:", erro);
  }
}

main();