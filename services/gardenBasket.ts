import { supabase } from '../supabaseClient';

export interface GardenBasketDelivery { id: string; created_at: string; score: number }
export interface GardenBasketReceipt { awarded: boolean; fragments: number; chest: 'Comum' | null; balance: number }
export const GARDEN_BASKET_CHANGED = 'glyph:garden-basket-changed';

export async function loadGardenBasket(userId: string): Promise<GardenBasketDelivery[]> {
  const { data, error } = await supabase.from('garden_basket_deliveries')
    .select('id,created_at,score').eq('user_id', userId).is('claimed_at', null).order('created_at').limit(2);
  if (error) throw error;
  return data || [];
}
