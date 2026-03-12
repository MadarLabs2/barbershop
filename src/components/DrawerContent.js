import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentsContext';
import { useNotifications } from '../context/NotificationsContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב,';
  if (h < 17) return 'אחר הצהריים טובים,';
  return 'ערב טוב,';
};

export default function DrawerContent(props) {
  const { user, isLoggedIn, logout } = useAuth();
  const { getUpcomingAppointments } = useAppointments();
  const { unreadCount: notificationsUnreadCount, refreshUnreadCount } = useNotifications();
  const drawerStatus = useDrawerStatus();
  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    if (drawerStatus === 'open') refreshUnreadCount();
  }, [drawerStatus, refreshUnreadCount]);
  const isEmployee = !!(user?.barberId && !user?.isAdmin);

  const openDashboard = () => {
    props.navigation.closeDrawer();
    props.navigation.navigate('Dashboard');
  };
  const upcomingCount = getUpcomingAppointments?.()?.length ?? 0;

  const menuItems = [
    ...(isAdmin ? [{ id: '0', title: 'דשבורד מנהל', icon: 'grid-outline', target: { isDashboard: true } }] : []),
    ...(isEmployee ? [{ id: '0b', title: 'התורים שלי', icon: 'calendar-outline', target: { isDashboard: true } }] : []),
    { id: '1', title: 'ראשי', icon: 'home', target: { name: 'Home' } },
    { id: '2', title: 'הצוות שלנו', icon: 'people', target: null },
    { id: '3', title: 'הזמנת תור', icon: 'calendar', target: { name: 'Booking' } },
    { id: '4', title: 'התורים שלך', icon: 'list', target: { name: 'Appointments' }, badge: upcomingCount > 0 ? upcomingCount : null },
    { id: '5', title: 'איך מגיעים', icon: 'location', target: null },
    { id: '6', title: 'ההתראות שלך', icon: 'notifications', target: { name: 'Notifications' }, badge: notificationsUnreadCount > 0 ? notificationsUnreadCount : null },
    { id: '7', title: 'הגדרות', icon: 'settings', target: { name: 'Settings' } },
  ];
  if (isLoggedIn) {
    menuItems.push({ id: '8', title: 'התנתק', icon: 'log-out', target: { isLogout: true } });
  }

  const handleNavigation = async (target) => {
    if (!target) return;
    if (target.isLogout) {
      await logout();
      props.navigation.closeDrawer();
      return;
    }
    if (target.isDashboard) {
      openDashboard();
      return;
    }
    const drawerNav = props.navigation;
    const needsAuth = target.name === 'Booking' || target.name === 'Appointments' || target.name === 'Notifications';
    if (needsAuth && !isLoggedIn) {
      drawerNav.closeDrawer();
      drawerNav.navigate('Login');
      return;
    }
    drawerNav.navigate(target.name, target.params);
    drawerNav.closeDrawer();
  };

  const closeDrawer = () => props.navigation.closeDrawer();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {(isAdmin || isEmployee) ? (
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={openDashboard}
            activeOpacity={0.7}
          >
            <Ionicons name={isAdmin ? 'grid-outline' : 'calendar-outline'} size={24} color="#c9a227" />
            <Text style={styles.dashboardButtonText}>{isAdmin ? 'דשבורד' : 'התורים שלי'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarSpacer} />
        )}
        <View style={styles.topBarSpacer} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeDrawer}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        {isLoggedIn ? (
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color="#999" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.greeting}>שלום אורח</Text>
            <TouchableOpacity
              style={styles.loginPrompt}
              onPress={() => {
                props.navigation.closeDrawer();
                props.navigation.navigate('Login');
              }}
            >
              <Text style={styles.loginPromptText}>לחץ להתחברות או הרשמה</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index === 4 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation(item.target)}
            >
              <View style={styles.menuItemLeft}>
                {item.badge !== undefined && item.badge !== null ? (
                  <View style={styles.iconWithBadge}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={item.id === '8' ? '#ff4444' : (item.id === '0' || item.id === '0b') ? '#c9a227' : '#000'}
                    />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  </View>
                ) : (
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={item.id === '8' ? '#ff4444' : (item.id === '0' || item.id === '0b') ? '#c9a227' : '#000'}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.menuItemText,
                  item.id === '8' && styles.menuItemTextLogout,
                  (item.id === '0' || item.id === '0b') && styles.menuItemTextDashboard,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Ionicons name="time" size={20} color="#000" />
        <Text style={styles.logoText}>VertexTech</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBarSpacer: { flex: 1 },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9a227',
  },
  closeButton: {
    padding: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  menu: {
    flex: 1,
  },
  menuContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    marginLeft: 12,
  },
  iconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  menuItemText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    textAlign: 'right',
  },
  menuItemTextLogout: {
    color: '#ff4444',
  },
  menuItemTextDashboard: {
    color: '#c9a227',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 6,
  },
});
