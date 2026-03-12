import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const TERMS_URL = 'https://example.com/terms';
const PRIVACY_URL = 'https://example.com/privacy';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, logout } = useAuth();

  const displayName = isLoggedIn && user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'משתמש'
    : 'משתמש';

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Home');
  };

  const handleTerms = () => {
    Linking.openURL(TERMS_URL).catch(() =>
      Alert.alert('שגיאה', 'לא ניתן לפתוח את דף תנאי השימוש')
    );
  };

  const handlePrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() =>
      Alert.alert('שגיאה', 'לא ניתן לפתוח את דף מדיניות הפרטיות')
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'מחיקת חשבון',
      'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו לא ניתנת לביטול.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => {
            Alert.alert('מידע', 'מחיקת חשבון דורשת יצירת קשר עם התמיכה.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top, minHeight: insets.top + (Platform.OS === 'ios' ? 44 : 64) }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.headerBtn, styles.headerBtnLeft]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הגדרות</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={[styles.headerBtn, styles.headerBtnRight]}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          {isLoggedIn && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>התנתקות</Text>
            </TouchableOpacity>
          )}

          <View style={styles.generalSection}>
            <Text style={styles.sectionTitle}>כללי</Text>
            <TouchableOpacity style={styles.optionRow} onPress={handleTerms}>
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.optionText}>תנאי שימוש</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handlePrivacy}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
              <Text style={styles.optionText}>מדיניות פרטיות</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleDeleteAccount}>
              <Ionicons name="person-remove-outline" size={24} color="#333" />
              <Text style={[styles.optionText, styles.optionTextDanger]}>מחיקת חשבון</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 0,
    paddingHorizontal: 15,
    backgroundColor: '#000',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnLeft: { marginLeft: 0 },
  headerBtnRight: { marginRight: 0 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutBtn: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
    marginBottom: 32,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generalSection: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'right',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginRight: 12,
  },
  optionTextDanger: {
    color: '#c62828',
  },
});
