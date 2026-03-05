import { MercadoPagoConfig, Preference } from 'mercadopago';

// Esta é uma simulação de como seria o endpoint no Next.js (Edge Function do Supabase segue lógica similar)
// Acessaremos via client-side fetch para simular o comportamento pedido.

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, goldAmount, amount } = req.body;

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `gold_pack_${goldAmount}`,
            title: `Pacote de Ouro: ${goldAmount} unidades`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          }
        ],
        metadata: {
          user_id: userId,
          gold_amount: goldAmount, // Campo metadata.gold_amount como pedido
        },
        notification_url: "https://seu-dominio.com/api/webhooks/mercadopago", // URL do seu webhook
        back_urls: {
          success: "https://seu-dominio.com/?status=success",
          failure: "https://seu-dominio.com/?status=failure",
          pending: "https://seu-dominio.com/?status=pending",
        },
        auto_return: "approved",
      }
    });

    return res.status(200).json({ preferenceId: result.id });
  } catch (error) {
    console.error("MP Preference Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
