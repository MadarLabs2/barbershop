import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = '@barbershop_user';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const findBarberByPhone = async (phoneRaw) => {
    const digits = String(phoneRaw || '').replace(/\D/g, '');
    if (!digits || digits.length < 9) return null;
    const last9 = digits.slice(-9);
    const variants = [digits, last9, digits.startsWith('0') ? digits : `0${digits}`, digits.startsWith('972') ? `0${digits.slice(3)}` : null].filter(Boolean);
    for (const p of variants) {
      const { data } = await supabase.from('barbers').select('id').eq('phone', p).maybeSingle();
      if (data) return data.id;
    }
    const { data: allBarbers } = await supabase.from('barbers').select('id, phone');
    const match = (allBarbers || []).find((b) => b.phone && String(b.phone).replace(/\D/g, '').endsWith(last9));
    return match?.id || null;
  };

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        const phone = String(parsed?.phone || '').replace(/\D/g, '');
        if (phone) {
          const [appUserRes, barberId] = await Promise.all([
            supabase.from('app_users').select('is_admin').eq('phone', phone).maybeSingle(),
            findBarberByPhone(phone),
          ]);
          const data = appUserRes?.data;
          const updates = {};
          if (data && parsed.isAdmin !== !!data.is_admin) updates.isAdmin = !!data.is_admin;
          if (barberId && parsed.barberId !== barberId) updates.barberId = barberId;
          if (Object.keys(updates).length) {
            const updated = { ...parsed, ...updates };
            setUser(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
        }
      }
    } catch (e) {
      console.warn('Auth load failed:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('Auth save failed:', e?.message);
    }
  };

  const clearUser = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Auth clear failed:', e?.message);
    }
  };

  const login = async (phoneNumber, userData = null) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('phone', phoneNumber.replace(/\D/g, ''))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const barberId = await findBarberByPhone(data.phone);
        await saveUser({
          id: data.id,
          phone: data.phone,
          firstName: data.first_name,
          lastName: data.last_name,
          birthDate: data.birth_date,
          isAdmin: !!data.is_admin,
          barberId: barberId || undefined,
        });
        return true;
      }

      if (userData) {
        const { data: inserted, error: insertErr } = await supabase
          .from('app_users')
          .insert({
            phone: phoneNumber.replace(/\D/g, ''),
            first_name: userData.firstName,
            last_name: userData.lastName,
            birth_date: userData.birthDate || null,
          })
          .select('*')
          .single();

        if (insertErr) throw insertErr;

        const barberId = await findBarberByPhone(inserted.phone);
        await saveUser({
          id: inserted.id,
          phone: inserted.phone,
          firstName: inserted.first_name,
          lastName: inserted.last_name,
          birthDate: inserted.birth_date,
          isAdmin: !!inserted.is_admin,
          barberId: barberId || undefined,
        });
        return true;
      }

      return false;
    } catch (e) {
      console.warn('Login failed:', e?.message);
      if (userData) {
        await saveUser({
          id: `local_${Date.now()}`,
          phone: phoneNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          birthDate: userData.birthDate,
        });
        return true;
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut:', e?.message);
    }
    await clearUser();
  };

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
