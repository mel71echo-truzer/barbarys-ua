/* Vercel Serverless Function — Telegram Order Notification */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, phone, product, date, message } = req.body || {};

  const token  = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.MANAGER_CHAT_ID;

  if (!token || !chatId) {
    console.warn('TELEGRAM_TOKEN or MANAGER_CHAT_ID not set');
    return res.status(200).json({ ok: true, note: 'no telegram config' });
  }

  const text = [
    '🌸 <b>Нове замовлення — Барбарис</b>',
    '',
    `👤 <b>Ім'я:</b> ${name || 'не вказано'}`,
    `📞 <b>Телефон:</b> ${phone || 'не вказано'}`,
    `💐 <b>Букет:</b> ${product || 'не вказано'}`,
    `📅 <b>Дата:</b> ${date || 'не вказано'}`,
    `📝 <b>Побажання:</b> ${message || '—'}`,
  ].join('\n');

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      }
    );
    const tgData = await tgRes.json();
    if (!tgData.ok) throw new Error(tgData.description);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram error:', err.message);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
