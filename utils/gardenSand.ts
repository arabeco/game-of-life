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

/**
 * Uma impressao digital do desenho, para saber se ele mudou.
 *
 * FNV-1a sobre as duas data URLs. Nao precisa ser criptografico: a pergunta e
 * "e o mesmo desenho de antes?", e colisao aqui significaria no maximo nao
 * re-subir uma areia que mudou — nao ha segredo em jogo. Precisa ser rapido,
 * porque roda sobre algumas centenas de KB de base64 a cada salvamento.
 */
const impressaoDoDesenho = (color: string, height: string): string => {
    let h = 0x811c9dc5;
    for (const texto of [color, height]) {
        for (let i = 0; i < texto.length; i += 1) {
            h ^= texto.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
    }
    return (h >>> 0).toString(36);
};

/**
 * O ultimo desenho que subiu, por usuario, nesta sessao.
 *
 * Existe porque o estado que chega do iframe traz SEMPRE a areia como data URL,
 * mesmo quando ela nao foi tocada — entao mover uma pedra fazia o
 * uploadGardenSand re-subir dois PNG de 512x1024 e trocar a URL, invalidando o
 * cache de todo mundo que fosse ver aquele jardim. A conta era paga em egress
 * por uma pedra arrastada tres pixels.
 */
const ultimoEnvio = new Map<string, { impressao: string; color: string; height: string }>();

const enviarPng = async (
    userId: string,
    nome: 'color' | 'height',
    dataUrl: string,
    impressao: string,
): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob();
    const caminho = `${userId}/${nome}.png`;

    const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
        upsert: true,
        contentType: 'image/png',
        // Um ano, e nao uma hora. O `?v=` passa a ser a impressao do desenho:
        // a URL so muda quando o desenho muda, entao ela pode ser guardada para
        // sempre. Com o relogio no lugar da impressao, a URL mentia — mudava
        // sem o conteudo mudar — e um ano de cache teria sido um bug.
        cacheControl: '31536000',
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
    return `${data.publicUrl}?v=${impressao}`;
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

    const impressao = impressaoDoDesenho(desenho.color, desenho.height);

    // Desenho igual ao do ultimo envio: reaproveita as URLs e nao encosta no
    // bucket. E o caso comum — quem entra no jardim para mexer num objeto nao
    // desenhou areia nenhuma.
    const anterior = ultimoEnvio.get(userId);
    if (anterior?.impressao === impressao) {
        return { ...state, drawing: { color: anterior.color, height: anterior.height } };
    }

    const [color, height] = await Promise.all([
        enviarPng(userId, 'color', desenho.color, impressao),
        enviarPng(userId, 'height', desenho.height, impressao),
    ]);

    ultimoEnvio.set(userId, { impressao, color, height });
    return { ...state, drawing: { color, height } };
};
