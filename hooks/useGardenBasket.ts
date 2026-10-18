import { useEffect, useState } from 'react';
import { GARDEN_BASKET_CHANGED, loadGardenBasket, type GardenBasketDelivery } from '../services/gardenBasket';

/** A missing migration never blocks opening or saving a garden. No polling. */
export function useGardenBasket(userId: string | undefined, activityKey: unknown = null) {
  const [snapshot, setSnapshot] = useState<{ owner?: string; deliveries: GardenBasketDelivery[]; available: boolean }>({ deliveries: [], available: false });
  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    const refresh = () => {
      loadGardenBasket(userId).then(deliveries => { if (!cancelled) setSnapshot({ owner: userId, deliveries, available: true }); })
        .catch(() => { if (!cancelled) setSnapshot({ owner: userId, deliveries: [], available: false }); });
    };
    refresh(); window.addEventListener(GARDEN_BASKET_CHANGED, refresh);
    return () => { cancelled = true; window.removeEventListener(GARDEN_BASKET_CHANGED, refresh); };
  }, [userId, activityKey]);
  return snapshot.owner === userId ? snapshot : { deliveries: [], available: false };
}
