import { supabase } from './supabase';
import { addNotification } from './notificationsData';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getTimeSlot(timeStr) {
  const s = String(timeStr || '').slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  const mins = (h || 0) * 60 + (m || 0);
  if (mins < 12 * 60) return 'morning';
  if (mins < 16 * 60) return 'afternoon';
  return 'evening';
}

/** כשמתפנה תור – שלח התראה לרשימת המתנה המתאימה והסר אותם */
export async function notifyWaitlistOnSlotFreed({ barberId, date, time, barberName, serviceName }) {
  try {
    if (!barberId || !date) return;
    const slot = getTimeSlot(time);
    const preferCol = slot === 'morning' ? 'prefer_morning' : slot === 'afternoon' ? 'prefer_afternoon' : 'prefer_evening';

    const query = supabase
    .from('waitlist')
    .select('id, client_phone')
    .eq('barber_id', barberId)
    .eq('date', date)
    .eq(preferCol, true);

  const { data: entries, error } = await query;
  if (error || !entries?.length) return;

  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('he-IL');
  const timeLabel = slot === 'morning' ? 'בבוקר' : slot === 'afternoon' ? 'בצהריים' : 'בערב';

    for (const e of entries) {
      const phone = e.client_phone ? String(e.client_phone).replace(/\D/g, '') : null;
      if (phone && phone.length >= 9) {
        try {
          await addNotification({
            userPhone: phone,
            type: 'admin',
            title: 'תור מתפנה!',
            body: `נפתח תור ${timeLabel} בתאריך ${dateStr}${barberName ? ` אצל ${barberName}` : ''}. הזמן לקבוע אותו!`,
          });
        } catch (_) {}
      }
      try {
        await supabase.from('waitlist').delete().eq('id', e.id);
      } catch (_) {}
    }
  } catch (_) {}
}

export async function fetchBranches() {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) {
    console.warn('fetchBranches:', error?.message);
    return [];
  }
  return (data || []).map((r) => ({ id: r.id, name: r.name, address: r.address, wazeLink: r.waze_link }));
}

export async function fetchBarbersForBranch(branchId) {
  const fallbackBarbers = async () => {
    const { data, error } = await supabase.from('barbers').select('*');
    if (error) return [];
    return (data || []).map((b) => ({ id: b.id, name: b.name, avatar: b.avatar_url }));
  };
  if (!branchId) return fallbackBarbers();
  const { data, error } = await supabase
    .from('branch_barbers')
    .select('barber_id, barbers(id, name, avatar_url)')
    .eq('branch_id', branchId);
  if (error || !data?.length) return fallbackBarbers();
  return data
    .filter((r) => r.barbers)
    .map((r) => ({
      id: r.barbers.id,
      name: r.barbers.name,
      avatar: r.barbers.avatar_url,
    }));
}

export async function fetchBarberRestDays(barberId) {
  if (!barberId) return [];
  const { data, error } = await supabase
    .from('barber_rest_days')
    .select('day_of_week')
    .eq('barber_id', barberId);
  if (error) return [];
  return (data || []).map((r) => r.day_of_week);
}

export function getDayName(dayOfWeek) {
  return DAYS[dayOfWeek] ?? '';
}

export async function addToWaitlist({ barberId, clientPhone, clientName, serviceName, preferredDate, preferMorning, preferAfternoon, preferEvening }) {
  const { error } = await supabase.from('waitlist').insert({
    barber_id: barberId || null,
    client_phone: clientPhone ? String(clientPhone).replace(/\D/g, '') : null,
    client_name: clientName || null,
    service_name: serviceName || null,
    date: preferredDate || null,
    prefer_morning: !!preferMorning,
    prefer_afternoon: !!preferAfternoon,
    prefer_evening: !!preferEvening,
  });
  return !error;
}

export async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*').order('name');
  if (error) {
    console.warn('fetchServices:', error?.message);
    return [];
  }
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    duration: r.duration,
  }));
}
