import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  fetchAllBarbers,
  fetchBranches,
  fetchBranchBarbers,
  addBarber,
  addService,
  addBranchBarber,
  removeBranchBarber,
  addBarberRestDay,
  removeBarberRestDay,
  updateService,
} from '../lib/dashboardData';
import { fetchServices } from '../lib/bookingData';
import { supabase } from '../lib/supabase';

const ORANGE = '#FF6B35';
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const formatPhone = (p) => {
  const s = String(p || '').replace(/\D/g, '');
  const digits = s.length > 9 ? s.slice(-9) : s;
  if (digits.length === 9 && digits.startsWith('5')) return `0${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  if (digits.length === 10 && digits.startsWith('05')) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return p;
};

export default function AdminManageScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const type = route.params?.type || 'staff';

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchBarbers, setBranchBarbers] = useState([]);
  const [restDays, setRestDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [addToBranchModal, setAddToBranchModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputDuration, setInputDuration] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const titles = { staff: 'אנשי צוות', services: 'טיפולים', days: 'ימי עבודה' };

  const loadData = async () => {
    setLoading(true);
    try {
      const [barbersData, servicesData, branchesData] = await Promise.all([
        fetchAllBarbers(),
        fetchServices(),
        fetchBranches(),
      ]);
      setBarbers(barbersData);
      setServices(servicesData);
      setBranches(branchesData);

      if (type === 'days') {
        const [bbData, restData] = await Promise.all([
          fetchBranchBarbers(),
          supabase.from('barber_rest_days').select('*'),
        ]);
        setBranchBarbers(bbData || []);
        const byBarber = {};
        ((restData?.data) || []).forEach((r) => {
          if (!byBarber[r.barber_id]) byBarber[r.barber_id] = [];
          byBarber[r.barber_id].push(r);
        });
        setRestDays(byBarber);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  const openAddStaff = () => {
    setEditItem(null);
    setInputName('');
    setInputPhone('');
    setModalVisible(true);
  };

  const openAddService = () => {
    setEditItem(null);
    setInputName('');
    setInputPrice('');
    setInputDuration('');
    setModalVisible(true);
  };

  const saveStaff = async () => {
    if (!inputName.trim()) return Alert.alert('נא להזין שם');
    const result = await addBarber(inputName.trim(), inputPhone.trim() || null);
    if (result) {
      setModalVisible(false);
      loadData();
    } else Alert.alert('שגיאה', 'לא הצלחנו להוסיף');
  };

  const saveService = async () => {
    if (!inputName.trim()) return Alert.alert('נא להזין שם');
    const price = parseInt(inputPrice, 10);
    const duration = parseInt(inputDuration, 10);
    if (isNaN(price) || price < 0) return Alert.alert('נא להזין מחיר תקין');
    if (isNaN(duration) || duration <= 0) return Alert.alert('נא להזין משך בדקות (למשל 40)');
    if (editItem) {
      const ok = await updateService(editItem.id, { name: inputName.trim(), price, duration });
      if (ok) {
        setModalVisible(false);
        loadData();
      }
    } else {
      const result = await addService(inputName.trim(), price, duration);
      if (result) {
        setModalVisible(false);
        loadData();
      } else Alert.alert('שגיאה', 'לא הצלחנו להוסיף');
    }
  };

  const addRestDay = async (barberId, day) => {
    const { error } = await supabase.from('barber_rest_days').insert({ barber_id: barberId, day_of_week: day });
    if (!error) loadData();
  };

  const removeRestDay = async (id) => {
    await removeBarberRestDay(id);
    loadData();
  };

  const handleRemoveFromBranch = (bbId) => {
    Alert.alert('הסר מסניף', 'להסיר את איש הצוות מהסניף?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => removeBranchBarber(bbId).then((ok) => ok && loadData()) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard', { openTab: 'management' })} style={[styles.headerBtn, { marginLeft: 15 }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{titles[type] || type}</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer?.()} style={[styles.headerBtn, { marginRight: 15 }]}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        {type === 'staff' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openAddStaff}>
              <Ionicons name="add" size={24} color={ORANGE} />
              <Text style={styles.addBtnText}>הוסף איש צוות</Text>
            </TouchableOpacity>
            {barbers.map((b) => (
              <View key={b.id} style={styles.listItem}>
                <View style={styles.listItemMain}>
                  <Text style={styles.listItemText}>{b.name}</Text>
                  {b.phone ? (
                    <Text style={styles.listItemPhone}>{formatPhone(b.phone)}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        )}

        {type === 'services' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openAddService}>
              <Ionicons name="add" size={24} color={ORANGE} />
              <Text style={styles.addBtnText}>הוסף טיפול</Text>
            </TouchableOpacity>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.listItem}
                onPress={() => {
                  setEditItem(s);
                  setInputName(s.name);
                  setInputPrice(String(s.price));
                  setInputDuration(String(s.duration));
                  setModalVisible(true);
                }}
              >
                <Text style={styles.listItemText}>{s.name}</Text>
                <Text style={styles.listItemSub}>₪{s.price} • {s.duration} דק׳</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {type === 'days' && (
          <>
            <View style={styles.daysSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={22} color={ORANGE} />
                <Text style={styles.sectionTitleBig}>צוות לפי סניף</Text>
              </View>
              {branches.map((branch) => {
                const assigned = branchBarbers.filter((bb) => bb.branch_id === branch.id);
                const barberIds = assigned.map((bb) => bb.barber_id);
                const barberNames = assigned.map((bb) => {
                  const b = barbers.find((x) => x.id === bb.barber_id);
                  return { id: bb.id, name: b?.name || '—' };
                });
                return (
                  <View key={branch.id} style={styles.branchCard}>
                    <View style={styles.branchCardHeader}>
                      <Ionicons name="storefront" size={20} color="#333" />
                      <Text style={styles.branchCardTitle}>{branch.name}</Text>
                    </View>
                    <View style={styles.branchBarbersList}>
                      {barberNames.length === 0 ? (
                        <Text style={styles.emptyBranchText}>אין צוות משויך</Text>
                      ) : (
                        barberNames.map(({ id, name }) => (
                          <View key={id} style={styles.branchBarberChip}>
                            <Text style={styles.branchBarberName}>{name}</Text>
                            <TouchableOpacity onPress={() => handleRemoveFromBranch(id)} style={styles.removeChipBtn}>
                              <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.addToBranchBtn}
                      onPress={() => {
                        setSelectedBranch(branch);
                        setAddToBranchModal(true);
                      }}
                    >
                      <Ionicons name="person-add" size={18} color={ORANGE} />
                      <Text style={styles.addToBranchBtnText}>הוסף צוות</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.daysSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={22} color={ORANGE} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleBig}>ימי עבודה</Text>
                  <Text style={styles.sectionSub}>לחץ על יום לשינוי • ירוק = עובד, אפור = מנוחה</Text>
                </View>
              </View>
              {barbers.map((barber) => {
                const rests = restDays[barber.id] || [];
                const workDays = 7 - rests.length;
                return (
                  <View key={barber.id} style={styles.barberScheduleCard}>
                    <View style={styles.barberScheduleHeader}>
                      <View style={styles.barberAvatar}>
                        <Ionicons name="person" size={24} color="#666" />
                      </View>
                      <View style={styles.barberScheduleInfo}>
                        <Text style={styles.barberScheduleName}>{barber.name}</Text>
                        <Text style={styles.barberScheduleSummary}>
                          עובד {workDays} ימים {rests.length > 0 ? `• מנוחה: ${rests.map((r) => DAYS[r.day_of_week]).join(', ')}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weekGrid}>
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                        const rest = rests.find((r) => r.day_of_week === d);
                        const isRest = !!rest;
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[styles.weekDay, isRest ? styles.weekDayRest : styles.weekDayWork]}
                            onPress={() => (isRest ? removeRestDay(rest.id) : addRestDay(barber.id, d))}
                          >
                            <Text style={[styles.weekDayLabel, isRest && styles.weekDayLabelRest]}>{DAYS[d].slice(0, 2)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            <Modal visible={addToBranchModal} transparent animationType="slide">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddToBranchModal(false)}>
                <View style={styles.addToBranchModal} onStartShouldSetResponder={() => true}>
                  <Text style={styles.addToBranchModalTitle}>הוסף צוות ל{selectedBranch?.name || ''}</Text>
                  <ScrollView style={styles.addToBranchModalList}>
                    {barbers
                      .filter((b) => !branchBarbers.some((bb) => bb.branch_id === selectedBranch?.id && bb.barber_id === b.id))
                      .length === 0 ? (
                      <Text style={styles.emptyBranchText}>כל אנשי הצוות כבר משויכים</Text>
                    ) : (
                      barbers
                        .filter((b) => !branchBarbers.some((bb) => bb.branch_id === selectedBranch?.id && bb.barber_id === b.id))
                        .map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          style={styles.addToBranchOption}
                          onPress={() => {
                            addBranchBarber(selectedBranch.id, b.id).then((ok) => {
                              if (ok) {
                                setAddToBranchModal(false);
                                loadData();
                              }
                            });
                          }}
                        >
                          <Text style={styles.addToBranchOptionText}>{b.name}</Text>
                          <Ionicons name="add-circle-outline" size={22} color={ORANGE} />
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                  <TouchableOpacity style={styles.addToBranchModalClose} onPress={() => setAddToBranchModal(false)}>
                    <Text style={styles.addToBranchModalCloseText}>ביטול</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {type === 'staff' ? 'הוסף איש צוות' : editItem ? 'ערוך טיפול' : 'הוסף טיפול'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="שם"
              value={inputName}
              onChangeText={setInputName}
              placeholderTextColor="#999"
            />
            {(type === 'staff') && (
              <TextInput
                style={styles.input}
                placeholder="מספר טלפון (להתחברות כעובד)"
                value={inputPhone}
                onChangeText={setInputPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            )}
            {(type === 'services') && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="מחיר"
                  value={inputPrice}
                  onChangeText={setInputPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="משך (דקות)"
                  value={inputDuration}
                  onChangeText={setInputDuration}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                <Text>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={type === 'staff' ? saveStaff : saveService}
              >
                <Text style={styles.modalBtnSaveText}>שמור</Text>
              </TouchableOpacity>
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
  headerBtn: { padding: 8, minWidth: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: ORANGE,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
  listItem: {
    padding: 16,
    backgroundColor: '#f8f6f1',
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemMain: { alignItems: 'flex-end' },
  listItemText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'right' },
  listItemPhone: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'right' },
  listItemSub: { fontSize: 14, color: '#666', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { marginBottom: 8 },
  chipScroll: { maxHeight: 50 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: ORANGE },
  daysSection: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, direction: 'rtl' },
  sectionTitleBig: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  sectionSub: { fontSize: 12, color: '#999', marginTop: 2 },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  branchCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  branchCardTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  branchBarbersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emptyBranchText: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  branchBarberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    direction: 'rtl',
  },
  branchBarberName: { fontSize: 15, fontWeight: '600', color: '#333' },
  removeChipBtn: { padding: 4 },
  addToBranchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: ORANGE,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addToBranchBtnText: { fontSize: 15, fontWeight: '600', color: ORANGE },
  barberScheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  barberScheduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  barberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 12,
  },
  barberScheduleInfo: { flex: 1 },
  barberScheduleName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  barberScheduleSummary: { fontSize: 13, color: '#666', marginTop: 2, textAlign: 'right' },
  weekGrid: { flexDirection: 'row', gap: 8 },
  weekDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayWork: { backgroundColor: 'rgba(39, 174, 96, 0.2)' },
  weekDayRest: { backgroundColor: 'rgba(149, 165, 166, 0.3)' },
  weekDayLabel: { fontSize: 12, fontWeight: '700', color: '#27ae60' },
  weekDayLabelRest: { color: '#7f8c8d', fontWeight: '500' },
  addToBranchModal: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 120,
    borderRadius: 20,
    padding: 24,
    maxHeight: 400,
  },
  addToBranchModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  addToBranchModalList: { maxHeight: 280 },
  addToBranchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addToBranchOptionText: { fontSize: 16, fontWeight: '500', color: '#333', textAlign: 'right' },
  addToBranchModalClose: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  addToBranchModalCloseText: { fontSize: 16, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtnCancel: { padding: 12 },
  modalBtnSave: { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  modalBtnSaveText: { color: '#fff', fontWeight: '600' },
});
