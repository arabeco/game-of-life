import { createAnonClient } from './_smoke.supabase.mjs';

try {
  const client = createAnonClient();
  const result = await client
    .from('information_schema.columns')
    .select('column_name,data_type,is_nullable,column_default')
    .eq('table_schema', 'public')
    .eq('table_name', 'user_chests')
    .order('ordinal_position', { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log(JSON.stringify({
    success: true,
    columns: result.data || [],
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
