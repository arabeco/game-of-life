package life.glyph.app;

import java.util.Calendar;

/**
 * O DIA DO CICLO, CALCULADO NA HORA DE DESENHAR (19/10/2026).
 *
 * O widget mostrava o "Dia N/T" que o app mandou na ultima vez que foi aberto.
 * Sem abrir o app no domingo, o domingo continuava "Dia 13/14" — o sabado. O
 * widget se redesenha sozinho a cada meia hora, entao o dia sai daqui, das datas
 * do ciclo e do relogio, com a mesma regra de utils/dateUtils.ts
 * (getCycleTimingSummary): o primeiro dia e o dia 1, o dia de hoje ja conta, e o
 * dia vira as 4h (utils/operationalDay.js).
 *
 * Java puro, sem Android, para dar para conferir fora do aparelho.
 */
final class CicloDoWidget {
    static final int CORTE_DO_DIA = 4;

    private CicloDoWidget() {}

    /** {dia exibido, total de dias, porcentagem do tempo}; null se as datas nao servem ou o ciclo nao comecou. */
    static int[] tempo(String inicio, String fim, Calendar agora) {
        long[] a = data(inicio);
        long[] b = data(fim);
        if (a == null || b == null || agora == null) return null;
        Calendar hoje = (Calendar) agora.clone();
        hoje.add(Calendar.HOUR_OF_DAY, -CORTE_DO_DIA);
        long diaDeHoje = diaAbsoluto(hoje.get(Calendar.YEAR), hoje.get(Calendar.MONTH) + 1, hoje.get(Calendar.DAY_OF_MONTH));
        long diaDoInicio = diaAbsoluto(a[0], a[1], a[2]);
        long diaDoFim = diaAbsoluto(b[0], b[1], b[2]);
        int total = (int) Math.max(1, diaDoFim - diaDoInicio + 1);
        if (diaDeHoje < diaDoInicio) return null;
        int dia = (int) Math.max(1, Math.min(total, diaDeHoje - diaDoInicio + 1));
        int porcentagem = (int) Math.round(Math.min(100.0, dia * 100.0 / total));
        return new int[] { dia, total, porcentagem };
    }

    /** "Dia 7/14 (50%)" — o mesmo texto da linha Tempo do cartao do ciclo no app. */
    static String rotulo(int[] tempo) {
        return "Dia " + tempo[0] + "/" + tempo[1] + " (" + tempo[2] + "%)";
    }

    private static long[] data(String texto) {
        if (texto == null || !texto.matches("\\d{4}-\\d{2}-\\d{2}.*")) return null;
        return new long[] {
            Long.parseLong(texto.substring(0, 4)),
            Long.parseLong(texto.substring(5, 7)),
            Long.parseLong(texto.substring(8, 10)),
        };
    }

    /** Dias desde 1970-01-01 no calendario civil, sem fuso (algoritmo days_from_civil). */
    private static long diaAbsoluto(long ano, long mes, long dia) {
        ano -= mes <= 2 ? 1 : 0;
        long era = (ano >= 0 ? ano : ano - 399) / 400;
        long anoDaEra = ano - era * 400;
        long diaDoAno = (153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5 + dia - 1;
        long diaDaEra = anoDaEra * 365 + anoDaEra / 4 - anoDaEra / 100 + diaDoAno;
        return era * 146097 + diaDaEra - 719468;
    }
}
