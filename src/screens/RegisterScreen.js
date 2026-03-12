import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    phoneNumber.length >= 9 &&
    day &&
    month &&
    year &&
    termsAccepted;

  const handleContinue = () => {
    if (!isFormValid) return;
    navigation.navigate('PhoneVerification', {
      phoneNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: { day, month, year },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הרשמה</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            navigation.openDrawer
              ? navigation.openDrawer()
              : navigation.getParent()?.openDrawer?.()
          }
        >
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-add" size={40} color={colors.accent} />
          </View>
          <Text style={styles.cardTitle}>צרו חשבון</Text>
          <Text style={styles.cardSubtitle}>מלאו את הפרטים להמשך</Text>

          <TextInput
            style={styles.input}
            placeholder="שם פרטי"
            placeholderTextColor={colors.textMuted}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="שם משפחה"
            placeholderTextColor={colors.textMuted}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="טלפון"
            placeholderTextColor={colors.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>תאריך לידה</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="שנה"
              placeholderTextColor={colors.textMuted}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="חודש"
              placeholderTextColor={colors.textMuted}
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="יום"
              placeholderTextColor={colors.textMuted}
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              אני מאשר/ת את{' '}
              <Text style={styles.termsLink}>תנאי השימוש</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !isFormValid && styles.primaryButtonTextDisabled,
              ]}
            >
              המשך
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201,162,39,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 14,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'right',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInput: { flex: 1, marginHorizontal: 4 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  termsText: {
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButtonTextDisabled: {
    color: colors.textMuted,
  },
});
