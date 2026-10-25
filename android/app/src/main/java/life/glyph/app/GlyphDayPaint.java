package life.glyph.app;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * O PINCEL DO WIDGET DO DIA (13/10/2026).
 *
 * Duas telas desenhadas como imagem, igual ao widget do ciclo (GlyphWidgetPaint):
 *
 *   - RESUMO: quatro quadradinhos (feitas/planejadas, %, tempo, EXP), no estilo
 *     do cartao do Painel Diario — canto reto, filete dourado, numero em serifa
 *     com degrade de ouro. Numa fileira quando o widget e largo e baixo, em 2x2
 *     quando e mais alto.
 *
 *   - PLANNER: o planner do app, igualzinho, na escala do zoom 1 novo do app
 *     (0,35 px por minuto, utils/plannerZoom.ts). A escala e fixa: o tamanho do
 *     widget decide quantas horas aparecem. Quando nao cabe o dia, a janela
 *     comeca uma hora antes de agora. Horario vazio aparece vazio.
 *
 * Os blocos copiam o PlannerView: degrade da area, pelicula escura, borda
 * tracejada cinza no que falta e branca no que foi feito, icone e nome, e o
 * check verde. Desde 25/10, como o planner: Marco e um hexagono na cor da
 * arena, acao Livre e uma pilula (tracejada branca enquanto agendada) e quem
 * tem lembrete e ainda nao foi feito mostra o sininho no lugar do check.
 */
final class GlyphDayPaint {
    /** A mesma escala do zoom 1 do app (PLANNER_ZOOM_FACTORS[1], em dp por minuto). */
    static final float PX_POR_MINUTO = 0.35f;
    private static final int MINUTOS_DO_DIA = 24 * 60;

    private static final int OURO = Color.parseColor("#b89252");
    private static final int OURO_CLARO = Color.parseColor("#f1d595");
    private static final int TEXTO_SUAVE = Color.parseColor("#d3c6a8");

    static final class Bloco {
        final String nome;
        final String arena;
        final String icone;
        final int inicio;
        final int duracao;
        final boolean feita;
        final boolean marco;
        final boolean livre;
        final boolean lembrete;
        final int corA;
        final int corB;

        Bloco(String nome, String arena, String icone, int inicio, int duracao, boolean feita, boolean marco,
                boolean livre, boolean lembrete, int corA, int corB) {
            this.nome = nome;
            this.arena = arena;
            this.icone = icone;
            this.inicio = inicio;
            this.duracao = duracao;
            this.feita = feita;
            this.marco = marco;
            this.livre = livre;
            this.lembrete = lembrete;
            this.corA = corA;
            this.corB = corB;
        }
    }

    private GlyphDayPaint() {}

    private static int comAlfa(int cor, int alfa) {
        return Color.argb(alfa, Color.red(cor), Color.green(cor), Color.blue(cor));
    }

    // ------------------------------------------------------------------ RESUMO

