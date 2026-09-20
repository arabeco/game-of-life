package life.glyph.app;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;

/**
 * O PINCEL DO WIDGET.
 *
 * Um widget nao roda CSS: ele so aceita a lista fechada de comandos de
 * RemoteViews. `setBackgroundColor` existe, mas so aceita cor SOLIDA — usa-la
 * apagaria o gradiente e os cantos arredondados que dao a cara do cartao de
 * ciclo. E `setProgressTintList`, que resolveria as barras, so e metodo
 * permitido a partir da API 31, enquanto o minSdk daqui e 24.
 *
 * A saida e desenhar. Bitmap desenhado aqui, entregue por setImageViewBitmap,
 * funciona em qualquer versao e aceita qualquer forma.
 *
 * Tudo aqui trabalha em PIXEL, e nao em dp. O fundo recebe o tamanho real do
 * widget na tela, medido pelo provider, para que o `fitXY` do ImageView seja
 * uma copia 1:1 e o canto arredondado nao vire elipse num cartao de 5,4 para 1.
 * As barras recebem so a largura: a altura delas e fixa em 3dp no layout, e 12
 * pixels bastam para as pontas arredondadas nao serrilharem ao encolher.
 */
final class GlyphWidgetPaint {
    /** O dourado de sempre, para quando o app ainda nao mandou cor nenhuma. */
    static final int COR_PADRAO = 0xFFD4AF37;

    private GlyphWidgetPaint() {
    }

    /**
     * Le "#rrggbb" do snapshot. Cor invalida cai no dourado em vez de estourar:
     * um widget que nao desenha e pior que um widget com a cor errada.
     */
    static int lerCor(String hex) {
        if (hex == null) return COR_PADRAO;
        String limpo = hex.trim();
        if (limpo.isEmpty()) return COR_PADRAO;
        if (!limpo.startsWith("#")) limpo = "#" + limpo;
        try {
            return Color.parseColor(limpo);
        } catch (IllegalArgumentException _erro) {
            return COR_PADRAO;
        }
    }

    /** A cor com outra opacidade, mantendo o tom. */
    private static int comAlfa(int cor, int alfa) {
        return (alfa << 24) | (cor & 0x00FFFFFF);
    }

    /**
     * A cor misturada com preto, na proporcao dada.
     *
     * O fundo nao pode ser a cor pura: um CYBER `#00FF00` a plena luz viraria uma
     * placa verde-limao com texto branco por cima, ilegivel. O que da o efeito e
     * o TOM da skin passando por um fundo escuro — que e exatamente o que o
     * gradiente do app faz.
     */
    private static int escurecer(int cor, float quantoFicaDaCor) {
        float q = Math.max(0f, Math.min(1f, quantoFicaDaCor));
        int r = Math.round(Color.red(cor) * q);
        int g = Math.round(Color.green(cor) * q);
        int b = Math.round(Color.blue(cor) * q);
        return Color.rgb(r, g, b);
    }

    /**
     * O fundo do cartao: gradiente diagonal da cor da skin para o quase-preto,
     * com canto arredondado e uma borda fina no tom.
     *
     * A diagonal e a mesma do drawable que este metodo substitui (135 graus,
     * canto superior esquerdo para o inferior direito), para o widget nao mudar
     * de forma quando a cor passar a variar — so de cor.
     *
     * O TAMANHO VEM DE FORA, e por um motivo: o ImageView escala com `fitXY`, e
     * o cartao e um retangulo bem deitado — 300dp por 56dp, quase 5,4 para 1, e
     * ainda redimensionavel. Desenhar num quadrado e esticar transformaria o
     * canto arredondado numa elipse larga. Desenhando na medida real, o `fitXY`
     * vira uma copia 1:1 e o raio sai redondo.
     */
    static Bitmap fundo(int corDaSkin, int largura, int altura) {
        /*
         * Raio e borda em PROPORCAO da altura, nao em pixel fixo.
         *
         * O bitmap agora sai no tamanho real em pixel, que muda com a densidade
         * da tela: um raio fixo de 36px seria 18dp num aparelho de densidade 2 e
         * 12dp num de densidade 3 — o mesmo widget mais quadrado no aparelho
         * melhor. O cartao declarado tem 56dp de altura e 18dp de raio, ou seja
         * 32% da altura; a borda tem 1dp, ou seja 1/56. Em proporcao, as duas
         * medidas acompanham qualquer tela e qualquer redimensionamento.
         */
        final float raio = Math.min(altura * 0.32f, altura / 2f);
        final float espessuraDaBorda = Math.max(1.5f, altura / 56f);
        final float recuo = espessuraDaBorda / 2f;

        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);

        RectF area = new RectF(recuo, recuo, largura - recuo, altura - recuo);
        Paint pincel = new Paint(Paint.ANTI_ALIAS_FLAG);
        pincel.setShader(new LinearGradient(
            0f, 0f, largura, altura,
            new int[] { escurecer(corDaSkin, 0.20f), 0xFF1F2630, 0xFF0D1116 },
            new float[] { 0f, 0.55f, 1f },
            Shader.TileMode.CLAMP
        ));
        tela.drawRoundRect(area, raio, raio, pincel);

        Paint borda = new Paint(Paint.ANTI_ALIAS_FLAG);
        borda.setStyle(Paint.Style.STROKE);
        borda.setStrokeWidth(espessuraDaBorda);
        borda.setColor(comAlfa(corDaSkin, 0x52));
        tela.drawRoundRect(area, raio, raio, borda);

        return bitmap;
    }

    /**
     * Uma barra de progresso: trilha escura inteira, preenchimento no tom.
     *
     * `forte` separa as duas barras do cartao — a de acoes e a cor cheia, a de
     * tempo e a mesma cor esmaecida, que e a hierarquia que o
     * glyph_widget_progress_soft.xml ja fazia. Sem isso as duas competiriam.
     */
    static Bitmap barra(int corDaSkin, int porcento, boolean forte, int largura) {
        // A barra tem 3dp fixos no layout; 12px de altura no bitmap dao folga para o
        // arredondamento das pontas nao serrilhar quando o ImageView encolhe.
        final int altura = 12;
        final float raio = altura / 2f;
        int p = Math.max(0, Math.min(100, porcento));

        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);

        Paint trilha = new Paint(Paint.ANTI_ALIAS_FLAG);
        trilha.setColor(0x33FFFFFF);
        tela.drawRoundRect(new RectF(0f, 0f, largura, altura), raio, raio, trilha);

        if (p > 0) {
            // Piso na largura do preenchimento: abaixo de uma bolinha, o canto
            // arredondado come o desenho e 1% fica igual a 0%.
            float cheio = Math.max(altura, largura * (p / 100f));
            Paint preenchimento = new Paint(Paint.ANTI_ALIAS_FLAG);
            preenchimento.setColor(forte ? corDaSkin : comAlfa(corDaSkin, 0x8C));
            tela.drawRoundRect(new RectF(0f, 0f, cheio, altura), raio, raio, preenchimento);
        }

        return bitmap;
    }
}
