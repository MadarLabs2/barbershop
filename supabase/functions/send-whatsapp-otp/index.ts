import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '972' + digits.slice(1);
  if (digits.startsWith('972')) return digits;
  return '972' + digits;
}

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const code = generateCode();
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error: dbError } = await supabase.from('otp_requests').insert({
      phone: phone.replace(/\D/g, ''),
      code,
    });

    if (dbError) {
      console.error('DB error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let whatsappSent = false;
    if (whapiToken) {
      const waNumber = toWhatsAppNumber(phone);
      const message = `קוד ההתחברות לאפליקציה BarberShop: ${code}`;
      try {
        const res = await fetch('https://gate.whapi.cloud/messages/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${whapiToken}`,
          },
          body: JSON.stringify({ to: waNumber, body: message }),
        });

        const resText = await res.text();
        if (res.ok) {
          whatsappSent = true;
        } else {
          console.error('Whapi error:', res.status, resText, 'to:', waNumber);
        }
      } catch (e) {
        console.error('Whapi fetch error:', e);
      }
    } else {
      console.warn('WHAPI_TOKEN not set');
    }

    return new Response(
      JSON.stringify({ success: true, whatsappSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
