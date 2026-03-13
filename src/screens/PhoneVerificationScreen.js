import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createOTPRequest, verifyOTPCode } from '../lib/otpService';
import { BARBERSHOP_PHONE } from '../lib/config';
import colors from '../theme/colors';

const CODE_LENGTH = 4;

export default function PhoneVerificationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { login } = useAuth();
  const { phoneNumber, firstName, lastName, birthDate } = route.params || {};
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([null, null, null, null]);

  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleRequestCode = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      await createOTPRequest(phoneNumber);
      setStep('verify');
    } catch (e) {
      Alert.alert(
        'שגיאה',
        'לא הצלחנו ליצור קוד. ודאו ששירות WhatsApp פועל (node whatsapp/service.js) או שהטבלה otp_requests קיימת ב-Supabase.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const newCode = [...code];
    if (digits.length > 1) {
      digits.split('').forEach((d, i) => {
        if (index + i < 4) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIdx = Math.min(index + digits.length, 3);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    newCode[index] = digits;
    setCode(newCode);
    if (digits && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length !== CODE_LENGTH || !phoneNumber) return;
    setVerifying(true);
    try {
      const valid = await verifyOTPCode(phoneNumber, token);
      if (!valid) {
        Alert.alert('קוד שגוי', 'הקוד לא תואם או פג תוקף. בקש קוד חדש.');
        setVerifying(false);
        return;
      }
      const userData = firstName
        ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate: birthDate
              ? `${birthDate.year}-${String(birthDate.month).padStart(2, '0')}-${String(birthDate.day).padStart(2, '0')}`
              : null,
          }
        : { firstName: 'משתמש', lastName: '' };
      const success = await login(phoneNumber, userData);
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VerificationSuccess' }],
        });
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו להתחבר. נסה שוב.');
      }
    } catch (e) {
      Alert.alert('שגיאה', 'אירעה בעיה. נסה שוב.');
    } finally {
      setVerifying(false);
    }
  };

  const openContactWhatsApp = () => {
    const msg = encodeURIComponent(`לא קיבלתי קוד. המספר שלי: ${phoneNumber}`);
    Linking.openURL(`https://wa.me/972547267713?text=${msg}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>אימות קוד ב-WhatsApp</Text>
        <View style={styles.menuButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="logo-whatsapp" size={64} color="#25D366" />
        </View>

        {step === 'request' ? (
          <>
            <Text style={styles.title}>
              {firstName ? 'אימות הרשמה' : 'קבלת קוד התחברות'}
            </Text>
            <Text style={styles.subtitle}>
              לחצו "בקש קוד" – הקוד יישלח אוטומטית ל-WhatsApp שלכם.{'\n'}
              (אם לא התקבל, המספרה תשלח ידנית)
              {firstName ? '\n\nלאחר האימות תוכלו לקבוע תורים.' : ''}
            </Text>
            {phoneNumber ? (
              <Text style={styles.phoneDisplay}>{phoneNumber}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRequestCode}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                  <Text style={styles.primaryButtonText}>בקש קוד</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>הזינו את הקוד</Text>
            <Text style={styles.subtitle}>
              הקוד נשלח אליכם ב-WhatsApp ממספר {BARBERSHOP_PHONE}
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={4}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (code.join('').length !== CODE_LENGTH || verifying) && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={code.join('').length !== CODE_LENGTH || verifying}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>אימות והתחברות</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('request')}>
              <Text style={styles.secondaryButtonText}>בקש קוד חדש</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpLink} onPress={openContactWhatsApp}>
              <Text style={styles.helpLinkText}>לא קיבלתי קוד – צור קשר ב-WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: { width: 40 },
  content: {
    flex: 1,
    padding: 28,
    paddingTop: 40,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  phoneDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  codeInput: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: colors.surface,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  helpLink: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  helpLinkText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
});
