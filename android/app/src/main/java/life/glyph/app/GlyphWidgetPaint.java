package life.glyph.app;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

/**
 * O PINCEL DO WIDGET — o mesmo acabamento de metal da ficha de ciclo.
 *
 * A cor NAO vem da Skin de UI. Vem do PATAMAR do ciclo, que e o que a ficha faz:
 * rubi no SS, violeta no S, ouro no A, prata no B, bronze no C, aco no D, ferro
 * no E. Um ciclo que vai bem muda de cor sozinho, e e isso que o cartao da tela
 * inicial passa a mostrar.
 *
 * A tabela abaixo e copia de PLATE_FINISHES, em components/MetalReportCard.tsx.
 * Tem de ser copia: o widget e Java puro rodando fora da WebView, sem acesso a
 * nada do app. Mudou la, muda aqui — e o teste de widget guarda os dois lados.
 *
 * A prova de que a familia sempre foi esta: a barra de progresso que este
 * arquivo substitui era `#B47A18 -> #FFD462 -> #FFF1B8`, e `#fff1b8` e
 * exatamente o `pale` do patamar A. A barra ja era o acabamento de ouro; ela so
 * nao sabia mudar de patamar.
 *
 * Um widget nao roda CSS: ele so aceita a lista fechada de comandos de
 * RemoteViews. `setBackgroundColor` so aceita cor solida, e `setProgressTintList`
 * so vale da API 31 para cima enquanto o minSdk aqui e 24. Por isso tudo aqui e
 * Bitmap desenhado, entregue por setImageViewBitmap.
 */
final class GlyphWidgetPaint {
    /**
     * Um acabamento de metal: escuro, meio e claro.
     *
     * Os tres juntos e que fazem o brilho. Uma barra de cor chapada nao e uma
     * barra de metal mais simples — e outra coisa, e pior.
     */
    static final class Acabamento {
        final int face;
        final int dark;
        final int mid;
        final int pale;

        private Acabamento(int face, int dark, int mid, int pale) {
            this.face = face;
            this.dark = dark;
            this.mid = mid;
            this.pale = pale;
        }
    }

    private static Acabamento de(String face, String dark, String mid, String pale) {
        return new Acabamento(Color.parseColor(face), Color.parseColor(dark), Color.parseColor(mid), Color.parseColor(pale));
    }

    /** Ouro selado: o acabamento de sempre, e o que vale quando nao ha ciclo. */
    static final Acabamento PADRAO = de("#705513", "#725620", "#d8ae42", "#fff1b8");

    /**
     * O patamar vira acabamento. Nota desconhecida cai no ouro, que e o que o
     * widget sempre mostrou — e nao no aco do D, para nao trocar a cara do
     * cartao de quem ainda nao tem ciclo nenhum.
     */
    static Acabamento acabamentoDe(String patamar) {
        if (patamar == null) return PADRAO;
        switch (patamar.trim().toUpperCase()) {
            case "SS": return de("#3f0a18", "#64401f", "#c39a51", "#ffe4a2");
            case "S":  return de("#4a2169", "#604421", "#c6a05c", "#ffe5ab");
            case "A":  return PADRAO;
            case "B":  return de("#152a36", "#293c48", "#859ea9", "#e4eff4");
            case "C":  return de("#291a13", "#4b3223", "#b07c54", "#f2c39b");
            case "D":  return de("#101f2c", "#283d4d", "#68899e", "#c1dce9");
            case "E":  return de("#191613", "#302c29", "#81756b", "#d0c7bd");
            default:   return PADRAO;
        }
    }

    private GlyphWidgetPaint() {
    }

    /**
     * A cor puxada para o preto.
     *
     * A face do metal e feita para uma ficha grande, atras de camadas de sombra.
     * Numa faixa de 56dp com texto direto por cima ela vira um bloco de cor: a
     * chapa deixa de parecer metal escuro e passa a parecer um retangulo pintado.
     * Metade do valor devolve a discricao sem perder o tom.
     */
    private static int escurecer(int cor, float quanto) {
        return Color.rgb(
            Math.round(Color.red(cor) * quanto),
            Math.round(Color.green(cor) * quanto),
            Math.round(Color.blue(cor) * quanto)
        );
    }

