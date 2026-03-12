import { supabase } from './supabase';
import { notifyWaitlistOnSlotFreed } from './bookingData';

export async function cancelAppointment(id) {
  const { data: apt } = await supabase.from('appointments').select('barber_id, date, time, barber_name, service_name').eq('id', id).single();
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (!error && apt?.barber_id && apt?.date && apt?.time) {
    notifyWaitlistOnSlotFreed({
      barberId: apt.barber_id,
      date: apt.date,
      time: apt.time,
      barberName: apt.barber_name,
      serviceName: apt.service_name,
    }).catch(() => {});
  }
  return !error;
}

export async function addAppointment(data) {
  const clientPhone = data.clientPhone ? String(data.clientPhone).replace(/\D/g, '') : null;
  const { data: inserted, error } = await supabase
    .from('appointments')
    .insert({
      client_name: data.clientName,
      client_phone: clientPhone,
      barber_id: data.barberId,
      branch_id: data.branchId || null,
      service_id: data.serviceId || null,
      service_name: data.serviceName,
      barber_name: data.barberName,
      branch_name: data.branchName || '',
      date: data.date,
      time: data.time,
      duration: data.duration || 40,
      price: data.price || 0,
      status: 'confirmed',
    })
    .select()
    .single();
  return error ? null : inserted;
}

export async function updateAppointment(id, updates) {
  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id);
  return !error;
}

export async function addBarber(name, phone = null) {
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
  const { data, error } = await supabase.from('barbers').insert({ name, phone: cleanPhone || null }).select().single();
  return error ? null : data;
}

export async function addService(name, price, duration) {
  const { data, error } = await supabase.from('services').insert({ name, price, duration }).select().single();
  return error ? null : data;
}

export async function updateService(id, updates) {
  const { error } = await supabase.from('services').update(updates).eq('id', id);
  return !error;
}

export async function addBranchBarber(branchId, barberId) {
  const { error } = await supabase.from('branch_barbers').insert({ branch_id: branchId, barber_id: barberId });
  return !error;
}

export async function removeBranchBarber(id) {
  const { error } = await supabase.from('branch_barbers').delete().eq('id', id);
  return !error;
}

export async function fetchBranchBarbers() {
  const { data, error } = await supabase.from('branch_barbers').select('id, branch_id, barber_id').order('branch_id');
  if (error) return [];
  return data || [];
}

export async function addBarberRestDay(barberId, dayOfWeek) {
  const { error } = await supabase.from('barber_rest_days').insert({ barber_id: barberId, day_of_week: dayOfWeek });
  return !error;
}

export async function removeBarberRestDay(id) {
  const { error } = await supabase.from('barber_rest_days').delete().eq('id', id);
  return !error;
}

export async function fetchBranches() {
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) return [];
  return data || [];
}

export async function getWaitlistCount() {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function fetchAllBarbers() {
  const { data, error } = await supabase.from('barbers').select('id, name, phone, avatar_url').order('name');
  if (error) {
    console.warn('fetchAllBarbers:', error?.message);
    return [];
  }
  return data || [];
}

export async function fetchUpdatesFeed(limit = 50) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('status', 'confirmed')
    .order('date', { ascending: false })
    .order('time', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('fetchUpdatesFeed:', error?.message);
    return [];
  }
  return (data || []).map((a) => ({
    id: a.id,
    clientName: a.client_name || 'לקוח',
    serviceName: a.service_name || 'טיפול',
    barberName: a.barber_name || '',
    date: a.date,
    time: typeof a.time === 'string' ? a.time.slice(0, 5) : a.time,
  }));
}

export async function fetchAppointmentsByBarberAndDate(barberId, dateStr) {
  if (!barberId || !dateStr) return [];
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .eq('date', dateStr)
    .eq('status', 'confirmed')
    .order('time', { ascending: true });
  if (error) {
    console.warn('fetchAppointmentsByBarberAndDate:', error?.message);
    return [];
  }
  return data || [];
}

export async function addBlockedSlot(barberId, dateStr, time) {
  const { data: inserted, error } = await supabase
    .from('blocked_slots')
    .insert({ barber_id: barberId, date: dateStr, time, duration: 40 })
    .select()
    .single();
  return error ? null : inserted;
}

export async function fetchBlockedSlots(barberId, dateStr) {
  if (!barberId || !dateStr) return [];
  const { data, error } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('barber_id', barberId)
    .eq('date', dateStr)
    .order('time', { ascending: true });
  if (error) return [];
  return (data || []).map((b) => ({ ...b, client_name: '[חסום]', _isBlocked: true }));
}

export async function removeBlockedSlot(id) {
  const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
  return !error;
}
