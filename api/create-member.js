const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    const rawBody = await getRawBody(req);
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};
  const customerDetails = session.customer_details || {};

  const elternEmail = customerDetails.email || '';
  const elternFullName = customerDetails.name || '';
  const nameParts = elternFullName.trim().split(' ');
  const elternVorname = nameParts[0] || '';
  const elternNachname = nameParts.slice(1).join(' ') || '';

  const kindVorname = metadata.kind_vorname || '';
  const kindNachname = metadata.kind_nachname || '';
  const kindGeburtsdatum = metadata.kind_geburtsdatum || '';
  const gruppe = metadata.gruppe || '';

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let elternteil;
  const { data: existing } = await supabase
    .from('eltern')
    .select('*')
    .eq('email', elternEmail)
    .maybeSingle();

  if (existing) {
    elternteil = existing;
  } else {
    const { data: created, error } = await supabase
      .from('eltern')
      .insert({
        vorname: elternVorname,
        nachname: elternNachname,
        email: elternEmail,
        status: 'aktiv',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    elternteil = created;
  }

  const { data: kind, error: kindError } = await supabase
    .from('kinder')
    .insert({
      vorname: kindVorname,
      nachname: kindNachname,
      geburtsdatum: kindGeburtsdatum,
      gruppe: gruppe,
      eltern_id: elternteil.id,
      status: gruppe ? 'aktiv' : 'neuzugang',
    })
    .select()
    .single();

  if (kindError) return res.status(500).json({ error: kindError.message });

  return res.status(200).json({ success: true, kind, elternteil });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(Buffer.from(data)));
    req.on('error', reject);
  });
}

export const config = {
  api: { bodyParser: false },
};