    /** A cor com outra opacidade, mantendo o tom. */
    private static int comAlfa(int cor, int alfa) {
        return (alfa << 24) | (cor & 0x00FFFFFF);
    }

    /**
     * O CHANFRO — canto CORTADO, e nao arredondado.
     *
     * E o que separa a peca nova da antiga. O monolito aprovado
     * (constants/rewardPlateStyles.ts, direcao B) tem um octogono simetrico:
     * `polygon(0 28px, 28px 0, ...)`. Canto redondo e outra linguagem — foi o
     * que eu desenhei primeiro, e por isso a ficha nao se parecia com a do app.
     *
     * Os 28px sao de uma placa de 368 de largura. Aqui a faixa tem 56dp de
     * altura, entao o corte sai em proporcao da MENOR dimensao, que e quem
     * governa como o chanfro se le.
     */
    private static Path octogono(float x0, float y0, float x1, float y1, float corte) {
        Path p = new Path();
        p.moveTo(x0, y0 + corte);
        p.lineTo(x0 + corte, y0);
        p.lineTo(x1 - corte, y0);
        p.lineTo(x1, y0 + corte);
        p.lineTo(x1, y1 - corte);
        p.lineTo(x1 - corte, y1);
        p.lineTo(x0 + corte, y1);
        p.lineTo(x0, y1 - corte);
        p.close();
        return p;
    }

    /**
     * O fundo da ficha: monolito de aco com o tom do patamar por cima, de leve.
     *
     * O corpo NAO e colorido. Ele e o mesmo quase-preto de sempre —
     * `#1a1c1f -> #090a0c -> #111315` —, e o patamar entra como duas lavagens
     * fraquissimas: um halo no alto a 16% e uma diagonal a 5,5%. Foi aqui que eu
     * errei na primeira versao: pintei a chapa inteira de dourado quando a cor
     * devia ser quase imperceptivel, e o que se via era um retangulo pintado.
     *
     * A BORDA E A PECA. Sao quatro linhas concentricas — aco por fora, depois
     * escuro, aco fino, escuro de novo —, que e o que da a espessura. Sem elas
     * sobra so um retangulo com a cor certa.
     *
     * O tamanho vem de fora porque o ImageView escala com `fitXY`: desenhar num
     * quadrado e esticar deformaria o chanfro.
     */
    static Bitmap fundo(Acabamento metal, int largura, int altura) {
        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);

        final float menor = Math.min(largura, altura);
        final float corte = menor * 0.20f;
        final float traco = Math.max(2f, menor * 0.05f);

        Path placa = octogono(traco / 2f, traco / 2f, largura - traco / 2f, altura - traco / 2f, corte);

        /*
         * 1. O corpo: aco escuro, com o canto de entrada no tom do patamar.
         *
         * Quem distingue os patamares e a FACE — rubi no SS, violeta no S, ouro
         * no A —, e nao o mid, que e dourado nos tres. Sem a face aqui, SS, S e A
         * saiam identicos e a ficha deixava de mudar de cor, que era o pedido.
         *
         * A face ja nasce escura (#3f0a18, #4a2169, #705513), entao ela tinge sem
         * clarear: o corpo continua sendo uma chapa preta, so que de rubi ou de
         * violeta no canto onde a luz bate.
         */
        Paint corpo = new Paint(Paint.ANTI_ALIAS_FLAG);
        corpo.setShader(new LinearGradient(
            0f, 0f, largura * 0.35f, altura,
            new int[] { metal.face, 0xFF090A0C, 0xFF111315 },
            new float[] { 0f, 0.58f, 1f },
            Shader.TileMode.CLAMP
        ));
        tela.drawPath(placa, corpo);

        // 2. O tom do patamar, so como luz. Um halo no alto e uma diagonal fraca:
        //    sao os mesmos 16% e 5,5% do fundoComTom da placa do app.
        tela.save();
        tela.clipPath(placa);
        Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
        halo.setShader(new RadialGradient(
            largura / 2f, -altura * 0.06f, Math.max(largura * 0.55f, altura),
            comAlfa(metal.mid, 0x29), comAlfa(metal.mid, 0x00),
            Shader.TileMode.CLAMP
        ));
        tela.drawPaint(halo);
        Paint diagonal = new Paint(Paint.ANTI_ALIAS_FLAG);
        diagonal.setShader(new LinearGradient(
            0f, 0f, largura, altura,
            new int[] { comAlfa(metal.mid, 0x0E), comAlfa(metal.mid, 0x00), comAlfa(metal.mid, 0x07), comAlfa(metal.mid, 0x00) },
            new float[] { 0f, 0.35f, 0.72f, 1f },
            Shader.TileMode.CLAMP
        ));
        tela.drawPaint(diagonal);
        tela.restore();

