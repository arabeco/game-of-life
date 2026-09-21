/**
 * O banco de cards mudou de endereco, e nao de dono.
 *
 * Ele agora mora em supabase/functions/_shared/ porque o card do dia passou a
 * nascer no cron, dentro da Edge Function — e o Deno so alcanca o que esta
 * debaixo de supabase/functions/. O app continua importando daqui, pelo mesmo
 * caminho de sempre, para que nenhuma tela precise saber disso.
 *
 * Mesmo padrao de utils/oracleVoice.ts, que le oracle-host-voice.ts do mesmo
 * lugar: um texto so, dois consumidores, zero copia para desencontrar.
 */
export {
  ORACLE_CARD_LIBRARY,
  pickOracleCard,
  getOracleCardStockSize,
} from '../supabase/functions/_shared/oracle-card-library.ts';
