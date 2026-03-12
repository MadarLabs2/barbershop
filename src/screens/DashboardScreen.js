import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllBarbers,
  fetchUpdatesFeed,
  fetchAppointmentsByBarberAndDate,
  fetchBlockedSlots,
  cancelAppointment,
  getWaitlistCount,
  addAppointment,
  updateAppointment,
  addBlockedSlot,
  removeBlockedSlot,
  fetchBranches,
} from '../lib/dashboardData';
import { fetchServices } from '../lib/bookingData';
import { addNotification } from '../lib/notificationsData';
import { toE164 } from '../lib/config';

const ORANGE = '#FF6B35';
const CLOSE_HOUR = 19;

function getDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toLocalDateStr(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayLabel(date) {
  const today = getDateOnly(new Date());
  const dateOnly = getDateOnly(date);
  const diff = Math.round((dateOnly - today) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  return date.toLocaleDateString('he-IL', { weekday: 'short' });
}

function getAvailableDays() {
  const now = new Date();
  const today = getDateOnly(now);
  const closeTime = new Date(today);
  closeTime.setHours(CLOSE_HOUR, 0, 0, 0);
  const startDay = now >= closeTime ? 1 : 0;
  const days = [];
  for (let i = startDay; i < startDay + 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function timeToMinutes(t) {
  const s = (t || '').toString().slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getAvailableTimeSlots(selectedDate, excludeBooked = []) {
  const now = new Date();
  const today = getDateOnly(now);
  const selected = selectedDate ? getDateOnly(selectedDate) : null;
  let minMinutes = 0;
  if (selected && selected.getTime() === today.getTime()) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + 20;
    minMinutes = Math.min(19 * 60, Math.ceil(currentMinutes / 40) * 40);
  }
  const slots = [];
  for (let h = 9; h < 19; h++) {
    for (let m = 0; m < 60; m += 40) {
      const slotMinutes = h * 60 + m;
      if (slotMinutes >= minMinutes) slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  if (excludeBooked.length === 0) return slots;
  const newDuration = 40;
  return slots.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + newDuration;
    for (const b of excludeBooked) {
      const bStart = timeToMinutes(b.time);
      const bDuration = b.duration || 40;
      const bEnd = bStart + bDuration;
      if (slotStart < bEnd && slotEnd > bStart) return false;
    }
    return true;
  });
}

function getNext7Days() {
  const today = getDateOnly(new Date());
  const days = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatTimeRange(time, duration = 40) {
  const [h, m] = (time || '09:00').toString().slice(0, 5).split(':').map(Number);
  const endM = m + (duration || 40);
  const endH = h + Math.floor(endM / 60);
  const endM2 = endM % 60;
  const end = `${String(endH).padStart(2, '0')}:${String(endM2).padStart(2, '0')}`;
  const start = (time || '09:00').toString().slice(0, 5);
  return `${start} עד ${end}`;
}

const APT_ACTIONS = [
  { id: 'call', label: 'התקשר', icon: 'call' },
  { id: 'message', label: 'שלח הודעה', icon: 'chatbubble' },
  { id: 'delete', label: 'מחק תור', icon: 'trash' },
  { id: 'reschedule', label: 'החלפת תור', icon: 'calendar' },
  { id: 'details', label: 'תיעוד לקוח', icon: 'document-text' },
  { id: 'recurring', label: 'צור תור קבוע', icon: 'repeat' },
  { id: 'noshow', label: 'לקוח לא הגיע (0)', icon: 'person-remove' },
];

export default function DashboardScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const isEmployee = !!(user?.barberId && !user?.isAdmin);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    if (route.params?.openTab === 'management' && !isEmployee) {
      setActiveTab('management');
    }
  }, [route.params?.openTab, isEmployee]);
  const [barbers, setBarbers] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [aptMenuVisible, setAptMenuVisible] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [addForm, setAddForm] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: null,
    date: null,
    time: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState({ date: null, time: '' });
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockForm, setBlockForm] = useState({ barberId: null, date: null, time: '' });
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', body: '' });
  const [addFormBooked, setAddFormBooked] = useState([]);

  const days = getNext7Days();
  const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 9; h < 19; h++) {
      for (let m = 0; m < 60; m += 40) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  })();
  const availableDays = getAvailableDays();
  const addFormBarber = selectedBarber || barbers[0];
  const availableTimeSlots = addModalVisible
    ? getAvailableTimeSlots(addForm.date || availableDays[0], addFormBooked)
    : getAvailableTimeSlots(addForm.date || availableDays[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [barbersData, updatesData, count] = await Promise.all([
        fetchAllBarbers(),
        isEmployee ? Promise.resolve([]) : fetchUpdatesFeed(),
        isEmployee ? Promise.resolve(0) : getWaitlistCount(),
      ]);
      const barbersList = barbersData.length ? barbersData : [];
      setBarbers(barbersList);
      setUpdates(updatesData);
      setWaitlistCount(count);
      if (isEmployee && user?.barberId) {
        const myBarber = barbersList.find((b) => b.id === user.barberId) || { id: user.barberId, name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'התורים שלי' };
        setSelectedBarber(myBarber);
        setSelectedDate((prev) => prev || getDateOnly(new Date()));
      } else if (barbersList.length) {
        setSelectedBarber((prev) => prev || barbersList[0]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isEmployee, user?.barberId]);

  useEffect(() => {
    (async () => {
      const [s, b] = await Promise.all([fetchServices(), fetchBranches()]);
      setServices(s);
      setBranches(b);
    })();
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      const dateStr = toLocalDateStr(selectedDate);
      (async () => {
        const [apts, blocked] = await Promise.all([
          fetchAppointmentsByBarberAndDate(selectedBarber.id, dateStr),
          fetchBlockedSlots(selectedBarber.id, dateStr),
        ]);
        const merged = [...apts, ...blocked].sort((a, b) =>
          String(a.time || '').localeCompare(String(b.time || ''))
        );
        setAppointments(merged);
      })();
    } else {
      setAppointments([]);
    }
  }, [selectedBarber?.id, selectedDate]);

  useEffect(() => {
    if (!addModalVisible || !addForm.date) {
      setAddFormBooked([]);
      return;
    }
    const barber = selectedBarber || barbers[0];
    if (!barber?.id) return;
    const dateStr = toLocalDateStr(addForm.date);
    (async () => {
      const [apts, blocked] = await Promise.all([
        fetchAppointmentsByBarberAndDate(barber.id, dateStr),
        fetchBlockedSlots(barber.id, dateStr),
      ]);
      setAddFormBooked([...apts, ...blocked]);
    })();
  }, [addModalVisible, addForm.date, selectedBarber?.id, barbers[0]?.id]);

  useEffect(() => {
    if (!addModalVisible) return;
    const slots = getAvailableTimeSlots(addForm.date || availableDays[0], addFormBooked);
    if (slots.length > 0 && addForm.time && !slots.includes(addForm.time)) {
      setAddForm((f) => ({ ...f, time: slots[0] }));
    }
  }, [addModalVisible, addForm.date, addForm.time, addFormBooked]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAptAction = async (actionId, apt) => {
    setAptMenuVisible(false);
    if (!['reschedule', 'details'].includes(actionId)) setSelectedApt(null);
    if (actionId === 'call' && apt?.client_phone) {
      const tel = toE164(apt.client_phone);
      Linking.openURL(`tel:${tel}`).catch(() => {});
    } else if (actionId === 'message' && apt?.client_phone) {
      const phone = apt.client_phone.replace(/\D/g, '');
      const wa = phone.startsWith('0') ? '972' + phone.slice(1) : phone.startsWith('972') ? phone : '972' + phone;
      Linking.openURL(`https://wa.me/${wa}`).catch(() => {});
    } else if (actionId === 'delete' && apt?.id) {
      const isBlocked = apt._isBlocked;
      Alert.alert(isBlocked ? 'הסר חסימה' : 'מחק תור', isBlocked ? 'להסיר את החסימה?' : 'האם למחוק את התור?', [
        { text: 'ביטול', style: 'cancel' },
        {
          text: isBlocked ? 'הסר' : 'מחק',
          style: 'destructive',
          onPress: async () => {
            const ok = isBlocked ? await removeBlockedSlot(apt.id) : await cancelAppointment(apt.id);
            if (ok) {
              setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
              if (!isBlocked && apt.client_phone) {
                const phoneStr = String(apt.client_phone).replace(/\D/g, '');
                const dateStr = apt.date ? new Date(apt.date + 'T12:00:00').toLocaleDateString('he-IL') : '';
                addNotification({ userPhone: phoneStr, type: 'personal', title: 'התור שלך בוטל', body: `התור ל${apt.service_name || 'טיפול'} בתאריך ${dateStr} בוטל על ידי הסניף` }).catch(() => {});
              }
            }
          },
        },
      ]);
    } else if (actionId === 'reschedule') {
      const days = getAvailableDays();
      const aptDate = apt.date ? new Date(apt.date + 'T12:00:00') : new Date();
      const d = days.some((dd) => toLocalDateStr(dd) === toLocalDateStr(aptDate)) ? aptDate : days[0];
      const slots = getAvailableTimeSlots(d);
      const t = (apt.time || '').toString().slice(0, 5);
      const time = slots.includes(t) ? t : slots[0] || '09:00';
      setRescheduleForm({ date: d, time });
      setRescheduleModalVisible(true);
    } else if (actionId === 'details') {
      setDetailsModalVisible(true);
    } else if (actionId === 'noshow') {
      Alert.alert('לקוח לא הגיע', 'סימון כלא הגיע', [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'סמן',
          onPress: async () => {
            await updateAppointment(apt.id, { status: 'cancelled' });
            setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
          },
        },
      ]);
    } else if (actionId === 'recurring') {
      const days = getAvailableDays();
      const aptDate = apt.date ? new Date(apt.date + 'T12:00:00') : new Date();
      const d = days.some((dd) => toLocalDateStr(dd) === toLocalDateStr(aptDate)) ? aptDate : days[0];
      const slots = getAvailableTimeSlots(d);
      const t = (apt.time || '').toString().slice(0, 5);
      const time = slots.includes(t) ? t : slots[0] || '09:00';
      setAddForm({
        ...addForm,
        clientName: apt.client_name || '',
        clientPhone: apt.client_phone || '',
        serviceId: apt.service_id,
        date: d,
        time,
      });
      setAddModalVisible(true);
    }
  };

  const openAddAppointment = () => {
    const days = getAvailableDays();
    const firstDay = days[0];
    const slots = getAvailableTimeSlots(firstDay);
    setAddForm({
      clientName: '',
      clientPhone: '',
      serviceId: services[0]?.id,
      date: firstDay,
      time: slots[0] || '09:00',
    });
    setAddModalVisible(true);
  };

  const saveAddAppointment = async () => {
    if (!addForm.clientName?.trim() || !addForm.clientPhone?.trim()) {
      Alert.alert('נא למלא', 'שם וטלפון');
      return;
    }
    const slots = getAvailableTimeSlots(addForm.date, addFormBooked);
    if (!slots.includes(addForm.time)) {
      Alert.alert('השעה תפוסה', 'נא לבחור שעה פנויה');
      return;
    }
    const service = services.find((s) => s.id === addForm.serviceId) || services[0];
    const dateStr = toLocalDateStr(addForm.date);
    const barber = selectedBarber || barbers[0];
    if (!dateStr || !barber) {
      Alert.alert('נא לבחור', 'ספר ותאריך');
      return;
    }
    const branch = branches[0];
    const result = await addAppointment({
      clientName: addForm.clientName.trim(),
      clientPhone: addForm.clientPhone.trim(),
      barberId: barber.id,
      barberName: barber.name,
      branchId: branch?.id,
      branchName: branch?.name || '',
      serviceId: service?.id,
      serviceName: service?.name || 'טיפול',
      date: dateStr,
      time: addForm.time,
      duration: service?.duration || 40,
      price: service?.price || 0,
    });
    if (result) {
      setAddModalVisible(false);
      const phoneStr = addForm.clientPhone?.replace?.(/\D/g, '');
      if (phoneStr) {
        const dateFmt = new Date(dateStr + 'T12:00:00').toLocaleDateString('he-IL');
        addNotification({
          userPhone: phoneStr,
          type: 'personal',
          title: 'נוצר לך תור',
          body: `תור ל${service?.name || 'טיפול'} אצל ${barber.name} בתאריך ${dateFmt} בשעה ${addForm.time}`,
        }).catch(() => {});
      }
      if (toLocalDateStr(selectedDate) === dateStr) {
        setAppointments((prev) => [...prev, result].sort((a, b) => String(a.time).localeCompare(String(b.time))));
      }
      loadData();
      Alert.alert('הצלחה', 'התור נוסף');
    } else {
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף');
    }
  };

  const saveReschedule = async () => {
    if (!selectedApt || !rescheduleForm.date || !rescheduleForm.time) return;
    const dateStr = toLocalDateStr(rescheduleForm.date);
    const ok = await updateAppointment(selectedApt.id, {
      date: dateStr,
      time: rescheduleForm.time,
    });
    if (ok) {
      setRescheduleModalVisible(false);
      if (selectedApt?.client_phone) {
        const phoneStr = String(selectedApt.client_phone).replace(/\D/g, '');
        const dateStr = new Date(toLocalDateStr(rescheduleForm.date) + 'T12:00:00').toLocaleDateString('he-IL');
        addNotification({
          userPhone: phoneStr,
          type: 'personal',
          title: 'התור שלך הוחלף',
          body: `התור החדש: ${dateStr} בשעה ${rescheduleForm.time}`,
        }).catch(() => {});
      }
      setSelectedApt(null);
      onRefresh();
    }
  };

  const openBlockModal = () => {
    const barber = selectedBarber || barbers[0];
    const days = getAvailableDays();
    const firstDay = days[0];
    const slots = getAvailableTimeSlots(firstDay);
    setBlockForm({
      barberId: barber?.id,
      date: firstDay,
      time: slots[0] || '09:00',
    });
    setBlockModalVisible(true);
  };

  const saveBlockSlot = async () => {
    const barber = barbers.find((b) => b.id === blockForm.barberId) || barbers[0];
    if (!barber || !blockForm.date || !blockForm.time) {
      Alert.alert('נא לבחור', 'ספר, תאריך ושעה');
      return;
    }
    const dateStr = toLocalDateStr(blockForm.date);
    const result = await addBlockedSlot(barber.id, dateStr, blockForm.time);
    if (result) {
      setBlockModalVisible(false);
      if (selectedBarber?.id === barber.id && toLocalDateStr(selectedDate) === dateStr) {
        const [apts, blocked] = await Promise.all([
          fetchAppointmentsByBarberAndDate(barber.id, dateStr),
          fetchBlockedSlots(barber.id, dateStr),
        ]);
        setAppointments([...apts, ...blocked].sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))));
      }
      loadData();
      Alert.alert('הצלחה', 'החסימה נוספה');
    } else {
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף חסימה');
    }
  };

  const savePublishMessage = async () => {
    const title = publishForm.title?.trim();
    if (!title) {
      Alert.alert('נא למלא', 'כותרת ההודעה');
      return;
    }
    const result = await addNotification({
      userPhone: null,
      type: 'admin',
      title,
      body: publishForm.body?.trim() || '',
    });
    if (result) {
      setPublishModalVisible(false);
      setPublishForm({ title: '', body: '' });
      Alert.alert('הצלחה', 'ההודעה נשלחה לכל הלקוחות');
    } else {
      Alert.alert('שגיאה', 'לא הצלחנו לפרסם');
    }
  };

  const formatUpdateItem = (item) => {
    const dateStr = item.date ? new Date(item.date + 'T12:00:00').toLocaleDateString('he-IL') : '';
    return `${item.clientName}, הזמין תור ל${item.serviceName} אצל ${item.barberName} בתאריך ${dateStr}${item.time ? ' בשעה ' + item.time : ''}`;
  };

  const renderUpdateItem = ({ item }) => (
    <View style={styles.updateCard}>
      <View style={styles.updateBadge}>
        <Text style={styles.updateBadgeText}>תור</Text>
      </View>
      <Text style={styles.updateText}>{formatUpdateItem(item)}</Text>
    </View>
  );

  const headerTitle = isEmployee
    ? 'התורים שלי'
    : activeTab === 'updates'
    ? 'עדכונים'
    : activeTab === 'management'
    ? 'ניהול'
    : 'בחר איש צוות';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          {activeTab === 'appointments' && (
            <Ionicons name="chevron-up" size={16} color="#fff" style={styles.headerChevron} />
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.openDrawer?.()} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {!isEmployee && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'updates' && styles.tabActive]}
            onPress={() => setActiveTab('updates')}
          >
            <Text style={[styles.tabText, activeTab === 'updates' && styles.tabTextActive]}>עדכונים</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
            onPress={() => setActiveTab('appointments')}
          >
            <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>תורים</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'management' && styles.tabActive]}
            onPress={() => setActiveTab('management')}
          >
            <Text style={[styles.tabText, activeTab === 'management' && styles.tabTextActive]}>ניהול</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'updates' && !isEmployee ? (
        <>
          <View style={styles.filterRow}>
            <View style={styles.filterChip}>
              <Ionicons name="diamond-outline" size={12} color="#666" />
              <Text style={styles.filterChipText}>פרטים</Text>
            </View>
          </View>
          <FlatList
            data={updates}
            renderItem={renderUpdateItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.updatesList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
              ) : (
                <Text style={styles.emptyText}>אין עדכונים</Text>
              )
            }
          />
        </>
      ) : activeTab === 'management' && !isEmployee ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.managementContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.mgmtStatsCard}>
            <View style={styles.mgmtStatsIcon}>
              <Ionicons name="people" size={32} color={ORANGE} />
            </View>
            <View style={styles.mgmtStatsBody}>
              <Text style={styles.mgmtStatsNum}>{waitlistCount}</Text>
              <Text style={styles.mgmtStatsLabel}>לקוחות ברשימת המתנה</Text>
            </View>
          </View>

          <View style={styles.mgmtSection}>
            <View style={styles.mgmtSectionHeader}>
              <Ionicons name="calendar" size={20} color={ORANGE} />
              <Text style={styles.mgmtSectionTitle}>תורים</Text>
            </View>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => { setActiveTab('appointments'); setTimeout(openAddAppointment, 300); }} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="add" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>הוספת תור</Text>
                <Text style={styles.mgmtCardSub}>הזנת תור חדש ללקוח</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => { setActiveTab('appointments'); setTimeout(openBlockModal, 300); }} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="lock-closed" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>חסימת תורים</Text>
                <Text style={styles.mgmtCardSub}>חסימת שעות לתאריך מסוים</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
          </View>

          <View style={styles.mgmtSection}>
            <View style={styles.mgmtSectionHeader}>
              <Ionicons name="notifications" size={20} color={ORANGE} />
              <Text style={styles.mgmtSectionTitle}>הודעות</Text>
            </View>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => { setPublishForm({ title: '', body: '' }); setPublishModalVisible(true); }} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="megaphone" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>שליחת הודעה ללקוחות</Text>
                <Text style={styles.mgmtCardSub}>הודעה כללית לכל הלקוחות</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => Linking.openURL('https://wa.me/972547267713')} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="chatbubbles" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>הודעה ללקוחות בהמתנה</Text>
                <Text style={styles.mgmtCardSub}>פתיחת WhatsApp</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
          </View>

          <View style={styles.mgmtSection}>
            <View style={styles.mgmtSectionHeader}>
              <Ionicons name="settings" size={20} color={ORANGE} />
              <Text style={styles.mgmtSectionTitle}>הגדרות</Text>
            </View>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => navigation.navigate('AdminManage', { type: 'staff' })} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="people" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>אנשי צוות</Text>
                <Text style={styles.mgmtCardSub}>הוספה ועריכת ספרים</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => navigation.navigate('AdminManage', { type: 'services' })} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="cut" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>טיפולים</Text>
                <Text style={styles.mgmtCardSub}>מחירים ומשך טיפול</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mgmtCard} onPress={() => navigation.navigate('AdminManage', { type: 'days' })} activeOpacity={0.8}>
              <View style={styles.mgmtCardIcon}><Ionicons name="calendar-outline" size={24} color={ORANGE} /></View>
              <View style={styles.mgmtCardBody}>
                <Text style={styles.mgmtCardTitle}>ימי עבודה</Text>
                <Text style={styles.mgmtCardSub}>שיוך צוות וכללי מנוחה</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color="#ccc" style={styles.mgmtCardChevron} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
          ) : (
            <>
              {!isEmployee && (
                <>
                  <Text style={styles.sectionTitle}>בחר איש צוות</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                    {barbers.map((b) => {
                  const isSelected = selectedBarber?.id === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.staffCard, isSelected && styles.staffCardSelected]}
                      onPress={() => setSelectedBarber(b)}
                    >
                      <View style={styles.staffAvatar}>
                        <Ionicons name="person" size={28} color="#999" />
                      </View>
                      <Text style={[styles.staffName, isSelected && styles.staffNameSelected]} numberOfLines={1}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                  </ScrollView>
                </>
              )}

              <Text style={styles.sectionTitle}>בחר יום</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                {days.slice(0, 7).map((date) => {
                  const dateStr = toLocalDateStr(date);
                  const isSelected = toLocalDateStr(selectedDate) === dateStr;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{date.getDate()}</Text>
                      <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                        {getDayLabel(date)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.dayCard}
                  onPress={() => setSelectedDate(days[days.length - 1])}
                >
                  <Text style={styles.dayLabel}>אחר</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.contentArea}>
                {!selectedDate ? (
                  <Text style={styles.noSelectionText}>לא נבחר יום</Text>
                ) : appointments.length === 0 ? (
                  <Text style={styles.emptyText}>אין תורים ל{selectedBarber?.name || ''} ביום זה</Text>
                ) : (
                  appointments.map((apt) => (
                    <View key={apt.id} style={styles.aptCard}>
                      <TouchableOpacity
                        style={styles.aptMenuBtn}
                        onPress={() => {
                          setSelectedApt(apt);
                          setAptMenuVisible(true);
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                      </TouchableOpacity>
                      <View style={styles.aptMain}>
                        <Text style={styles.aptTimeRange}>
                          {formatTimeRange(apt.time, apt.duration)}
                        </Text>
                        <Text style={styles.aptName}>{apt.client_name || 'לקוח'}</Text>
                        <Text style={styles.aptService}>מגיע ל{apt.service_name || 'טיפול'}</Text>
                      </View>
                      <View style={styles.aptAvatar}>
                        <Ionicons name="person" size={24} color="#999" />
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {activeTab === 'appointments' && (
        <TouchableOpacity style={styles.fab} onPress={openAddAppointment} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={aptMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAptMenuVisible(false)}>
          <View style={styles.aptMenuCard} onStartShouldSetResponder={() => true}>
            {selectedApt && (
              <>
                <View style={styles.aptMenuHeader}>
                  <View style={styles.aptMenuAvatar}>
                    <Ionicons name="person" size={32} color="#999" />
                  </View>
                  <Text style={styles.aptMenuTitle}>{selectedApt.client_name || 'לקוח'}</Text>
                </View>
                {(selectedApt._isBlocked
                  ? [{ id: 'delete', label: 'הסר חסימה', icon: 'lock-open' }]
                  : APT_ACTIONS
                ).map((a) => (
                  <TouchableOpacity key={a.id} style={styles.aptMenuItem} onPress={() => handleAptAction(a.id, selectedApt)}>
                    <Ionicons name={a.icon} size={22} color="#333" />
                    <Text style={styles.aptMenuLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalCard}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>הוספת תור</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.addModalClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.addModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.addModalSection}>
                <Text style={styles.addModalLabel}>פרטי הלקוח</Text>
                <TextInput style={styles.formInput} placeholder="שם הלקוח" value={addForm.clientName} onChangeText={(t) => setAddForm((f) => ({ ...f, clientName: t }))} placeholderTextColor="#999" />
                <TextInput style={styles.formInput} placeholder="טלפון" value={addForm.clientPhone} onChangeText={(t) => setAddForm((f) => ({ ...f, clientPhone: t }))} keyboardType="phone-pad" placeholderTextColor="#999" />
              </View>
              <View style={styles.addModalSection}>
                <Text style={styles.addModalLabel}>טיפול</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {services.map((s) => (
                    <TouchableOpacity key={s.id} style={[styles.addModalChip, addForm.serviceId === s.id && styles.addModalChipSel]} onPress={() => setAddForm((f) => ({ ...f, serviceId: s.id }))}>
                      <Text style={addForm.serviceId === s.id ? styles.addModalChipTextSel : styles.addModalChipText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.addModalSection}>
                <Text style={styles.addModalLabel}>תאריך</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {availableDays.map((d) => {
                const ds = toLocalDateStr(d);
                const sel = toLocalDateStr(addForm.date) === ds;
                const slots = getAvailableTimeSlots(d);
                return (
                  <TouchableOpacity
                    key={ds}
                    style={[styles.addModalChip, styles.addModalDayChip, sel && styles.addModalChipSel]}
                    onPress={() => {
                      const validTime = slots.includes(addForm.time) ? addForm.time : slots[0];
                      setAddForm((f) => ({ ...f, date: d, time: validTime || f.time }));
                    }}
                  >
                    <Text style={[styles.addModalDayNum, sel && styles.addModalChipTextSel]}>{d.getDate()}</Text>
                    <Text style={sel ? styles.addModalChipTextSel : styles.addModalChipText}>{getDayLabel(d)}</Text>
                  </TouchableOpacity>
                );
              })}
                </ScrollView>
              </View>
              <View style={styles.addModalSection}>
                <Text style={styles.addModalLabel}>שעה</Text>
                {availableTimeSlots.length === 0 ? (
                  <Text style={styles.formHint}>אין שעות פנויות ליום זה</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {availableTimeSlots.map((t) => (
                      <TouchableOpacity key={t} style={[styles.addModalChip, addForm.time === t && styles.addModalChipSel]} onPress={() => setAddForm((f) => ({ ...f, time: t }))}>
                        <Text style={addForm.time === t ? styles.addModalChipTextSel : styles.addModalChipText}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>
            <View style={styles.addModalFooter}>
              <TouchableOpacity style={styles.addModalBtnCancel} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.addModalBtnCancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addModalBtnSave} onPress={saveAddAppointment}>
                <Text style={styles.addModalBtnSaveText}>הוסף תור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rescheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>החלפת תור</Text>
            <Text style={styles.formLabel}>תאריך חדש</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableDays().map((d) => {
                const ds = toLocalDateStr(d);
                const sel = toLocalDateStr(rescheduleForm.date) === ds;
                const slots = getAvailableTimeSlots(d);
                const validTime = slots.includes(rescheduleForm.time) ? rescheduleForm.time : slots[0];
                return (
                  <TouchableOpacity key={ds} style={[styles.dayChip, sel && styles.dayChipSel]} onPress={() => setRescheduleForm((f) => ({ ...f, date: d, time: validTime || f.time }))}>
                    <Text style={sel ? styles.dayChipTextSel : styles.dayChipText}>{getDayLabel(d)} {d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.formLabel}>שעה חדשה</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 80 }}>
              {getAvailableTimeSlots(rescheduleForm.date).map((t) => (
                <TouchableOpacity key={t} style={[styles.timeChip, rescheduleForm.time === t && styles.timeChipSel]} onPress={() => setRescheduleForm((f) => ({ ...f, time: t }))}>
                  <Text style={rescheduleForm.time === t ? styles.timeChipTextSel : styles.timeChipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.formBtnCancel} onPress={() => { setRescheduleModalVisible(false); setSelectedApt(null); }}><Text>ביטול</Text></TouchableOpacity>
              <TouchableOpacity style={styles.formBtnSave} onPress={saveReschedule}><Text style={styles.formBtnSaveText}>שמור</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setDetailsModalVisible(false); setSelectedApt(null); }}>
          <View style={styles.formModalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.formModalTitle}>תיעוד לקוח</Text>
            {selectedApt && (
              <>
                <Text style={styles.detailRow}>שם: {selectedApt.client_name || '—'}</Text>
                <Text style={styles.detailRow}>טלפון: {selectedApt.client_phone || '—'}</Text>
                <Text style={styles.detailRow}>טיפול: {selectedApt.service_name || '—'}</Text>
                <Text style={styles.detailRow}>תאריך: {selectedApt.date}</Text>
                <Text style={styles.detailRow}>שעה: {(selectedApt.time || '').toString().slice(0, 5)}</Text>
                <TouchableOpacity style={styles.formBtnSave} onPress={() => { setDetailsModalVisible(false); setSelectedApt(null); }}><Text style={styles.formBtnSaveText}>סגור</Text></TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={blockModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>חסימת תור</Text>
            <Text style={styles.formLabel}>ספר</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {barbers.map((b) => (
                <TouchableOpacity key={b.id} style={[styles.serviceChip, blockForm.barberId === b.id && styles.serviceChipSel]} onPress={() => setBlockForm((f) => ({ ...f, barberId: b.id }))}>
                  <Text style={blockForm.barberId === b.id ? styles.serviceChipTextSel : styles.serviceChipText}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.formLabel}>תאריך</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableDays().map((d) => {
                const ds = toLocalDateStr(d);
                const sel = toLocalDateStr(blockForm.date) === ds;
                const slots = getAvailableTimeSlots(d);
                const validTime = slots.includes(blockForm.time) ? blockForm.time : slots[0];
                return (
                  <TouchableOpacity key={ds} style={[styles.dayChip, sel && styles.dayChipSel]} onPress={() => setBlockForm((f) => ({ ...f, date: d, time: validTime || f.time }))}>
                    <Text style={sel ? styles.dayChipTextSel : styles.dayChipText}>{getDayLabel(d)} {d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.formLabel}>שעה</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 80 }}>
              {getAvailableTimeSlots(blockForm.date).map((t) => (
                <TouchableOpacity key={t} style={[styles.timeChip, blockForm.time === t && styles.timeChipSel]} onPress={() => setBlockForm((f) => ({ ...f, time: t }))}>
                  <Text style={blockForm.time === t ? styles.timeChipTextSel : styles.timeChipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.formBtnCancel} onPress={() => setBlockModalVisible(false)}><Text>ביטול</Text></TouchableOpacity>
              <TouchableOpacity style={styles.formBtnSave} onPress={saveBlockSlot}><Text style={styles.formBtnSaveText}>חסום</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={publishModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>הודעה ללקוחות</Text>
            <Text style={styles.formLabel}>כותרת</Text>
            <TextInput style={styles.formInput} placeholder="כותרת ההודעה" value={publishForm.title} onChangeText={(t) => setPublishForm((f) => ({ ...f, title: t }))} placeholderTextColor="#999" />
            <Text style={styles.formLabel}>תוכן (אופציונלי)</Text>
            <TextInput style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="תוכן ההודעה" value={publishForm.body} onChangeText={(t) => setPublishForm((f) => ({ ...f, body: t }))} placeholderTextColor="#999" multiline />
            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.formBtnCancel} onPress={() => setPublishModalVisible(false)}><Text>ביטול</Text></TouchableOpacity>
              <TouchableOpacity style={styles.formBtnSave} onPress={savePublishMessage}><Text style={styles.formBtnSaveText}>פרסם</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerBtn: { padding: 8, minWidth: 40, alignItems: 'center', marginHorizontal: 15 },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerChevron: { marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    direction: 'rtl',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginStart: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: ORANGE },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  tabTextActive: { color: ORANGE, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterChipText: { fontSize: 14, color: '#666' },
  updatesList: { padding: 16, paddingBottom: 80 },
  updateCard: {
    backgroundColor: '#f8f6f1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
  },
  updateBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,107,53,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  updateBadgeText: { fontSize: 11, color: ORANGE, fontWeight: '600' },
  updateText: { fontSize: 15, color: '#333', lineHeight: 22, marginTop: 20 },
  managementContent: { padding: 16, paddingBottom: 100 },
  mgmtStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mgmtStatsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 16,
  },
  mgmtStatsBody: { flex: 1 },
  mgmtStatsNum: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', textAlign: 'right' },
  mgmtStatsLabel: { fontSize: 14, color: '#666', marginTop: 2, textAlign: 'right' },
  mgmtSection: { marginBottom: 24 },
  mgmtSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mgmtSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  mgmtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    direction: 'rtl',
  },
  mgmtCardIcon: { marginEnd: 12 },
  mgmtCardChevron: { marginEnd: 4 },
  mgmtCardBody: { flex: 1 },
  mgmtCardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', textAlign: 'right' },
  mgmtCardSub: { fontSize: 13, color: '#999', marginTop: 2, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 20, marginBottom: 12, textAlign: 'right' },
  horizontalRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  staffCard: { alignItems: 'center', width: 72, padding: 6, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  staffCardSelected: { borderColor: ORANGE, borderWidth: 2 },
  staffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8e4dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  staffName: { fontSize: 13, color: '#333', textAlign: 'center' },
  staffNameSelected: { color: ORANGE, fontWeight: '600' },
  dayCard: {
    minWidth: 58,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e8e4dc',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dayCardSelected: { borderColor: ORANGE, borderWidth: 2 },
  dayLabel: { fontSize: 12, color: '#333', fontWeight: '500', marginTop: 4 },
  dayLabelSelected: { color: ORANGE, fontWeight: '700' },
  dayNum: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  dayNumSelected: { color: ORANGE },
  contentArea: { marginTop: 24, minHeight: 120 },
  noSelectionText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center', marginTop: 24 },
  aptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6f1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  aptMenuBtn: { padding: 4, marginRight: 8 },
  aptMain: { flex: 1 },
  aptTimeRange: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  aptName: { fontSize: 15, color: '#333', fontWeight: '500', marginTop: 4 },
  aptService: { fontSize: 13, color: '#666', marginTop: 2 },
  aptAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e4dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  aptMenuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  aptMenuHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  aptMenuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8e4dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  aptMenuTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  aptMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  aptMenuLabel: { fontSize: 16, color: '#333' },
  formModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  addModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addModalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  addModalClose: { padding: 4 },
  addModalScroll: { maxHeight: 400, paddingHorizontal: 20, paddingTop: 16 },
  addModalSection: { marginBottom: 20 },
  addModalLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, textAlign: 'right' },
  chipRow: { flexDirection: 'row', gap: 10 },
  addModalChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  addModalDayChip: { alignItems: 'center', minWidth: 56 },
  addModalChipSel: { backgroundColor: ORANGE },
  addModalChipText: { fontSize: 15, color: '#333' },
  addModalChipTextSel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  addModalDayNum: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  addModalFooter: {
    flexDirection: 'row-reverse',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addModalBtnCancel: { flex: 1, padding: 14, alignItems: 'center' },
  addModalBtnCancelText: { fontSize: 16, color: '#666' },
  addModalBtnSave: {
    flex: 1,
    backgroundColor: ORANGE,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addModalBtnSaveText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  formModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'right' },
  formInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12, textAlign: 'right' },
  formLabel: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6, textAlign: 'right' },
  serviceScroll: { marginBottom: 8, maxHeight: 50 },
  serviceChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 8 },
  serviceChipSel: { backgroundColor: ORANGE },
  serviceChipText: { fontSize: 14, color: '#333' },
  serviceChipTextSel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 12, marginRight: 8, marginBottom: 8 },
  dayChipSel: { backgroundColor: ORANGE },
  dayChipText: { fontSize: 13, color: '#333' },
  dayChipTextSel: { fontSize: 13, color: '#fff', fontWeight: '600' },
  timeChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 12, marginRight: 8 },
  timeChipSel: { backgroundColor: ORANGE },
  timeChipText: { fontSize: 14, color: '#333' },
  timeChipTextSel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  formBtns: { flexDirection: 'row-reverse', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  formBtnCancel: { padding: 12 },
  formBtnSave: { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  formBtnSaveText: { color: '#fff', fontWeight: '600' },
  detailRow: { fontSize: 16, marginBottom: 8, textAlign: 'right' },
  formHint: { fontSize: 14, color: '#999', marginTop: 8 },
});
