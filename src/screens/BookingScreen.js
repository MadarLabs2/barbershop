import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useAppointments } from '../context/AppointmentsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchBranches, fetchBarbersForBranch, fetchServices, addToWaitlist } from '../lib/bookingData';

const ALLOWED_SERVICES = ['תספורת', 'תספורת וזקן'];

const OPEN_HOUR = 9;
const CLOSE_HOUR = 19;
const SLOT_INTERVAL = 40;

const generateTimeSlots = () => {
  const slots = [];
  let mins = OPEN_HOUR * 60;
  const endMins = CLOSE_HOUR * 60;
  while (mins < endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    mins += SLOT_INTERVAL;
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const FALLBACK_BRANCH = { id: 'a0000001-0000-0000-0000-000000000001', name: 'דיר אל אסד' };
const FALLBACK_BARBER = { id: 'b0000001-0000-0000-0000-000000000001', name: 'מוחמד מוסא' };
const FALLBACK_SERVICES = [
  { id: 'c0000001-0000-0000-0000-000000000001', name: 'תספורת', price: 60, duration: 40 },
  { id: 'c0000002-0000-0000-0000-000000000002', name: 'תספורת וזקן', price: 70, duration: 40 },
];

const GOLD = '#c9a227';

export default function BookingScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addAppointment, isSlotBooked, fetchBookedSlots } = useAppointments();
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistPrefMorning, setWaitlistPrefMorning] = useState(false);
  const [waitlistPrefAfternoon, setWaitlistPrefAfternoon] = useState(false);
  const [waitlistPrefEvening, setWaitlistPrefEvening] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [branchesData, servicesData] = await Promise.all([
          fetchBranches(),
          fetchServices(),
        ]);
        const brs = branchesData?.length ? branchesData : [FALLBACK_BRANCH];
        setBranches(brs);
        const filtered = (servicesData || []).filter((s) => ALLOWED_SERVICES.includes(s.name));
        setServices(filtered.length ? filtered : FALLBACK_SERVICES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!branch?.id) {
      setBarbers([]);
      setBarber(null);
      return;
    }
    (async () => {
      const barbersData = await fetchBarbersForBranch(branch.id);
      const brsList = barbersData?.length ? barbersData : [FALLBACK_BARBER];
      setBarbers(brsList);
      setBarber(null);
      setSelectedDate(null);
      setSelectedTime(null);
    })();
  }, [branch?.id]);

  useEffect(() => {
    if (barber?.id && branch?.id) {
      fetchBookedSlots?.(barber.id, branch.id);
    }
  }, [barber?.id, branch?.id]);

  const refetchSlots = () => {
    fetchBookedSlots?.(barber?.id, branch?.id);
  };

  const getNext7Days = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const hasAvailableSlot = TIME_SLOTS.some((time) => {
        const inPast = isToday && isTimeSlotInPast(date, time);
        return !inPast && !isSlotBooked(date, time);
      });
      days.push({ date, hasAvailableSlot });
    }
    return days;
  };

  const getAvailableTimeSlots = (date) => {
    if (!date) return [];
    return TIME_SLOTS.filter((time) => {
      const inPast = isTimeSlotInPast(date, time);
      return !inPast && !isSlotBooked(date, time);
    });
  };

  const isTimeSlotAvailable = (date, time) => !isSlotBooked(date, time);

  const isTimeSlotInPast = (date, time) => {
    if (!date) return false;
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    if (!isToday) return false;
    const [h, m] = time.split(':').map(Number);
    const nowMins = today.getHours() * 60 + today.getMinutes();
    const slotMins = h * 60 + m;
    return slotMins <= nowMins;
  };

  const handleConfirm = () => {
    if (!branch || !barber) {
      Alert.alert('שגיאה', 'אנא בחר סניף ואיש צוות');
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('שגיאה', 'אנא מלא את כל הפרטים');
      return;
    }

    const service = services.find((s) => s.id === selectedService);
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (isTimeSlotInPast(selectedDate, selectedTime)) {
      Alert.alert('שגיאה', 'השעה שבחרת כבר עברה, אנא בחר שעה אחרת');
      return;
    }
    if (!isTimeSlotAvailable(selectedDate, selectedTime)) {
      Alert.alert('שגיאה', 'הזמן הזה תפוס, אנא בחר זמן אחר');
      return;
    }

    const isUuid = (s) => s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s));
    addAppointment({
      service: service.name,
      price: service.price,
      barber: barber.name,
      branch: branch.name,
      branchId: isUuid(branch.id) ? branch.id : null,
      barberId: isUuid(barber.id) ? barber.id : null,
      serviceId: isUuid(service.id) ? service.id : null,
      date: dateStr,
      time: selectedTime,
      duration: service.duration,
    });

    setShowConfirmModal(false);
    Alert.alert('הצלחה', 'התור נקבע בהצלחה!', [
      {
        text: 'אישור',
        onPress: () => {
          navigation.navigate('Appointments');
          setSelectedService(null);
          setSelectedDate(null);
          setSelectedTime(null);
        },
      },
    ]);
  };

  const canProceedToTime = () => {
    return branch && barber && selectedService && selectedDate;
  };

  const openWaitlistModal = () => {
    if (!user?.phone) {
      Alert.alert('נדרשת התחברות', 'יש להתחבר כדי להיכנס לרשימת המתנה');
      return;
    }
    setWaitlistPrefMorning(false);
    setWaitlistPrefAfternoon(false);
    setWaitlistPrefEvening(false);
    setShowTimeModal(false);
    setTimeout(() => setShowWaitlistModal(true), 350);
  };

  const handleWaitlistConfirm = async () => {
    if (!waitlistPrefMorning && !waitlistPrefAfternoon && !waitlistPrefEvening) {
      Alert.alert('בחר אפשרות', 'יש לבחור לפחות משמרת אחת');
      return;
    }
    if (!barber?.id || !user?.phone) {
      Alert.alert('נדרשת התחברות', 'יש להתחבר כדי להיכנס לרשימת המתנה');
      return;
    }
    const service = services.find((s) => s.id === selectedService);
    const clientName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    const dateStr = selectedDate?.toISOString?.()?.split?.('T')?.[0] || null;
    const ok = await addToWaitlist({
      barberId: barber.id,
      clientPhone: user.phone,
      clientName: clientName || 'לקוח',
      serviceName: service?.name || 'טיפול',
      preferredDate: dateStr,
      preferMorning: waitlistPrefMorning,
      preferAfternoon: waitlistPrefAfternoon,
      preferEvening: waitlistPrefEvening,
    });
    setShowWaitlistModal(false);
    setShowTimeModal(false);
    Alert.alert(
      ok ? 'נרשמת לרשימת המתנה' : 'שגיאה',
      ok ? 'כשתיפתח תור מתאים תקבל התראה ותוכל לקבוע את התור מחדש' : 'לא הצלחנו להוסיף'
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Branch Selection */}
        <View style={styles.selectionBlock}>
          <Text style={styles.selectionLabel}>סניף</Text>
          <TouchableOpacity
            style={styles.selectionPill}
            onPress={() => setShowBranchModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#888" style={styles.selectionIcon} />
            <Text style={[styles.selectionValue, !branch && styles.selectionValuePlaceholder]} numberOfLines={1}>
              {branch ? branch.name : 'בחר סניף'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barber Selection */}
        <View style={styles.selectionBlock}>
          <Text style={styles.selectionLabel}>איש צוות</Text>
          <TouchableOpacity
            style={[styles.selectionPill, !branch && styles.selectionPillDisabled]}
            onPress={() => setShowBarberModal(true)}
            disabled={!branch}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#888" style={styles.selectionIcon} />
            <Text style={[styles.selectionValue, barber && styles.barberName, !barber && styles.selectionValuePlaceholder]} numberOfLines={1}>
              {barber ? barber.name : 'בחר איש צוות'}
            </Text>
            {barber && (
              <View style={styles.selectionAvatar}>
                {barber.avatar ? (
                  <Image source={{ uri: barber.avatar }} style={styles.selectionAvatarImage} />
                ) : (
                  <Ionicons name="person" size={18} color="#666" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Service Selection */}
        <View style={styles.selectionBlock}>
          <Text style={styles.selectionLabel}>טיפול</Text>
          <TouchableOpacity
            style={styles.selectionPill}
            onPress={() => setShowServiceModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#888" style={styles.selectionIcon} />
            <Text style={[styles.selectionValue, !selectedService && styles.selectionValuePlaceholder]} numberOfLines={1}>
              {selectedService
                ? services.find((s) => s.id === selectedService)?.name
                : 'בחר טיפול'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.selectionBlock}>
          <Text style={styles.selectionLabel}>יום</Text>
          <TouchableOpacity
            style={styles.selectionPill}
            onPress={() => {
              refetchSlots();
              setShowDateModal(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#888" style={styles.selectionIcon} />
            <Text style={[styles.selectionValue, !selectedDate && styles.selectionValuePlaceholder]} numberOfLines={1}>
              {selectedDate
                ? selectedDate.toLocaleDateString('he-IL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'numeric',
                  })
                : 'בחר יום'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.selectionBlock}>
          <Text style={styles.selectionLabel}>שעה</Text>
          <TouchableOpacity
            style={[styles.selectionPill, !canProceedToTime() && styles.selectionPillDisabled]}
            onPress={() => {
              if (canProceedToTime()) {
                refetchSlots();
                setShowTimeModal(true);
              }
            }}
            disabled={!canProceedToTime()}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color="#888" style={styles.selectionIcon} />
            <Text style={[
              styles.selectionValue,
              (!canProceedToTime() || !selectedTime) && styles.selectionValuePlaceholder,
            ]} numberOfLines={1}>
              {selectedTime || 'בחירת תור'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        {selectedService &&
          selectedDate &&
          selectedTime && (
            <View style={styles.confirmButtonWrap}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowConfirmModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonText}>לחץ להזמנת התור</Text>
              </TouchableOpacity>
            </View>
          )}
      </ScrollView>

      {/* Branch Modal */}
      <Modal
        visible={showBranchModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowBranchModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBranchModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowBranchModal(false)}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחירת סניף</Text>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.choiceCard,
                    branch?.id === b.id && styles.choiceCardSelected,
                  ]}
                  onPress={() => {
                    setBranch(b);
                    setShowBranchModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.choiceCardText,
                      branch?.id === b.id && styles.choiceCardTextSelected,
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Barber Modal */}
      <Modal
        visible={showBarberModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowBarberModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBarberModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowBarberModal(false)}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחירת איש צוות</Text>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
              {barbers.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.barberChoiceCard,
                    barber?.id === b.id && styles.choiceCardSelected,
                  ]}
                  onPress={() => {
                    setBarber(b);
                    setShowBarberModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.barberAvatar}>
                    <Ionicons name="person" size={22} color="#888" />
                  </View>
                  <Text
                    style={[
                      styles.choiceCardText,
                      barber?.id === b.id && styles.choiceCardTextSelected,
                      { flex: 1, marginLeft: 14, textAlign: 'right' },
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowServiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowServiceModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowServiceModal(false)}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחירת טיפול</Text>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceChoiceCard,
                    selectedService === service.id && styles.choiceCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedService(service.id);
                    setShowServiceModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.choiceCardText,
                      selectedService === service.id && styles.choiceCardTextSelected,
                    ]}
                  >
                    {service.name}
                  </Text>
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>₪{service.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDateModal(false)}
            >
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחירת יום</Text>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {getNext7Days().map(({ date, hasAvailableSlot }) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr;
                const isUnavailable = !hasAvailableSlot;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.choiceCard,
                      isSelected && styles.choiceCardSelected,
                      isUnavailable && styles.choiceCardUnavailable,
                    ]}
                    onPress={() => {
                      if (!hasAvailableSlot) return;
                      setSelectedDate(date);
                      setShowDateModal(false);
                    }}
                    disabled={isUnavailable}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.choiceCardText,
                        isSelected && styles.choiceCardTextSelected,
                        isUnavailable && styles.choiceCardTextUnavailable,
                      ]}
                    >
                      {date.toLocaleDateString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'numeric',
                        year: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.sheetNote}>* ימים ללא תורים פנויים מסומנים באדום</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowTimeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimeModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.bottomSheet}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowTimeModal(false)}
            >
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>בחירת תור</Text>
            <ScrollView
              style={styles.timesScroll}
              contentContainerStyle={styles.timesScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {getAvailableTimeSlots(selectedDate).length === 0 ? (
                <View style={styles.emptySlotWrap}>
                  <Text style={styles.emptyText}>אין שעות פנויות ביום זה</Text>
                </View>
              ) : (
                getAvailableTimeSlots(selectedDate).map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChoiceCard,
                        isSelected && styles.timeChoiceCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedTime(time);
                        setShowTimeModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.timeChoiceCardText,
                          isSelected && styles.timeChoiceCardTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <View style={styles.waitlistSection}>
              <Text style={styles.waitlistLabel}>לא מצאת תור לזמן שאתה רוצה?</Text>
              <TouchableOpacity
                style={styles.waitlistButton}
                onPress={openWaitlistModal}
                activeOpacity={0.85}
              >
                <Text style={styles.waitlistButtonText}>לחץ לכניסה לרשימת המתנה</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Waitlist Preferences Modal */}
      <Modal
        visible={showWaitlistModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowWaitlistModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWaitlistModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.waitlistPrefSheet}
          >
            <TouchableOpacity
              style={styles.waitlistPrefClose}
              onPress={() => setShowWaitlistModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.waitlistPrefTitle}>אני רוצה לקבל התראה על תור שמתפנה</Text>
            <Text style={styles.waitlistPrefSubtitle}>ניתן לבחור יותר מאפשרות אחת!</Text>
            <View style={styles.waitlistPrefOptions}>
              <TouchableOpacity
                style={[styles.waitlistPrefOption, waitlistPrefMorning && styles.waitlistPrefOptionSelected]}
                onPress={() => setWaitlistPrefMorning((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.waitlistPrefIconWrap, waitlistPrefMorning && styles.waitlistPrefIconWrapSelected]}>
                  <Ionicons name="sunny-outline" size={32} color={waitlistPrefMorning ? '#fff' : '#FF9500'} />
                </View>
                <Text style={styles.waitlistPrefOptionLabel}>בבוקר</Text>
                <Text style={styles.waitlistPrefOptionTime}>(עד 12:00)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.waitlistPrefOption, waitlistPrefAfternoon && styles.waitlistPrefOptionSelected]}
                onPress={() => setWaitlistPrefAfternoon((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.waitlistPrefIconWrap, waitlistPrefAfternoon && styles.waitlistPrefIconWrapSelected]}>
                  <Ionicons name="partly-sunny-outline" size={32} color={waitlistPrefAfternoon ? '#fff' : '#34C759'} />
                </View>
                <Text style={styles.waitlistPrefOptionLabel}>בצהריים</Text>
                <Text style={styles.waitlistPrefOptionTime}>(12:00 – 16:00)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.waitlistPrefOption, waitlistPrefEvening && styles.waitlistPrefOptionSelected]}
                onPress={() => setWaitlistPrefEvening((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.waitlistPrefIconWrap, waitlistPrefEvening && styles.waitlistPrefIconWrapSelected]}>
                  <Ionicons name="moon-outline" size={32} color={waitlistPrefEvening ? '#fff' : '#5856D6'} />
                </View>
                <Text style={styles.waitlistPrefOptionLabel}>בערב</Text>
                <Text style={styles.waitlistPrefOptionTime}>(מ 16:00)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.waitlistPrefConfirmBtn}
              onPress={handleWaitlistConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.waitlistPrefConfirmBtnText}>אישור</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.bottomSheet, styles.confirmBottomSheet]}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowConfirmModal(false)}>
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.confirmModalTitle}>לאישור והזמנת התור</Text>
            <Text style={styles.confirmModalText}>
              {selectedDate &&
                selectedTime &&
                selectedService &&
                `${selectedDate.toLocaleDateString('he-IL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'numeric',
                  year: '2-digit',
                })} בשעה ${selectedTime} ל${services.find((s) => s.id === selectedService)?.name} אצל ${barber?.name ?? ''} בסניף ${branch?.name ?? ''}`}
            </Text>
            <View style={styles.finalConfirmWrap}>
              <TouchableOpacity
                style={styles.finalConfirmButton}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.finalConfirmButtonText}>לחץ להזמנת התור</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  selectionBlock: {
    marginBottom: 18,
    alignSelf: 'center',
    width: '85%',
  },
  selectionLabel: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  selectionPill: {
    minHeight: 52,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  selectionPillDisabled: {
    opacity: 0.5,
  },
  selectionIcon: {
    marginLeft: 10,
  },
  selectionValue: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'right',
  },
  selectionValuePlaceholder: {
    color: '#999',
  },
  barberName: {
    marginRight: 14,
  },
  selectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectionAvatarImage: {
    width: '100%',
    height: '100%',
  },
  confirmButtonWrap: {
    alignItems: 'center',
    marginVertical: 24,
    marginHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '88%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  confirmBottomSheet: {
    maxHeight: '55%',
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 8,
    zIndex: 10,
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetScroll: {
    maxHeight: 360,
  },
  sheetScrollContent: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  choiceCard: {
    width: '55%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  choiceCardSelected: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  choiceCardUnavailable: {
    backgroundColor: '#fff5f5',
    borderColor: '#e8a0a0',
  },
  choiceCardText: {
    fontSize: 15,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
  },
  choiceCardTextSelected: {
    color: GOLD,
    fontWeight: '700',
  },
  choiceCardTextUnavailable: {
    color: '#c44',
    opacity: 0.9,
  },
  barberChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '55%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  barberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '55%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  serviceBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  timesScroll: {
    maxHeight: 380,
  },
  timesScrollContent: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  timeChoiceCard: {
    width: '55%',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  timeChoiceCardSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  timeChoiceCardText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  timeChoiceCardTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  waitlistSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  waitlistLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  waitlistButton: {
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  waitlistButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  sheetNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'left',
    marginTop: 12,
  },
  emptySlotWrap: {
    width: '100%',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
    marginBottom: 20,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
    marginBottom: 30,
    lineHeight: 24,
  },
  finalConfirmWrap: {
    alignItems: 'center',
  },
  finalConfirmButton: {
    backgroundColor: '#000',
    width: '55%',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
    alignItems: 'center',
  },
  finalConfirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  waitlistPrefSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  waitlistPrefClose: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  waitlistPrefTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitlistPrefSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  waitlistPrefOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  waitlistPrefOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  waitlistPrefOptionSelected: {
    borderColor: GOLD,
    backgroundColor: '#fffbf5',
  },
  waitlistPrefIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waitlistPrefIconWrapSelected: {
    backgroundColor: GOLD,
  },
  waitlistPrefOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  waitlistPrefOptionTime: {
    fontSize: 12,
    color: '#888',
  },
  waitlistPrefConfirmBtn: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  waitlistPrefConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