        // 3. As quatro linhas. Esta e a parte bonita, e a que faltava.
        Paint linha = new Paint(Paint.ANTI_ALIAS_FLAG);
        linha.setStyle(Paint.Style.STROKE);

        linha.setStrokeWidth(traco);
        linha.setColor(0xFF56585A);
        tela.drawPath(placa, linha);

        final float fino = Math.max(1f, traco * 0.36f);
        final float[] recuos = { traco * 1.3f, traco * 1.9f, traco * 2.9f };
        final int[] cores = { 0xFF090B0D, 0xFF33363A, 0xFF0B0D0F };
        for (int k = 0; k < recuos.length; k++) {
            float r = recuos[k];
            if (largura - r * 2f <= corte || altura - r * 2f <= corte) break;
            linha.setStrokeWidth(fino);
            linha.setColor(cores[k]);
            tela.drawPath(octogono(r, r, largura - r, altura - r, Math.max(2f, corte - r)), linha);
        }

        // 4. E o unico ponto em que o patamar aparece com forca: o fio mais
        //    interno, no tom claro do metal. E ele que diz de que material a
        //    ficha e feita, sem tingir o resto.
        float rFio = traco * 3.6f;
        if (largura - rFio * 2f > corte && altura - rFio * 2f > corte) {
            linha.setStrokeWidth(Math.max(1f, fino * 0.8f));
            linha.setColor(comAlfa(metal.pale, 0x6E));
            tela.drawPath(octogono(rFio, rFio, largura - rFio, altura - rFio, Math.max(2f, corte - rFio)), linha);
        }

        return bitmap;
    }

    /**
     * A barra de progresso, com o brilho de metal de volta.
     *
     * Tres paradas na horizontal — escuro, meio, claro —, que e exatamente o que
     * o glyph_widget_progress.xml fazia e o que eu tinha achatado numa cor so. A
     * trilha e preta a 40%, como era.
     *
     * `forte` separa as duas barras da ficha: a de ACOES usa o acabamento do
     * patamar, a de TEMPO usa prata. Nao e a mesma cor esmaecida — sao dois
     * metais, que e como as duas barras sempre se distinguiram.
     */
    static Bitmap barra(Acabamento metal, int porcento, boolean forte, int largura) {
        // A barra tem 3dp fixos no layout; 12px de altura no bitmap dao folga
        // para as pontas arredondadas nao serrilharem quando o ImageView encolhe.
        final int altura = 12;
        final float raio = altura / 2f;
        int p = Math.max(0, Math.min(100, porcento));

        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);

        Paint trilha = new Paint(Paint.ANTI_ALIAS_FLAG);
        trilha.setColor(0x66000000);
        tela.drawRoundRect(new RectF(0f, 0f, largura, altura), raio, raio, trilha);

        if (p > 0) {
            // Piso na largura: abaixo de uma bolinha, o canto arredondado come o
            // desenho e 1% fica igual a 0%.
            float cheio = Math.max(altura, largura * (p / 100f));
            Acabamento tinta = forte ? metal : acabamentoDe("B");
            Paint preenchimento = new Paint(Paint.ANTI_ALIAS_FLAG);
            // O gradiente cobre a LARGURA CHEIA da barra, e nao so o pedaço
            // preenchido: assim o brilho anda junto com o progresso em vez de
            // ser reimpresso inteiro a cada ponto percentual.
            preenchimento.setShader(new LinearGradient(
                0f, 0f, largura, 0f,
                new int[] { tinta.dark, tinta.mid, tinta.pale },
                new float[] { 0f, 0.55f, 1f },
                Shader.TileMode.CLAMP
            ));
            tela.drawRoundRect(new RectF(0f, 0f, cheio, altura), raio, raio, preenchimento);
        }

        return bitmap;
    }
}
