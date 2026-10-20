// Dice si un libro (ref) ya está pagado. También informa el precio.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const precio = Number(process.env.PRECIO || 3500);
  const ref = String((req.query && req.query.ref) || '');
  if (!ref || ref === 'ping') return res.json({ pagado: false, precio });
  if (!/^[a-z0-9-]{8,64}$/i.test(ref)) return res.status(400).json({ error: 'Referencia inválida' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel' });
  try {
    const r = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=' + encodeURIComponent(ref), {
      headers: { Authorization: 'Bearer ' + token }
    });
    const d = await r.json();
    const pagado = Array.isArray(d.results) && d.results.some(p => p.status === 'approved');
    res.json({ pagado, precio });
  } catch (e) {
    res.status(502).json({ pagado: false, precio, error: 'No se pudo consultar Mercado Pago' });
  }
};
