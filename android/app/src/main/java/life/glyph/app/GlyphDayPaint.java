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
 * check verde. Marco e o losango dourado.
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
        final int corA;
        final int corB;

        Bloco(String nome, String arena, String icone, int inicio, int duracao, boolean feita, boolean marco, int corA, int corB) {
            this.nome = nome;
            this.arena = arena;
            this.icone = icone;
            this.inicio = inicio;
            this.duracao = duracao;
            this.feita = feita;
            this.marco = marco;
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
        Paint fundo = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo.setColor(Color.parseColor("#0b0e13"));
        canvas.drawRect(0, 0, largura, altura, fundo);

        TextPaint titulo = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        titulo.setColor(OURO_CLARO);
        titulo.setTextSize(Math.min(10 * d, altura * .12f));
        titulo.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        titulo.setLetterSpacing(.14f);
        canvas.drawText("PLANNER DE HOJE", 7 * d, Math.max(12 * d, titulo.getTextSize() + 3 * d), titulo);

        ArrayList<Bloco> agenda = new ArrayList<>(blocos);
        Collections.sort(agenda, Comparator.comparingInt(bloco -> bloco.inicio));
        if (agenda.isEmpty()) {
            TextPaint vazio = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            vazio.setColor(TEXTO_SUAVE);
            vazio.setTextSize(11 * d);
            vazio.setTypeface(Typeface.create(Typeface.SERIF, Typeface.ITALIC));
            vazio.setTextAlign(Paint.Align.CENTER);
            canvas.drawText("Nada no planner hoje.", largura / 2f, altura / 2f, vazio);
            return bitmap;
        }

        float topo = Math.max(18 * d, titulo.getTextSize() + 8 * d);
        float margem = 5 * d;
        int quantidade = Math.min(4, agenda.size());
        float espaco = Math.max(3 * d, altura * .025f);
        float linhaAltura = Math.max(28 * d, Math.min(45 * d, (altura - topo - margem - espaco * (quantidade - 1)) / quantidade));
        for (int index = 0; index < quantidade; index++) {
            Bloco bloco = agenda.get(index);
            float y = topo + index * (linhaAltura + espaco);
            desenharAgenda(canvas, d, new RectF(margem, y, largura - margem, Math.min(altura - margem, y + linhaAltura)), bloco, diaComecaEm, agora);
        }
        if (agenda.size() > quantidade) {
            TextPaint mais = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            mais.setColor(Color.argb(0xb8, 211, 198, 168));
            mais.setTextSize(8 * d);
            mais.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            mais.setTextAlign(Paint.Align.RIGHT);
            canvas.drawText("+" + (agenda.size() - quantidade) + " ações", largura - 7 * d, altura - 4 * d, mais);
        }
        return bitmap;
    }

    private static void desenharAgenda(Canvas canvas, float d, RectF caixa, Bloco bloco, int diaComecaEm, int agora) {
        Paint fundo = new Paint(Paint.ANTI_ALIAS_FLAG);
        fundo.setColor(bloco.feita ? Color.argb(0xd8, 19, 28, 29) : Color.argb(0xf0, 20, 24, 32));
        canvas.drawRoundRect(caixa, 7 * d, 7 * d, fundo);
        Paint faixa = new Paint(Paint.ANTI_ALIAS_FLAG);
        faixa.setShader(new LinearGradient(caixa.left, caixa.top, caixa.left, caixa.bottom, bloco.corA, bloco.corB, Shader.TileMode.CLAMP));
        canvas.drawRoundRect(new RectF(caixa.left, caixa.top, caixa.left + 4 * d, caixa.bottom), 4 * d, 4 * d, faixa);

        int relogioMin = (diaComecaEm + bloco.inicio) % MINUTOS_DO_DIA;
        String horario = String.format("%02d:%02d", relogioMin / 60, relogioMin % 60);
        TextPaint hora = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        hora.setColor(bloco.inicio <= agora && agora < bloco.inicio + bloco.duracao ? OURO_CLARO : Color.parseColor("#b8bdc7"));
        hora.setTextSize(Math.min(10 * d, caixa.height() * .28f));
        hora.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        canvas.drawText(horario, caixa.left + 9 * d, caixa.centerY() + hora.getTextSize() * .34f, hora);

        float emojiX = caixa.left + 46 * d;
        Paint selo = new Paint(Paint.ANTI_ALIAS_FLAG);
        selo.setColor(Color.argb(0x2e, 255, 255, 255));
        canvas.drawCircle(emojiX, caixa.centerY(), Math.min(12 * d, caixa.height() * .34f), selo);
        TextPaint emoji = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        emoji.setTextSize(Math.min(17 * d, caixa.height() * .55f));
        canvas.drawText(bloco.icone, emojiX - emoji.measureText(bloco.icone) / 2f, caixa.centerY() + emoji.getTextSize() * .34f, emoji);

        float direita = caixa.right - 8 * d;
        if (bloco.feita) {
            TextPaint check = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            check.setColor(Color.parseColor("#6ee7b7"));
            check.setTextSize(Math.min(15 * d, caixa.height() * .46f));
            check.setTypeface(Typeface.DEFAULT_BOLD);
            canvas.drawText("✓", direita - check.measureText("✓"), caixa.centerY() + check.getTextSize() * .34f, check);
            direita -= check.measureText("✓") + 7 * d;
        }
        TextPaint nome = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        nome.setColor(Color.WHITE);
        nome.setTextSize(Math.min(12 * d, caixa.height() * .32f));
        nome.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        CharSequence texto = TextUtils.ellipsize(bloco.nome, nome, Math.max(0, direita - (emojiX + 17 * d)), TextUtils.TruncateAt.END);
        canvas.drawText(texto, 0, texto.length(), emojiX + 17 * d, caixa.centerY() - 2 * d, nome);
        TextPaint detalhe = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        detalhe.setColor(Color.argb(0xb8, 211, 198, 168));
        detalhe.setTextSize(Math.min(8 * d, caixa.height() * .22f));
        detalhe.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        CharSequence contexto = TextUtils.ellipsize(bloco.arena + " · " + bloco.duracao + " min" + (bloco.marco ? " · MARCO" : ""), detalhe, Math.max(0, direita - (emojiX + 17 * d)), TextUtils.TruncateAt.END);
        canvas.drawText(contexto, 0, contexto.length(), emojiX + 17 * d, caixa.centerY() + detalhe.getTextSize() + 2 * d, detalhe);
    }

    private static void tarefa(Canvas canvas, float d, RectF caixa, Bloco bloco) {
        float raio = Math.min(16 * d, caixa.height() / 2f);
        RectF dentro = new RectF(caixa.left + 2 * d, caixa.top + 2 * d, caixa.right - 2 * d, caixa.bottom - 2 * d);
        if (dentro.height() <= 0) dentro = new RectF(caixa);
        float raioDentro = Math.min(14 * d, dentro.height() / 2f);

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
            borda.setColor(Color.parseColor("#4b5563"));
            borda.setPathEffect(new DashPathEffect(new float[] { 4 * d, 3 * d }, 0));
        }
        RectF bordaCaixa = new RectF(caixa.left + d, caixa.top + d, caixa.right - d, caixa.bottom - d);
        canvas.drawRoundRect(bordaCaixa, raio, raio, borda);

        if (caixa.height() < 12 * d) return;
        canvas.save();
        canvas.clipRect(dentro);
        float meio = caixa.centerY();
        TextPaint icone = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        icone.setTextSize(Math.min(16 * d, caixa.height() * 0.62f));
        float xTexto = dentro.left + 6 * d;
        Paint seloDoEmoji = new Paint(Paint.ANTI_ALIAS_FLAG);
        seloDoEmoji.setColor(Color.argb(0x35, 255, 255, 255));
        float seloRaio = Math.min(11 * d, caixa.height() * 0.34f);
        canvas.drawCircle(xTexto + seloRaio, meio, seloRaio, seloDoEmoji);
        canvas.drawText(bloco.icone, xTexto + seloRaio - icone.measureText(bloco.icone) / 2f, meio + icone.getTextSize() * 0.35f, icone);
        xTexto += seloRaio * 2 + 6 * d;

        float direita = dentro.right - 6 * d;
        if (bloco.feita && caixa.height() >= 16 * d) {
            float r = Math.min(9 * d, caixa.height() / 2f - 2 * d);
            float cx = dentro.right - 4 * d - r;
            Paint circulo = new Paint(Paint.ANTI_ALIAS_FLAG);
            circulo.setColor(Color.argb(0x47, 0, 0, 0));
            canvas.drawCircle(cx, meio, r, circulo);
            TextPaint check = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            check.setColor(Color.parseColor("#6ee7b7"));
            check.setTextSize(r * 1.3f);
            check.setTypeface(Typeface.DEFAULT_BOLD);
            check.setTextAlign(Paint.Align.CENTER);
            canvas.drawText("✓", cx, meio + check.getTextSize() * 0.36f, check);
            direita = cx - r - 4 * d;
        }

        TextPaint nome = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        nome.setColor(Color.WHITE);
        // O nome e conteudo do planner, nao legenda da cor. Mantem pelo menos
        // 11sp quando a altura deixa, para o widget continuar sendo lido de
        // relance em vez de virar uma grade de faixas coloridas.
        nome.setTextSize(Math.min(13 * d, Math.max(11 * d, caixa.height() * 0.5f)));
        nome.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        nome.setShadowLayer(3 * d, 0, d, Color.argb(0xd1, 2, 6, 23));
        CharSequence cabe = TextUtils.ellipsize(bloco.nome, nome, Math.max(0, direita - xTexto), TextUtils.TruncateAt.END);
        canvas.drawText(cabe, 0, cabe.length(), xTexto, meio + nome.getTextSize() * 0.35f, nome);
        canvas.restore();
    }

    private static void marco(Canvas canvas, float d, RectF caixa, Bloco bloco) {
        Path losango = new Path();
        losango.moveTo(caixa.centerX(), caixa.top);
        losango.lineTo(caixa.right, caixa.centerY());
        losango.lineTo(caixa.centerX(), caixa.bottom);
        losango.lineTo(caixa.left, caixa.centerY());
        losango.close();

        Paint ouro = new Paint(Paint.ANTI_ALIAS_FLAG);
        ouro.setShader(new LinearGradient(caixa.left, caixa.top, caixa.right, caixa.bottom,
                new int[] { Color.parseColor("#fbe7a6"), Color.parseColor("#d9b45a"), Color.parseColor("#a77d2c") },
                new float[] { 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
        ouro.setShadowLayer(6 * d, 0, 0, comAlfa(OURO, 0x99));
        canvas.drawPath(losango, ouro);
        if (bloco.feita) {
            Paint feita = new Paint(Paint.ANTI_ALIAS_FLAG);
            feita.setColor(Color.argb(0x45, 255, 255, 255));
            canvas.drawPath(losango, feita);
        }

        if (caixa.height() < 14 * d) return;
        TextPaint nome = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        nome.setColor(Color.parseColor("#241a07"));
        nome.setTextSize(Math.min(11 * d, caixa.height() * 0.4f));
        nome.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
        nome.setTextAlign(Paint.Align.CENTER);
        String texto = bloco.icone + " " + bloco.nome;
        CharSequence cabe = TextUtils.ellipsize(texto, nome, caixa.width() * 0.5f, TextUtils.TruncateAt.END);
        canvas.drawText(cabe, 0, cabe.length(), caixa.centerX(), caixa.centerY() + nome.getTextSize() * 0.35f, nome);
    }
}
