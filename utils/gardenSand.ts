import { supabase } from '../supabaseClient';
import type { GardenSnapshot } from '../views/zen3d/gardenAccount';

/**
 * A AREIA SAI DO BANCO E VIRA ARQUIVO.
 *
 * O desenho da areia sao dois PNG de 512x1024 — cor e relevo. Eles nasciam
 * embutidos no documento do jardim como base64 dentro do jsonb, o que dava um
 * documento de ate 3,2 MB que viajava INTEIRO a cada abertura, sem cache: jsonb
 * nao e arquivo, nenhuma camada entre o banco e o app guarda uma copia dele.
 *
 * Como arquivo no bucket, os dois PNG passam a se comportar como o resto da arte
 * do jogo: baixam uma vez e ficam no aparelho. O documento fica com duas URLs
 * curtas, e a abertura do jardim volta a custar alguns KB.
 *
 * O CAMINHO E FIXO POR USUARIO — \`<user_id>/color.png\` e \`<user_id>/height.png\`,
 * sempre com upsert. Cada pessoa ocupa dois arquivos, nao dois por salvamento.
 *
 * O \`?v=\` existe por causa disso: caminho fixo com upsert significa que a URL
 * nao muda quando o desenho muda, e o navegador continuaria mostrando o desenho
 * velho. O parametro troca a cada gravacao e e a unica parte variavel da URL.
 */
const BUCKET = 'garden-sand';

const enviarPng = async (userId: string, nome: 'color' | 'height', dataUrl: string): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob();
    const caminho = `${userId}/${nome}.png`;

    const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
    return `${data.publicUrl}?v=${Date.now()}`;
};

/**
 * Troca o desenho embutido pelas URLs do bucket, e devolve o documento pronto
 * para gravar. Documento sem desenho, ou que ja chega com URL, passa direto —
 * a funcao e idempotente de proposito, porque o caminho de saida do jardim pode
 * pedir um salvamento em cima de um estado que ja foi salvo.
 */
export const uploadGardenSand = async (userId: string, state: GardenSnapshot): Promise<GardenSnapshot> => {
    const desenho = state.drawing;
    if (!desenho || !desenho.color.startsWith('data:')) return state;

    const [color, height] = await Promise.all([
        enviarPng(userId, 'color', desenho.color),
        enviarPng(userId, 'height', desenho.height),
    ]);

    return { ...state, drawing: { color, height } };
};