    static Bitmap resumo(float d, int largura, int altura, int feitas, int planejadas, int tempoMin, int exp) {
        Bitmap bitmap = Bitmap.createBitmap(Math.max(1, largura), Math.max(1, altura), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        int porcento = planejadas > 0 ? Math.round(feitas * 100f / planejadas) : 0;
        String[] valores = { feitas + "/" + planejadas, porcento + "%", tempo(tempoMin), "+" + exp };
        String[] rotulos = { "FEITAS", "DO DIA", "TEMPO", "EXP" };

        boolean fileira = largura >= altura * 2.4f;
        int colunas = fileira ? 4 : 2;
        int linhas = fileira ? 1 : 2;
        float vao = 6 * d;
        float w = (largura - vao * (colunas - 1)) / colunas;
        float h = (altura - vao * (linhas - 1)) / linhas;

        for (int i = 0; i < 4; i++) {
            float x = (i % colunas) * (w + vao);
            float y = (i / colunas) * (h + vao);
            quadradinho(canvas, d, new RectF(x, y, x + w, y + h), valores[i], rotulos[i]);
        }
        return bitmap;
    }

    private static String tempo(int minutos) {
        if (minutos < 60) return minutos + "min";
        int horas = minutos / 60;
        int resto = minutos % 60;
        return resto == 0 ? horas + "h" : horas + "h" + (resto < 10 ? "0" : "") + resto;
    }

    private static void quadradinho(Canvas canvas, float d, RectF caixa, String valor, String rotulo) {
        Paint fundo = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo.setShader(new LinearGradient(caixa.left, caixa.top, caixa.right, caixa.bottom,
                new int[] { comAlfa(OURO, 0x11), Color.parseColor("#0d0e11"), Color.parseColor("#08090b") },
                new float[] { 0f, 0.58f, 1f }, Shader.TileMode.CLAMP));
        canvas.drawRect(caixa, fundo);

        Paint brilho = new Paint(Paint.ANTI_ALIAS_FLAG);
        float raio = Math.max(caixa.width(), caixa.height()) * 0.6f;
        brilho.setShader(new RadialGradient(caixa.centerX(), caixa.top, raio,
                new int[] { comAlfa(OURO, 0x29), comAlfa(OURO, 0) }, null, Shader.TileMode.CLAMP));
        canvas.drawRect(caixa, brilho);

        Paint borda = new Paint(Paint.ANTI_ALIAS_FLAG);
        borda.setStyle(Paint.Style.STROKE);
        borda.setStrokeWidth(Math.max(1f, d));
        borda.setColor(comAlfa(OURO, 0x47));
        canvas.drawRect(caixa.left + 0.5f * d, caixa.top + 0.5f * d, caixa.right - 0.5f * d, caixa.bottom - 0.5f * d, borda);

        TextPaint rotuloTinta = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        rotuloTinta.setColor(TEXTO_SUAVE);
        rotuloTinta.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        rotuloTinta.setTextSize(Math.min(9 * d, caixa.height() * 0.16f));
        rotuloTinta.setLetterSpacing(0.2f);
        rotuloTinta.setTextAlign(Paint.Align.CENTER);

        TextPaint numero = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        numero.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        float tamanho = Math.min(caixa.height() * 0.42f, caixa.width() * 0.3f);
        numero.setTextSize(tamanho);
        while (numero.measureText(valor) > caixa.width() * 0.86f && tamanho > 8 * d) {
            tamanho -= d;
            numero.setTextSize(tamanho);
        }
        numero.setTextAlign(Paint.Align.CENTER);
        float baseNumero = caixa.centerY() + tamanho * 0.22f;
        numero.setShader(new LinearGradient(0, baseNumero - tamanho, 0, baseNumero,
                new int[] { Color.parseColor("#fffdf6"), Color.parseColor("#e7dcc5"), Color.parseColor("#aa8748"), Color.parseColor("#f1eadb") },
                new float[] { 0f, 0.38f, 0.72f, 1f }, Shader.TileMode.CLAMP));
        numero.setShadowLayer(2 * d, 0, d, Color.parseColor("#dd000000"));
        canvas.drawText(valor, caixa.centerX(), baseNumero, numero);

        canvas.drawText(rotulo, caixa.centerX(), Math.min(caixa.bottom - 6 * d, baseNumero + rotuloTinta.getTextSize() * 1.9f), rotuloTinta);
    }

    // ------------------------------------------------------------------ PLANNER

    /**
     * @param agora minutos desde o comeco do dia do planner (04:00 = 0).
     * @param diaComecaEm minuto do relogio em que o dia comeca (240).
     */
    static Bitmap planner(float d, int largura, int altura, List<Bloco> blocos, int agora, int diaComecaEm) {
        Bitmap bitmap = Bitmap.createBitmap(Math.max(1, largura), Math.max(1, altura), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        float porMinuto = PX_POR_MINUTO * d;
        float calha = 34 * d;

        // A escala e fixa como no Planner. Quando nao cabe o dia inteiro, a
        // janela se concentra uma hora antes de agora, em vez de achatar os
        // blocos e perder a leitura das acoes curtas.
        float minutosVisiveis = altura / porMinuto;
        float inicio = Math.max(0, Math.min(agora - 60, MINUTOS_DO_DIA - minutosVisiveis));
        if (minutosVisiveis >= MINUTOS_DO_DIA) inicio = 0;

        // As horas e as linhas.
        Paint linha = new Paint(Paint.ANTI_ALIAS_FLAG);
        linha.setColor(Color.argb(0x18, 255, 255, 255));
        linha.setStrokeWidth(Math.max(1f, d * 0.75f));
        TextPaint hora = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        hora.setColor(Color.argb(0x73, 255, 255, 255));
        hora.setTextSize(9 * d);
        hora.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        for (int m = 0; m <= MINUTOS_DO_DIA; m += 60) {
            float y = (m - inicio) * porMinuto;
            if (y < -1 || y > altura + 1) continue;
            canvas.drawLine(calha, y, largura, y, linha);
            int relogio = ((diaComecaEm + m) / 60) % 24;
            String rotulo = (relogio < 10 ? "0" : "") + relogio + ":00";
            float base = Math.max(hora.getTextSize(), Math.min(altura - 2 * d, y + hora.getTextSize() * 0.35f));
            canvas.drawText(rotulo, 2 * d, base, hora);
        }

        if (blocos.isEmpty()) {
            TextPaint vazio = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            vazio.setColor(TEXTO_SUAVE);
            vazio.setTextSize(11 * d);
            vazio.setTypeface(Typeface.create(Typeface.SERIF, Typeface.ITALIC));
            vazio.setTextAlign(Paint.Align.CENTER);
            canvas.drawText("Nada no planner hoje.", calha + (largura - calha) / 2f, altura / 2f, vazio);
        }

        float x0 = calha + 4 * d;
        float x1 = largura - 2 * d;
        for (Bloco bloco : blocos) {
            float topo = (bloco.inicio - inicio) * porMinuto;
            if (bloco.marco) {
                // Com nome e icone dentro, o marco usa o mesmo piso das tarefas.
                float alto = Math.max(34 * porMinuto, bloco.duracao * porMinuto);
                if (topo + alto < 0 || topo > altura) continue;
                hexagono(canvas, d, new RectF(x0, topo, x1, topo + alto), bloco);
            } else {
                // A faixa continua proporcional depois de 34 minutos. O piso
                // so garante espaço físico para emoji e nome em ações curtas;
                // sem ele 15 min viravam só uma linha colorida no widget.
                float alto = Math.max(34 * porMinuto, bloco.duracao * porMinuto);
                if (topo + alto < 0 || topo > altura) continue;
                tarefa(canvas, d, new RectF(x0, topo, x1, topo + alto), bloco);
            }
        }

        // A linha de agora.
        float yAgora = (agora - inicio) * porMinuto;
        if (yAgora >= 0 && yAgora <= altura) {
            Paint agoraTinta = new Paint(Paint.ANTI_ALIAS_FLAG);
            agoraTinta.setColor(OURO_CLARO);
            agoraTinta.setStrokeWidth(1.5f * d);
            canvas.drawLine(calha, yAgora, largura, yAgora, agoraTinta);
            canvas.drawCircle(calha, yAgora, 3 * d, agoraTinta);
        }
        return bitmap;
    }

    private static void tarefa(Canvas canvas, float d, RectF caixa, Bloco bloco) {
        // rounded-xl do planner (12/10 dp); a acao Livre e pilula inteira.
        float raio = bloco.livre ? caixa.height() / 2f : Math.min(12 * d, caixa.height() / 2f);
        RectF dentro = new RectF(caixa.left + 2 * d, caixa.top + 2 * d, caixa.right - 2 * d, caixa.bottom - 2 * d);
        if (dentro.height() <= 0) dentro = new RectF(caixa);
        float raioDentro = bloco.livre ? dentro.height() / 2f : Math.min(10 * d, dentro.height() / 2f);

        Paint cor = new Paint(Paint.ANTI_ALIAS_FLAG);
        cor.setShader(new LinearGradient(dentro.left, dentro.top, dentro.right, dentro.bottom, bloco.corA, bloco.corB, Shader.TileMode.CLAMP));
        canvas.drawRoundRect(dentro, raioDentro, raioDentro, cor);

        Paint pelicula = new Paint(Paint.ANTI_ALIAS_FLAG);
        pelicula.setShader(new LinearGradient(dentro.left, dentro.top, dentro.right, dentro.bottom,
                new int[] { Color.argb(0x1a, 2, 6, 23), Color.argb(0x47, 2, 6, 23) }, new float[] { 0f, 0.74f }, Shader.TileMode.CLAMP));
        canvas.drawRoundRect(dentro, raioDentro, raioDentro, pelicula);

        if (bloco.feita) {
            Paint feita = new Paint(Paint.ANTI_ALIAS_FLAG);
            feita.setShader(new LinearGradient(dentro.left, dentro.top, dentro.right, dentro.bottom,
                    new int[] { Color.argb(0x2e, 255, 255, 255), Color.argb(0x0d, 255, 255, 255), Color.argb(0x29, 0, 0, 0) },
                    new float[] { 0f, 0.62f, 1f }, Shader.TileMode.CLAMP));
            canvas.drawRoundRect(dentro, raioDentro, raioDentro, feita);
        }

        Paint borda = new Paint(Paint.ANTI_ALIAS_FLAG);
        borda.setStyle(Paint.Style.STROKE);
        borda.setStrokeWidth(2 * d);
        if (bloco.feita) {
            borda.setColor(Color.argb(0x40, 255, 255, 255));
        } else {
            // Livre agendada: tracejado branco; as outras: o cinza de sempre.
            borda.setColor(bloco.livre ? Color.argb(0x5c, 255, 255, 255) : Color.argb(0xcc, 0x6b, 0x72, 0x80));
            borda.setPathEffect(new DashPathEffect(new float[] { 4 * d, 3 * d }, 0));
        }
        RectF bordaCaixa = new RectF(caixa.left + d, caixa.top + d, caixa.right - d, caixa.bottom - d);
        canvas.drawRoundRect(bordaCaixa, raio, raio, borda);

        conteudo(canvas, d, caixa, dentro, bloco);
    }

    /** Icone, nome e, na direita, o check (feita) ou o sininho (lembrete). */
    private static void conteudo(Canvas canvas, float d, RectF caixa, RectF dentro, Bloco bloco) {
        // O piso da timeline já dá ~12dp. Nessa altura ainda cabem emoji e
        // texto pequeno; o antigo corte em 12dp fazia sumirem justamente as
        // ações abaixo de meia hora.
        if (caixa.height() < 9 * d) return;
        canvas.save();
        canvas.clipRect(dentro);
        float meio = caixa.centerY();
        TextPaint icone = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        icone.setTextSize(Math.min(15 * d, Math.max(9 * d, caixa.height() * 0.72f)));
        float xTexto = dentro.left + 6 * d;
        Paint seloDoEmoji = new Paint(Paint.ANTI_ALIAS_FLAG);
        seloDoEmoji.setColor(Color.argb(0x35, 255, 255, 255));
        float seloRaio = Math.min(11 * d, caixa.height() * 0.34f);
        canvas.drawCircle(xTexto + seloRaio, meio, seloRaio, seloDoEmoji);
        canvas.drawText(bloco.icone, xTexto + seloRaio - icone.measureText(bloco.icone) / 2f, meio + icone.getTextSize() * 0.35f, icone);
        xTexto += seloRaio * 2 + 6 * d;

        float direita = dentro.right - 6 * d;
        boolean comSino = !bloco.feita && bloco.lembrete;
        if ((bloco.feita || comSino) && caixa.height() >= 16 * d) {
            float r = Math.min(9 * d, caixa.height() / 2f - 2 * d);
            float cx = dentro.right - 4 * d - r;
            Paint circulo = new Paint(Paint.ANTI_ALIAS_FLAG);
            circulo.setColor(Color.argb(0x47, 0, 0, 0));
            canvas.drawCircle(cx, meio, r, circulo);
            if (bloco.feita) {
                TextPaint check = new TextPaint(Paint.ANTI_ALIAS_FLAG);
                check.setColor(Color.parseColor("#6ee7b7"));
                check.setTextSize(r * 1.3f);
                check.setTypeface(Typeface.DEFAULT_BOLD);
                check.setTextAlign(Paint.Align.CENTER);
                canvas.drawText("✓", cx, meio + check.getTextSize() * 0.36f, check);
            } else {
                sininho(canvas, d, cx, meio, r);
            }
            direita = cx - r - 4 * d;
        }

        TextPaint nome = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        nome.setColor(Color.WHITE);
        // O nome e conteudo do planner, nao legenda da cor. Mantem pelo menos
        // 11sp quando a altura deixa, para o widget continuar sendo lido de
        // relance em vez de virar uma grade de faixas coloridas.
        nome.setTextSize(Math.min(13 * d, Math.max(9 * d, caixa.height() * 0.64f)));
        nome.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        nome.setShadowLayer(3 * d, 0, d, Color.argb(0xd1, 2, 6, 23));
        CharSequence cabe = TextUtils.ellipsize(bloco.nome, nome, Math.max(0, direita - xTexto), TextUtils.TruncateAt.END);
        canvas.drawText(cabe, 0, cabe.length(), xTexto, meio + nome.getTextSize() * 0.35f, nome);
        canvas.restore();
    }

    /** O sininho do lembrete (o Bell do lucide, em ambar claro), dentro do circulo de raio r. */
    private static void sininho(Canvas canvas, float d, float cx, float cy, float r) {
        float s = r * 0.62f;
        Paint traco = new Paint(Paint.ANTI_ALIAS_FLAG);
        traco.setStyle(Paint.Style.STROKE);
        traco.setStrokeWidth(Math.max(1f, 1.3f * d));
        traco.setStrokeCap(Paint.Cap.ROUND);
        traco.setStrokeJoin(Paint.Join.ROUND);
        traco.setColor(Color.parseColor("#fef3c7"));
        Path sino = new Path();
        sino.moveTo(cx - s, cy + s * 0.45f);
        sino.lineTo(cx - s * 0.72f, cy + s * 0.1f);
        sino.lineTo(cx - s * 0.72f, cy - s * 0.25f);
        sino.cubicTo(cx - s * 0.72f, cy - s * 0.95f, cx + s * 0.72f, cy - s * 0.95f, cx + s * 0.72f, cy - s * 0.25f);
        sino.lineTo(cx + s * 0.72f, cy + s * 0.1f);
        sino.lineTo(cx + s, cy + s * 0.45f);
        sino.close();
        canvas.drawPath(sino, traco);
        canvas.drawLine(cx - s * 0.28f, cy + s * 0.8f, cx + s * 0.28f, cy + s * 0.8f, traco);
    }

    /**
     * Marco: o hexagono do PlannerView (cantos cortados em 5,5% da largura),
     * na cor da arena, com a mesma pelicula, icone, nome e check/sininho.
     */
    private static void hexagono(Canvas canvas, float d, RectF caixa, Bloco bloco) {
        float corte = Math.min(caixa.width() * 0.055f, caixa.height() / 2f);
        Path forma = new Path();
        forma.moveTo(caixa.left + corte, caixa.top);
        forma.lineTo(caixa.right - corte, caixa.top);
        forma.lineTo(caixa.right, caixa.centerY());
        forma.lineTo(caixa.right - corte, caixa.bottom);
        forma.lineTo(caixa.left + corte, caixa.bottom);
        forma.lineTo(caixa.left, caixa.centerY());
        forma.close();

        Paint cor = new Paint(Paint.ANTI_ALIAS_FLAG);
        cor.setShader(new LinearGradient(caixa.left, caixa.top, caixa.right, caixa.bottom, bloco.corA, bloco.corB, Shader.TileMode.CLAMP));
        cor.setShadowLayer(5 * d, 0, 0, Color.argb(0x47, 0, 0, 0));
        canvas.drawPath(forma, cor);

        Paint pelicula = new Paint(Paint.ANTI_ALIAS_FLAG);
        pelicula.setShader(new LinearGradient(caixa.left, caixa.top, caixa.right, caixa.bottom,
                new int[] { Color.argb(0x1a, 255, 255, 255), Color.argb(0x1f, 10, 14, 23), Color.argb(0x38, 0, 0, 0) },
                new float[] { 0f, 0.48f, 1f }, Shader.TileMode.CLAMP));
        canvas.drawPath(forma, pelicula);

        if (bloco.feita) {
            Paint feita = new Paint(Paint.ANTI_ALIAS_FLAG);
            feita.setShader(new LinearGradient(caixa.left, caixa.top, caixa.right, caixa.bottom,
                    new int[] { Color.argb(0x40, 255, 255, 255), Color.argb(0x0a, 255, 255, 255), Color.argb(0x2e, 8, 12, 20) },
                    new float[] { 0f, 0.58f, 1f }, Shader.TileMode.CLAMP));
            canvas.drawPath(forma, feita);
        }

        RectF dentro = new RectF(caixa.left + corte, caixa.top + 2 * d, caixa.right - corte, caixa.bottom - 2 * d);
        if (dentro.height() <= 0) dentro = new RectF(caixa);
        conteudo(canvas, d, caixa, dentro, bloco);
    }
}
