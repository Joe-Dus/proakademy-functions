const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Stripe Webhook Signatur prüfen
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Webhook Error: ${err.message}` }) };
  }

  // Nur neue Abonnements verarbeiten
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  }

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};
  const customerDetails = session.customer_details || {};

  // Daten aus Stripe holen
  const elternEmail = customerDetails.email || '';
  const elternFullName = customerDetails.name || '';
  const nameParts = elternFullName.trim().split(' ');
  const elternVorname = nameParts[0] || '';
  const elternNachname = nameParts.slice(1).join(' ') || '';

  const kindVorname = metadata.kind_vorname || '';
  const kindNachname = metadata.kind_nachname || '';
  const kindGeburtsdatum = metadata.kind_geburtsdatum || '';
  const gruppe = metadata.gruppe || session.metadata?.product_name || '';

  // Supabase verbinden
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Elternteil suchen oder anlegen
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

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
    elternteil = created;
  }

  // Kind anlegen
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

  if (kindError) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: kindError.message }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, kind, elternteil }),
  };
};