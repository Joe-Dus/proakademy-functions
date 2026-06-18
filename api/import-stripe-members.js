import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Alle aktiven Stripe Subscriptions holen
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer'],
    });

    let imported = 0;
    let skipped = 0;

    for (const sub of subscriptions.data) {
      const customer = sub.customer;
      const email = customer.email;
      const name = customer.name || '';
      const phone = customer.phone || '';
      const nameParts = name.trim().split(' ');
      const vorname = nameParts[0] || '';
      const nachname = nameParts.slice(1).join(' ') || '';

      // Prüfen ob Elternteil schon existiert
      const { data: existing } = await supabase
        .from('eltern')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Neuen Elternteil anlegen
      const { error } = await supabase
        .from('eltern')
        .insert({
          vorname,
          nachname,
          email,
          telefon: phone,
          status: 'aktiv',
        });

      if (!error) imported++;
    }

    return res.status(200).json({ 
      success: true, 
      imported, 
      skipped,
      total: subscriptions.data.length 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}