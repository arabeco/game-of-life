import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

async function main() {
  console.log("--- Iniciando com o ID Exato da Lista ---");

  const google = createGoogleGenerativeAI({
    apiKey: "AIzaSyAryjNyDFBRrwfvsHdQWvUTCRm1-yx83zo" 
  });

  try {
    const result = streamText({
      // Usando o ID exato que apareceu na sua lista (o mais estável)
      model: google('models/gemini-flash-latest'), 
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