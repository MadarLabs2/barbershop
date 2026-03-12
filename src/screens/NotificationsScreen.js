import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { fetchNotifications } from '../lib/notificationsData';

const ORANGE = '#FF6B35';

function formatTime(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return d.toLocaleDateString('he-IL');
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { markAsRead, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userPhone = user?.phone ? String(user.phone).replace(/\D/g, '') : null;

  const load = async () => {
    setLoading(true);
    const data = await fetchNotifications(userPhone);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userPhone]);

  useFocusEffect(
    useCallback(() => {
      if (userPhone) {
        load();
        refreshUnreadCount();
      }
    }, [userPhone, refreshUnreadCount])
  );

  const onNotificationPress = async (n) => {
    await markAsRead(n.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await fetchNotifications(userPhone);
    setNotifications(data);
    setRefreshing(false);
  };

  const getIcon = (type, title) => {
    if (type === 'admin') return 'megaphone';
    if (title?.includes('ביטלת') || title?.includes('בוטל')) return 'close-circle';
    return 'checkmark-circle';
  };

  const getIconColor = (type, title) => {
    if (type === 'admin') return ORANGE;
    if (title?.includes('ביטלת') || title?.includes('בוטל')) return '#e74c3c';
    return '#27ae60';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, minHeight: insets.top + (Platform.OS === 'ios' ? 44 : 64) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { marginLeft: 15 }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ההתראות שלך</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>אין התראות</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {notifications.map((n) => (
            <TouchableOpacity key={n.id} style={styles.card} onPress={() => onNotificationPress(n)} activeOpacity={0.8}>
              <View style={[styles.iconWrap, { backgroundColor: getIconColor(n.type, n.title) + '20' }]}>
                <Ionicons name={getIcon(n.type, n.title)} size={24} color={getIconColor(n.type, n.title)} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                {n.body ? <Text style={styles.cardBodyText}>{n.body}</Text> : null}
                <Text style={styles.cardTime}>{formatTime(n.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: 0,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerBtn: { padding: 8, minWidth: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderRightWidth: 3,
    borderRightColor: ORANGE,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 20,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  cardBodyText: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardTime: { fontSize: 12, color: '#999' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
