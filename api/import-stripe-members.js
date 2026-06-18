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
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer'],
    });

    let importedEltern = 0;
    let importedKinder = 0;
    let skipped = 0;

    for (const sub of subscriptions.data) {
      const customer = sub.customer;
      const email = customer.email;
      const name = customer.name || '';
      const phone = customer.phone || '';
      const nameParts = name.trim().split(' ');
      const vorname = nameParts[0] || '';
      const nachname = nameParts.slice(1).join(' ') || '';

      // Metadata aus der Subscription holen
      const metadata = sub.metadata || {};
      const kindVorname = metadata.kind_vorname || '';
      const kindNachname = metadata.kind_nachname || '';
      const kindGeburtsdatum = metadata.kind_geburtsdatum || '';
      const gruppe = metadata.gruppe || '';

      // Elternteil suchen oder anlegen
      let elternteil;
      const { data: existing } = await supabase
        .from('eltern')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        elternteil = existing;
        skipped++;
      } else {
        const { data: created, error } = await supabase
          .from('eltern')
          .insert({
            vorname,
            nachname,
            email,
            telefon: phone,
            status: 'aktiv',
          })
          .select()
          .single();

        if (error) continue;
        elternteil = created;
        importedEltern++;
      }

      // Kind anlegen falls Daten vorhanden
      if (kindVorname && kindNachname) {
        const { data: existingKind } = await supabase
          .from('kinder')
          .select('*')
          .eq('vorname', kindVorname)
          .eq('nachname', kindNachname)
          .eq('eltern_id', elternteil.id)
          .maybeSingle();

        if (!existingKind) {
          const { error: kindError } = await supabase
            .from('kinder')
            .insert({
              vorname: kindVorname,
              nachname: kindNachname,
              geburtsdatum: kindGeburtsdatum || null,
              gruppe: gruppe,
              eltern_id: elternteil.id,
              status: gruppe ? 'aktiv' : 'neuzugang',
            });

          if (!kindError) importedKinder++;
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      importedEltern,
      importedKinder,
      skipped,
      total: subscriptions.data.length 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}