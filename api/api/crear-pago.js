// Crea el pago en Mercado Pago y devuelve el link para pagar.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel' });
  const precio = Number(process.env.PRECIO || 3500);
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const ref = String(body.ref || '');
  if (!/^[a-z0-9-]{8,64}$/i.test(ref)) return res.status(400).json({ error: 'Referencia inválida' });
  const origin = 'https://' + req.headers.host;
  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ title: 'Fotolibro en PDF listo para imprimir', quantity: 1, unit_price: precio, currency_id: 'ARS' }],
        external_reference: ref,
        back_urls: { success: origin + '/pago-ok.html', failure: origin + '/pago-ok.html?e=1', pending: origin + '/pago-ok.html?p=1' },
        auto_return: 'approved',
        statement_descriptor: 'FOTOLIBRO'
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Mercado Pago no respondió', detalle: d.message });
    res.json({ url: d.init_point });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo conectar con Mercado Pago' });
  }
};
