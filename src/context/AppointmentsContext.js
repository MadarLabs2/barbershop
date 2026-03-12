import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { addNotification } from '../lib/notificationsData';
import { notifyWaitlistOnSlotFreed } from '../lib/bookingData';

const AppointmentsContext = createContext();

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentsProvider');
  }
  return context;
};

const mapRowToAppointment = (row) => ({
  id: row.id,
  barberId: row.barber_id,
  service: row.service_name || row.service?.name,
  price: row.price,
  barber: row.barber_name || row.barber?.name,
  branch: row.branch_name || row.branch?.name,
  date: row.date,
  time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
  duration: row.duration,
  clientPhone: row.client_phone,
  clientName: row.client_name,
  createdAt: row.created_at,
});

export const AppointmentsProvider = ({ children }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBookedSlots = async (barberId = null, branchId = null) => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select('date, time, barber_id, branch_id')
        .eq('status', 'confirmed');
      let filtered = data || [];
      if (barberId) {
        filtered = filtered.filter((r) => !r.barber_id || r.barber_id === barberId);
      }
      if (branchId) {
        filtered = filtered.filter((r) => !r.branch_id || r.branch_id === branchId);
      }
      setBookedSlots(filtered.map((r) => ({ date: r.date, time: r.time?.slice?.(0, 5) || r.time })));
    } catch (e) {
      console.warn('Fetch booked slots failed:', e?.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchAppointments = async () => {
      if (!user?.phone) return;
      try {
        setLoading(true);
        const phone = String(user.phone).replace(/\D/g, '');
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_phone', phone)
          .neq('status', 'cancelled')
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (mounted && !error) {
          const mapped = (data || []).map(mapRowToAppointment);
          const now = new Date();
          const upcoming = mapped.filter((apt) => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate > now;
          });
          const past = mapped.filter((apt) => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate <= now;
          });
          setAppointments(upcoming);
          for (const apt of past) {
            try {
              await supabase.from('appointments').delete().eq('id', apt.id);
            } catch (_) {}
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAppointments();
    fetchBookedSlots();

    return () => { mounted = false; };
  }, [user?.phone]);

  const addAppointment = async (appointment) => {
    const clientPhone = user?.phone ? String(user.phone).replace(/\D/g, '') : null;
    const clientName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;

    const newAppointment = {
      id: Date.now().toString(),
      ...appointment,
      clientPhone,
      clientName,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [...prev, newAppointment]);
    setBookedSlots((prev) => [...prev, { date: appointment.date, time: appointment.time }]);

    try {
      const { data: row, error } = await supabase
        .from('appointments')
        .insert({
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          service_name: appointment.service,
          barber_name: appointment.barber,
          branch_name: appointment.branch,
          barber_id: appointment.barberId || null,
          branch_id: appointment.branchId || null,
          service_id: appointment.serviceId || null,
          price: appointment.price,
          status: 'confirmed',
          client_phone: clientPhone || null,
          client_name: clientName || null,
        })
        .select('id, created_at')
        .single();

      if (!error && row) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === newAppointment.id
              ? { ...apt, id: row.id, createdAt: row.created_at }
              : apt
          )
        );
        const dateStr = new Date(appointment.date + 'T12:00:00').toLocaleDateString('he-IL');
        addNotification({
          userPhone: clientPhone,
          type: 'personal',
          title: 'קבעת תור',
          body: `תור ל${appointment.service} אצל ${appointment.barber} בתאריך ${dateStr} בשעה ${appointment.time}`,
        }).catch(() => {});
        return { ...newAppointment, id: row.id, createdAt: row.created_at };
      }
    } catch (e) {
      setBookedSlots((prev) => prev.filter((s) => s.date !== appointment.date || s.time !== appointment.time));
      console.warn('Supabase insert failed:', e.message);
    }

    return newAppointment;
  };

  const cancelAppointment = async (id) => {
    const apt = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    if (apt) {
      setBookedSlots((prev) => prev.filter((s) => s.date !== apt.date || s.time !== apt.time));
      const phone = apt.clientPhone || user?.phone;
      const phoneStr = phone ? String(phone).replace(/\D/g, '') : null;
      if (phoneStr) {
        const dateStr = new Date(apt.date + 'T12:00:00').toLocaleDateString('he-IL');
        addNotification({
          userPhone: phoneStr,
          type: 'personal',
          title: 'ביטלת תור',
          body: `התור ל${apt.service} בתאריך ${dateStr} בוטל`,
        }).catch(() => {});
      }
    }

    try {
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (apt?.barberId && apt?.date && apt?.time) {
        notifyWaitlistOnSlotFreed({
          barberId: apt.barberId,
          date: apt.date,
          time: apt.time,
          barberName: apt.barber,
          serviceName: apt.service,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Supabase cancel failed:', e.message);
    }
  };

  const updateAppointment = (id, updates) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt))
    );
  };

  const getAppointmentById = (id) => {
    return appointments.find((apt) => apt.id === id);
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter((apt) => {
        const appointmentDate = new Date(`${apt.date}T${apt.time}`);
        return appointmentDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });
  };

  const getPastAppointments = () => {
    const now = new Date();
    return appointments
      .filter((apt) => {
        const appointmentDate = new Date(`${apt.date}T${apt.time}`);
        return appointmentDate <= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
      });
  };

  const isSlotBooked = (date, time) => {
    const dateStr = date?.toISOString?.()?.split('T')[0] || date;
    return bookedSlots.some((s) => s.date === dateStr && (s.time?.slice?.(0, 5) || s.time) === time);
  };

  const value = {
    appointments,
    bookedSlots,
    isSlotBooked,
    loading,
    addAppointment,
    cancelAppointment,
    updateAppointment,
    getAppointmentById,
    getUpcomingAppointments,
    getPastAppointments,
    fetchBookedSlots,
  };

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};
