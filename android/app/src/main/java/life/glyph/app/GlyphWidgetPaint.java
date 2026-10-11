package life.glyph.app;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
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

    /**
     * O METAL DA BORDA — a escada, em tres degraus.
     *
     * A chapa mostra o TOM do patamar; a borda mostra o MATERIAL. Sao coisas
     * diferentes de proposito: o tom identifica o ciclo, o material diz quanto
     * ele vale. Ferro e aco embaixo, prata no meio, ouro no topo — quem chegou
     * ao A ve a moldura mudar de metal, e isso se le de relance na tela inicial
     * sem precisar ler numero nenhum.
     *
     * Cada degrau tem escuro e claro porque uma borda de cor chapada nao e uma
     * moldura de metal: e um retangulo com contorno.
     */
    static final class Moldura {
        final int escuro;
        final int claro;
        private Moldura(int escuro, int claro) { this.escuro = escuro; this.claro = claro; }
    }

    /*
     * Estes valores NAO foram inventados aqui: sao o `edge` e o `trim` de
     * METAL_RANKS, em components/MetalReportCard.tsx. A ficha do app ja tinha a
     * escada de metais pronta — ouro no topo, prata no B, bronze no C, aco no D,
     * ferro no E — e eu tinha usado so a metade da tabela, a do corpo, enquanto
     * inventava uma moldura de tres degraus ao lado.
     *
     * Os proprios nomes dos patamares dizem que a borda e uma peca separada do
     * corpo: "Roxo E OURO", "Rubi E OURO". A chapa recebe o tom, a moldura recebe
     * o metal.
     */
    private static Moldura moldura(String edge, String trim) {
        return new Moldura(Color.parseColor(edge), Color.parseColor(trim));
    }

    static Moldura molduraDe(String patamar) {
        if (patamar == null) return moldura("#ffe29a", "#fff5d2");
        switch (patamar.trim().toUpperCase()) {
            case "SSS": return moldura("#f1d795", "#fff9e9");
            case "SS": return moldura("#ffd86b", "#fff5d0");
            case "S":  return moldura("#f1c45b", "#fff0c2");
            case "A":  return moldura("#ffe29a", "#fff5d2");
            case "B":  return moldura("#f7fbff", "#ffffff");
            case "C":  return moldura("#f5c18e", "#fbe0c2");
            case "D":  return moldura("#d6e7f2", "#f2f8fc");
            case "E":  return moldura("#d2c1af", "#efe6dc");
            default:   return moldura("#ffe29a", "#fff5d2");
        }
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
            case "SSS": return de("#537cb8", "#5b4c32", "#cfad68", "#fff2c8");
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
    private static Path octogono(float x0, float y0, float x1, float y1, float cx, float cy) {
        Path p = new Path();
        p.moveTo(x0, y0 + cy);
        p.lineTo(x0 + cx, y0);
        p.lineTo(x1 - cx, y0);
        p.lineTo(x1, y0 + cy);
        p.lineTo(x1, y1 - cy);
        p.lineTo(x1 - cx, y1);
        p.lineTo(x0 + cx, y1);
        p.lineTo(x0, y1 - cy);
        p.close();
        return p;
    }

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
    /**
     * A PEDRA DE CADA PATAMAR, COMO NA PLACA DO APP.
     *
     * A placa dentro do app desenha a textura com um `<image>` de SVG recortado
     * pelo contorno. Aqui nao ha SVG: o fundo e pintado a mao num Canvas, entao
     * a mesma ideia vira bitmap recortado pelo mesmo Path do octogono.
     *
     * Os arquivos sao OUTROS, e de proposito. O widget e uma faixa larga de no
     * maximo 1400x600, e as pedras do app tem 1024x1536 — levar as grandes para
     * ca custaria 2,3MB no APK para desenhar numa area tres vezes menor. As de
     * `res/drawable` sao 512x768, 642KB no total.
     */
    private static int desenhoDaPedra(String patamar) {
        if (patamar == null) return 0;
        switch (patamar.trim().toUpperCase()) {
            case "SSS": return R.drawable.plate_sss;
            case "SS": return R.drawable.plate_ss;
            case "S": return R.drawable.plate_s;
            case "A": return R.drawable.plate_a;
            case "B": return R.drawable.plate_b;
            case "C": return R.drawable.plate_c;
            case "D": return R.drawable.plate_d;
            case "E": return R.drawable.plate_e;
            default: return 0;
        }
    }

    static Bitmap fundo(Resources recursos, Acabamento metal, String patamar, int largura, int altura) {
        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);

        /*
         * A MESMA PECA DO CARTAO DO APP (CycleSummaryCard, 11/10/2026).
         *
         * O Afonso pediu o widget "igual o maximo possivel" ao cartao da Ativos e
         * da Arenas. Cada camada daqui e uma camada de la, na mesma ordem:
         *   1. a moldura: o octogono inteiro no gradiente de 118 graus do
         *      acabamento do patamar (escuro, claro, meio, claro, escuro, claro);
         *   2. a face, 3dp para dentro: base escura com o tom do patamar, a
         *      diagonal, o halo, a pedra e o veu preto de 42%;
         *   3. o fio de 1dp no claro do metal, a 5dp da borda — so nos lados
         *      retos, porque no cartao o recorte come a borda nos chanfros.
         * O corte do canto e o do clip-path do cartao: 5% da largura, 20% da
         * altura. A escada de molduras e as tres linhas escuras concentricas
         * sairam: o cartao nao tem, e o widget era o unico que mostrava.
         */
        final float dp = recursos != null ? recursos.getDisplayMetrics().density : 3f;

        // 1. A moldura.
        Path borda = octogono(0f, 0f, largura, altura, largura * 0.05f, altura * 0.20f);
        Paint moldura = new Paint(Paint.ANTI_ALIAS_FLAG);
        moldura.setShader(gradienteCss(118, 0f, 0f, largura, altura,
            new int[] { metal.dark, metal.pale, metal.mid, metal.pale, metal.dark, metal.pale },
            new float[] { 0f, 0.12f, 0.40f, 0.52f, 0.84f, 1f }));
        tela.drawPath(borda, moldura);

        // 2. A face.
        final float m3 = 3f * dp;
        final float fx0 = m3, fy0 = m3, fx1 = largura - m3, fy1 = altura - m3;
        final float fw = fx1 - fx0, fh = fy1 - fy0;
        Path face = octogono(fx0, fy0, fx1, fy1, fw * 0.05f, fh * 0.20f);
        tela.save();
        tela.clipPath(face);

        // A base: radial a partir de 45% x 10%, do tom do patamar ao quase-preto.
        Paint base = new Paint(Paint.ANTI_ALIAS_FLAG);
        float bx = fx0 + fw * 0.45f, by = fy0 + fh * 0.10f;
        base.setShader(new RadialGradient(bx, by, cantoMaisLonge(bx, by, fx0, fy0, fx1, fy1),
            new int[] { metal.face, 0xFF090A0C, 0xFF111315 }, new float[] { 0f, 0.66f, 1f }, Shader.TileMode.CLAMP));
        tela.drawPaint(base);

        Paint diagonal = new Paint(Paint.ANTI_ALIAS_FLAG);
        diagonal.setShader(gradienteCss(135, fx0, fy0, fw, fh,
            new int[] { comAlfa(metal.mid, 0x0E), comAlfa(metal.mid, 0x00), comAlfa(metal.mid, 0x07), comAlfa(metal.mid, 0x00) },
            new float[] { 0f, 0.35f, 0.72f, 1f }));
        tela.drawPaint(diagonal);

        Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
        float hx = fx0 + fw * 0.45f, hy = fy0;
        halo.setShader(new RadialGradient(hx, hy, cantoMaisLonge(hx, hy, fx0, fy0, fx1, fy1),
            new int[] { comAlfa(metal.mid, 0x2A), comAlfa(metal.mid, 0x00) }, new float[] { 0f, 0.44f }, Shader.TileMode.CLAMP));
        tela.drawPaint(halo);

        int pedra = desenhoDaPedra(patamar);
        if (pedra != 0 && recursos != null) {
            Bitmap foto = BitmapFactory.decodeResource(recursos, pedra);
            if (foto != null) {
                float escala = Math.max(fw / foto.getWidth(), fh / foto.getHeight());
                Matrix encaixe = new Matrix();
                encaixe.setScale(escala, escala);
                encaixe.postTranslate(fx0 + (fw - foto.getWidth() * escala) / 2f, fy0 + (fh - foto.getHeight() * escala) / 2f);
                Paint tinta = new Paint(Paint.ANTI_ALIAS_FLAG);
                tinta.setFilterBitmap(true);
                tela.drawBitmap(foto, encaixe, tinta);
                foto.recycle();
                Paint veu = new Paint(Paint.ANTI_ALIAS_FLAG);
                veu.setColor(0x6B06080C);
                tela.drawPaint(veu);
            }
        }
        tela.restore();

        // 3. O fio interno.
        final float m5 = 5f * dp;
        final float iw = largura - 2f * m5, ih = altura - 2f * m5;
        if (iw > 0f && ih > 0f) {
            tela.save();
            tela.clipPath(octogono(m5, m5, largura - m5, altura - m5, iw * 0.05f, ih * 0.20f));
            Paint fio = new Paint(Paint.ANTI_ALIAS_FLAG);
            fio.setStyle(Paint.Style.STROKE);
            fio.setStrokeWidth(dp);
            fio.setColor(comAlfa(metal.pale, 0x38));
            float meio = dp / 2f;
            tela.drawRect(m5 + meio, m5 + meio, largura - m5 - meio, altura - m5 - meio, fio);
            tela.restore();
        }

        return bitmap;
    }

    /** Um linear-gradient(<graus>) do CSS, na caixa dada, como o navegador desenha. */
    private static LinearGradient gradienteCss(float graus, float x, float y, float w, float h, int[] cores, float[] paradas) {
        double a = Math.toRadians(graus);
        float dx = (float) Math.sin(a), dy = (float) -Math.cos(a);
        float metade = (Math.abs(w * dx) + Math.abs(h * dy)) / 2f;
        float cx = x + w / 2f, cy = y + h / 2f;
        return new LinearGradient(cx - dx * metade, cy - dy * metade, cx + dx * metade, cy + dy * metade, cores, paradas, Shader.TileMode.CLAMP);
    }

    /** O raio "farthest-corner" do radial-gradient do CSS. */
    private static float cantoMaisLonge(float cx, float cy, float x0, float y0, float x1, float y1) {
        float dx = Math.max(Math.abs(cx - x0), Math.abs(x1 - cx));
        float dy = Math.max(Math.abs(cy - y0), Math.abs(y1 - cy));
        return Math.max(1f, (float) Math.sqrt(dx * dx + dy * dy));
    }

    /**
     * A LINHA ORNAMENTAL que ladeia o titulo.
     *
     * Ela nasce transparente na ponta de fora e chega ao metal encostando no
     * texto, entao as duas juntas leem como um filete que emoldura o nome em vez
     * de dois tracos soltos. `aDireita` inverte o sentido para o par ficar
     * simetrico.
     *
     * A LARGURA E FALSA de proposito: quem decide o comprimento e o
     * `layout_weight` no XML, que da a cada linha o que sobrar depois do titulo.
     * O bitmap so precisa do gradiente; o `fitXY` estica. E por isso que o nome
     * do ciclo pode crescer que as linhas encolhem sozinhas, sem ninguem medir.
     */
    static Bitmap linhaDoTitulo(String patamar, boolean aDireita) {
        // A mesma do cartao do app: transparente na ponta de fora, o claro do
        // metal a 72% (b8) encostando no titulo.
        final int largura = 200;
        final int altura = 3;
        int claro = acabamentoDe(patamar).pale;

        Bitmap bitmap = Bitmap.createBitmap(largura, altura, Bitmap.Config.ARGB_8888);
        Canvas tela = new Canvas(bitmap);
        Paint pincel = new Paint(Paint.ANTI_ALIAS_FLAG);
        pincel.setShader(new LinearGradient(
            0f, 0f, largura, 0f,
            aDireita
                ? new int[] { comAlfa(claro, 0xB8), comAlfa(claro, 0x00) }
                : new int[] { comAlfa(claro, 0x00), comAlfa(claro, 0xB8) },
            null,
            Shader.TileMode.CLAMP
        ));
        tela.drawRect(0f, 0f, largura, altura, pincel);
        return bitmap;
    }

    /**
     * O corpo do titulo encolhe quando o nome e longo.
     *
     * `autoSizeTextType` so vale da API 26 para cima e o minSdk aqui e 24, entao
     * a conta sai daqui e chega por setTextViewTextSize, que funciona em todas.
     * Os degraus sao largos de proposito: um tamanho por caractere faria a ficha
     * mudar de cara a cada renomeacao.
     */
    static float tamanhoDoTitulo(String titulo) {
        // O cartao do app usa 10px fixo, e o nome longo corta com reticencias.
        // O widget segue igual (11/10/2026) — antes crescia ate 13.
        return 10f;
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
    /** Ouro e prata das barras: escuro, meio, claro. Os mesmos de constants/barrasDoCiclo.ts. */
    static final int[] BARRA_OURO = { Color.parseColor("#a8822a"), Color.parseColor("#f0c95c"), Color.parseColor("#fff4c4") };
    static final int[] BARRA_PRATA = { Color.parseColor("#7f95a3"), Color.parseColor("#d5e2ea"), Color.parseColor("#ffffff") };
    /** O reflexo branco no topo: 0,55 de opacidade, como REFLEXO_DA_BARRA no app. */
    static final int REFLEXO_DA_BARRA_ALFA = 0x8C;

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
            /*
             * AS BARRAS NAO SEGUEM MAIS O PATAMAR: OURO E PRATA, SEMPRE.
             *
             * A de acoes usava o metal do degrau. Fazia sentido enquanto o fundo
             * era um gradiente escuro — a barra era o unico lugar onde a cor do
             * patamar aparecia. Agora o fundo E a pedra do patamar, e as duas
             * disputam: numa pedra clara a barra da mesma familia some dentro
             * dela, e era isso que ficava ilegivel.
             *
             * Quem diz o degrau passou a ser a pedra. A barra volta a ter um
             * trabalho so — mostrar quanto andou — e para isso precisa CONTRASTAR
             * com o fundo, nao combinar com ele.
             */
            /*
             * A MESMA RECEITA DO APP (constants/barrasDoCiclo.ts, 11/10/2026):
             * ouro no progresso, prata no tempo, o gradiente so no pedaco
             * PREENCHIDO — a ponta e sempre a parte mais clara — e um reflexo
             * branco na metade de cima. tests/barras-do-ciclo confere que as
             * cores daqui e de la nao se separam.
             */
            int[] cores = forte ? BARRA_OURO : BARRA_PRATA;
            RectF preenchido = new RectF(0f, 0f, cheio, altura);
            Paint preenchimento = new Paint(Paint.ANTI_ALIAS_FLAG);
            preenchimento.setShader(new LinearGradient(
                0f, 0f, cheio, 0f,
                cores,
                new float[] { 0f, 0.55f, 1f },
                Shader.TileMode.CLAMP
            ));
            tela.drawRoundRect(preenchido, raio, raio, preenchimento);

            Paint reflexo = new Paint(Paint.ANTI_ALIAS_FLAG);
            reflexo.setShader(new LinearGradient(
                0f, 0f, 0f, altura * 0.55f,
                comAlfa(0xFFFFFF, REFLEXO_DA_BARRA_ALFA), comAlfa(0xFFFFFF, 0x00),
                Shader.TileMode.CLAMP
            ));
            tela.drawRoundRect(preenchido, raio, raio, reflexo);
        }

        return bitmap;
    }
}
