import Constants from 'expo-constants';
import { supabase } from './supabase';
import { WHATSAPP_SERVICE_URL } from './config';

const CODE_LENGTH = 4;
const CODE_EXPIRY_MINUTES = 10;

const getWhatsAppServiceUrl = () => {
  const raw = Constants.expoConfig?.extra?.whatsappServiceUrl ||
    process.env.EXPO_PUBLIC_WHATSAPP_SERVICE_URL ||
    WHATSAPP_SERVICE_URL;
  return typeof raw === 'string' ? raw.trim() : '';
};

/**
 * יוצר קוד חדש, שומר ב-DB ושולח אוטומטית ללקוח ב-WhatsApp.
 * קודם מנסה את שירות WhatsApp (whatsapp-web.js); אם נכשל – יוצר רק ב-DB (לשליחה ידנית מהדף).
 */
export const createOTPRequest = async (phoneNumber) => {
  const phone = phoneNumber.replace(/\D/g, '');
  if (!phone || phone.length < 9) throw new Error('מספר טלפון לא תקין');

  const serviceUrl = getWhatsAppServiceUrl();

  if (serviceUrl) {
    try {
      const baseUrl = serviceUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { whatsappSent: data?.whatsappSent ?? false };
      }
      console.warn('WhatsApp service error:', data?.error || res.status);
    } catch (e) {
      console.warn('WhatsApp service unreachable:', e?.message);
    }
  }

  // Fallback: save to Supabase only (manual send via otp-panel)
  const err = await insertFallback(phone);
  if (err) throw new Error('לא הצלחנו ליצור קוד');
  return { whatsappSent: false };
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
