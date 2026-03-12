import React from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

// כיוון LTR – התפריט נפתח משמאל
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

const appTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: '#FF6B35',
    background: '#fff',
    card: '#fff',
    text: '#1a1a1a',
    border: '#eee',
    notification: '#FF6B35',
  },
  direction: 'ltr',
};
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { AppointmentsProvider } from './src/context/AppointmentsContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppointmentDetailsScreen from './src/screens/AppointmentDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PhoneVerificationScreen from './src/screens/PhoneVerificationScreen';
import VerificationSuccessScreen from './src/screens/VerificationSuccessScreen';
import DrawerContent from './src/components/DrawerContent';
import DashboardScreen from './src/screens/DashboardScreen';
import AdminManageScreen from './src/screens/AdminManageScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function BookingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BookingMain"
        component={BookingScreen}
        options={({ navigation }) => ({
          title: 'הזמנת תור',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#000',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
          headerBackgroundContainerStyle: { overflow: 'hidden' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{ marginLeft: 15 }}
              onPress={() => navigation.goBack()}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="menu"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={() => navigation.openDrawer()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AppointmentsMain"
        component={AppointmentsScreen}
        options={({ navigation }) => ({
          title: 'התורים שלך',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#000',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
          headerBackgroundContainerStyle: { overflow: 'hidden' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{ marginLeft: 15 }}
              onPress={() => navigation.goBack()}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="menu"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={() => navigation.openDrawer()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
        options={({ navigation }) => ({
          title: 'פרטי התור',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#000',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
          headerBackgroundContainerStyle: { overflow: 'hidden' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{ marginLeft: 15 }}
              onPress={() => navigation.goBack()}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="menu"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={() => navigation.openDrawer()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const drawerItemHidden = { drawerItemStyle: { display: 'none' } };

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: { width: '75%' },
        headerShown: false,
        swipeEnabled: true,
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen name="Home" component={HomeStack} options={{ title: 'ראשי' }} />
      <Drawer.Screen name="Booking" component={BookingStack} options={{ title: 'הזמנת תור' }} />
      <Drawer.Screen name="Appointments" component={AppointmentsStack} options={{ title: 'התורים שלך' }} />
      <Drawer.Screen name="Profile" component={ProfileStack} options={{ title: 'פרופיל' }} />
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'דשבורד', ...drawerItemHidden }} />
      <Drawer.Screen name="AdminManage" component={AdminManageScreen} options={{ title: 'ניהול', ...drawerItemHidden }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'ההתראות שלך', ...drawerItemHidden }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'הגדרות' }} />
      <Drawer.Screen name="Login" component={LoginScreen} options={{ title: 'התחברות', ...drawerItemHidden }} />
      <Drawer.Screen name="Register" component={RegisterScreen} options={{ title: 'הרשמה', ...drawerItemHidden }} />
      <Drawer.Screen name="PhoneVerification" component={PhoneVerificationScreen} options={drawerItemHidden} />
      <Drawer.Screen name="VerificationSuccess" component={VerificationSuccessScreen} options={drawerItemHidden} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppointmentsProvider>
        <NotificationsProvider>
        <NavigationContainer theme={appTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainApp" component={DrawerNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
        </NotificationsProvider>
      </AppointmentsProvider>
    </AuthProvider>
  );
}
