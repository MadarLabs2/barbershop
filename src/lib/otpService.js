import { supabase } from './supabase';

const CODE_LENGTH = 4;
const CODE_EXPIRY_MINUTES = 10;

/**
 * יוצר קוד חדש, שומר ב-DB ושולח אוטומטית ללקוח ב-WhatsApp (אם הוגדר Whapi).
 * מנסה קודם Edge Function; אם נכשל – יוצר רק ב-DB (לשליחה ידנית מהדף).
 */
export const createOTPRequest = async (phoneNumber) => {
  const phone = phoneNumber.replace(/\D/g, '');
  if (!phone || phone.length < 9) throw new Error('מספר טלפון לא תקין');

  const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
    body: { phone: phoneNumber },
  });

  if (error) {
    console.warn('Edge Function error:', error);
    const fallbackError = await insertFallback(phone);
    if (fallbackError) throw error;
    return { whatsappSent: false };
  }
  if (data?.error) {
    const fallbackError = await insertFallback(phone);
    if (fallbackError) throw new Error(data.error);
    return { whatsappSent: false };
  }
  return { whatsappSent: data?.whatsappSent ?? false };
};

const insertFallback = async (phone) => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const { error } = await supabase.from('otp_requests').insert({ phone, code });
  return error;
};

/**
 * מאמת קוד שהוזן על ידי המשתמש
 */
export const verifyOTPCode = async (phoneNumber, code) => {
  const phone = phoneNumber.replace(/\D/g, '');
  if (!phone || !code || code.length !== CODE_LENGTH) return false;

  const cutoff = new Date(Date.now() - CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('otp_requests')
    .select('id')
    .eq('phone', phone)
    .eq('code', code)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  return true;
};
