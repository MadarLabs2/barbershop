import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppointments } from '../context/AppointmentsContext';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function AppointmentDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { getAppointmentById, cancelAppointment } = useAppointments();
  const appointment = getAppointmentById(route.params?.appointmentId);

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>תור לא נמצא</Text>
      </View>
    );
  }

  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  const isPast = appointmentDate < new Date();
  const formattedDate = appointmentDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleCancel = () => {
    Alert.alert(
      'ביטול תור',
      'האם אתה בטוח שברצונך לבטל את התור?',
      [
        { text: 'לא', style: 'cancel' },
        {
          text: 'כן, בטל',
          style: 'destructive',
          onPress: () => {
            cancelAppointment(appointment.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const detailItems = [
    { icon: 'cut', label: 'שירות', value: appointment.service },
    { icon: 'calendar', label: 'תאריך', value: formattedDate },
    { icon: 'time', label: 'שעה', value: appointment.time },
    { icon: 'person', label: 'ספר', value: appointment.barber },
    { icon: 'hourglass', label: 'משך זמן', value: `${appointment.duration} דקות` },
    { icon: 'cash', label: 'מחיר', value: `₪${appointment.price}`, isPrice: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, isPast && styles.statusBadgePast]}>
          <Text style={styles.statusText}>{isPast ? 'הושלם' : 'ממתין'}</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        {detailItems.map((item, i) => (
          <View key={item.label} style={[styles.detailRow, i === detailItems.length - 1 && styles.detailRowLast]}>
            <View style={styles.detailIconWrap}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={[styles.detailValue, item.isPrice && styles.detailPrice]}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {!isPast && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
          <Text style={styles.cancelButtonText}>בטל תור</Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
        <Text style={styles.infoText}>
          אנא הגיעו 5 דקות לפני השעה שנקבעה. ביטול תור אפשרי עד 24 שעות לפני התור.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgePast: {
    backgroundColor: colors.border,
  },
  statusText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 50,
  },
});
