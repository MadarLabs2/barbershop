import { supabase } from './supabase';

/** תקן טלפון להתראות: ספרות בלבד, 9 ספרות אחרונות (054/972/9) */
export function normalizePhoneForNotifications(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits || digits.length < 9) return digits || null;
  return digits.slice(-9);
}

export async function addNotification({ userPhone, type, title, body }) {
  const normalized = normalizePhoneForNotifications(userPhone);
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_phone: normalized || null, type, title, body: body || '' })
    .select()
    .single();
  if (error) {
    console.warn('[notifications] addNotification failed:', error?.message);
    return null;
  }
  return data;
}

export async function fetchNotifications(userPhone) {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  const phone = normalizePhoneForNotifications(userPhone);
  const digits = userPhone ? String(userPhone).replace(/\D/g, '') : '';
  if (phone) {
    // התאמה ל־9 ספרות וגם 10 ספרות (עם 0) למקרה של שוני בפורמט הטלפון
    const withZero = digits.length >= 10 ? digits : `0${phone}`;
    query = query.or(`user_phone.eq."${phone}",user_phone.eq."${withZero}",user_phone.is.null`);
  } else {
    query = query.is('user_phone', null);
  }
  const { data, error } = await query;
  if (error) {
    console.warn('[notifications] fetchNotifications failed:', error?.message);
    return [];
  }
  return data || [];
}

/** סמן התראה כנקראה */
export async function markNotificationAsRead(notificationId, userPhone) {
  const phone = normalizePhoneForNotifications(userPhone);
  const phoneToUse = phone || null;
  if (!phoneToUse || !notificationId) return false;
  const { error } = await supabase.from('notification_reads').upsert(
    { notification_id: notificationId, user_phone: phoneToUse },
    { onConflict: 'notification_id,user_phone' }
  );
  if (error) {
    console.warn('[notifications] markAsRead failed:', error?.message);
    return false;
  }
  return true;
}

/** מחזיר מספר ההתראות שלא נקראו */
export async function getUnreadNotificationsCount(userPhone) {
  const notifications = await fetchNotifications(userPhone);
  if (notifications.length === 0) return 0;
  const phone = normalizePhoneForNotifications(userPhone);
  const digits = userPhone ? String(userPhone).replace(/\D/g, '') : '';
  const phoneToUse = phone || null;
  if (!phoneToUse) return 0;
  const ids = notifications.map((n) => n.id);
  const { data: reads } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_phone', phoneToUse)
    .in('notification_id', ids);
  const readIds = new Set((reads || []).map((r) => r.notification_id));
  return notifications.filter((n) => !readIds.has(n.id)).length;
}
