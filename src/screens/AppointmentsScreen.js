import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppointments } from '../context/AppointmentsContext';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const EmptyStateIllustration = () => (
  <View style={styles.illustrationContainer}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name="calendar-outline" size={80} color={colors.border} />
    </View>
  </View>
);

export default function AppointmentsScreen() {
  const { getUpcomingAppointments, getPastAppointments, cancelAppointment } = useAppointments();
  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = getPastAppointments();

  const handleCancelPress = (item) => {
    Alert.alert(
      'ביטול תור',
      `האם לבטל את התור ל${item.service} ב${new Date(`${item.date}T${item.time}`).toLocaleDateString('he-IL')}?`,
      [
        { text: 'לא', style: 'cancel' },
        {
          text: 'כן, בטל',
          style: 'destructive',
          onPress: () => cancelAppointment(item.id),
        },
      ]
    );
  };

  const renderAppointmentItem = ({ item, isPast }) => {
    const appointmentDate = new Date(`${item.date}T${item.time}`);
    const formattedDate = appointmentDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.cardContent}>
          <Text style={styles.appointmentService}>{item.service}</Text>
          <View style={styles.cardRow}>
            <View style={styles.barberSection}>
              <View style={styles.barberAvatar}>
                <Ionicons name="person" size={20} color={colors.textMuted} />
              </View>
              <Text style={styles.barberLabel}>אצל {item.barber}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <View style={styles.infoChip}>
              <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoChipText}>{item.branch}</Text>
            </View>
          </View>
          <View style={styles.dateTimeRow}>
            <View style={[styles.dateTimeChip, styles.dateTimeChipFirst]}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>{formattedDate}</Text>
            </View>
            <View style={styles.dateTimeChip}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>{item.time}</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.appointmentPrice}>₪{item.price}</Text>
          </View>
        </View>
        {!isPast && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelPress(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>לחץ לביטול התור</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (upcomingAppointments.length === 0 && pastAppointments.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <EmptyStateIllustration />
          <Text style={styles.emptyStateText}>לא קיימים תורים להצגה</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תורים קרובים</Text>
            {upcomingAppointments.map((item) => (
              <View key={item.id}>
                {renderAppointmentItem({ item, isPast: false })}
              </View>
            ))}
          </View>
        )}

        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תורים קודמים</Text>
            {pastAppointments.map((item) => (
              <View key={item.id}>
                {renderAppointmentItem({ item, isPast: true })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  appointmentService: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  barberSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  barberLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoChipText: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 6,
    textAlign: 'right',
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 12,
  },
  dateTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  dateTimeChipFirst: {
    marginLeft: 0,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 6,
    textAlign: 'right',
  },
  priceRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appointmentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  cancelButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: '100%',
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
});
