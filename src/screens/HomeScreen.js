import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentsContext';
import colors from '../theme/colors';
import { BARBERSHOP_PHONE_INTL } from '../lib/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ABOUT_TEXT = `החופש עם המספריים – לא עוקבים אחרי טרנדים אלא יוצרים אותם.
מזמינים אתכם להשאיר מאחור את השגרה ולפנות מקום לאומנות.
תספורות מגה-לישור, תספורות מגניבות, מוצרי שיער ממותגים – הכול במקום אחד.
מוחמד אבו ג׳ומא – חוויה אחרת.`;

const PRODUCTS = [
  { id: '1', name: 'BRILLIANT', price: 89.9, image: require('../../assets/home/mach.jpeg') },
  { id: '2', name: 'MATTE PUTTY', price: 89.9, image: require('../../assets/home/crm.webp') },
];

const VIDEO_SOURCE = require('../../assets/home/barb.mp4');

function HeroVideo({ source, style }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

const GALLERY_IMAGES = [
  require('../../assets/home/IMG_0675.webp'),
  require('../../assets/home/IMG_0677.jpg'),
  require('../../assets/home/IMG_0678.webp'),
  require('../../assets/home/IMG_0679.webp'),
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isLoggedIn, user } = useAuth();
  const { getUpcomingAppointments } = useAppointments();
  const upcomingAppointments = getUpcomingAppointments() || [];
  const hasAppointments = upcomingAppointments.length > 0;
  const [noticeExpanded, setNoticeExpanded] = useState(true);
  const [aboutFlipped, setAboutFlipped] = useState(false);
  const [appointmentMenuFor, setAppointmentMenuFor] = useState(null);
  const flipRotation = useSharedValue(0);
  const NOTICE_SLIDE_HEIGHT = 380;
  const noticeTranslateY = useSharedValue(-NOTICE_SLIDE_HEIGHT);

  useEffect(() => {
    if (noticeExpanded) {
      noticeTranslateY.value = withTiming(0, { duration: 400 });
    }
  }, [noticeExpanded]);

  const dismissNotice = () => {
    noticeTranslateY.value = withTiming(-NOTICE_SLIDE_HEIGHT, { duration: 350 }, () => {
      runOnJS(setNoticeExpanded)(false);
      noticeTranslateY.value = -NOTICE_SLIDE_HEIGHT;
    });
  };

  const noticeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: noticeTranslateY.value }],
  }));

  const openAppointmentMenu = (apt, e) => {
    e?.stopPropagation?.();
    setAppointmentMenuFor(apt);
  };

  const closeAppointmentMenu = () => setAppointmentMenuFor(null);

  const handleCallBranch = () => {
    Linking.openURL(`tel:${BARBERSHOP_PHONE_INTL}`);
    closeAppointmentMenu();
  };

  const handleNavigateBranch = () => {
    const branch = appointmentMenuFor?.branch || 'דיר אל אסד';
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(branch)}`;
    Linking.openURL(wazeUrl);
    closeAppointmentMenu();
  };

  const handleCancelAppointmentNav = () => {
    closeAppointmentMenu();
    navigation.navigate('Appointments');
  };

  const handleAboutPress = () => {
    const toValue = aboutFlipped ? 0 : 180;
    flipRotation.value = withTiming(toValue, { duration: 450 });
    setAboutFlipped(!aboutFlipped);
  };

  const flipFrontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const flipBackStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value + 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const renderAppointmentCard = (apt, isSingle) => (
    <View
      key={apt.id}
      style={[styles.upcomingAppointmentCard, isSingle && styles.upcomingAppointmentCardSingle]}
    >
      <TouchableOpacity
        style={styles.appointmentOptionsBtn}
        onPress={(e) => openAppointmentMenu(apt, e)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      <View style={styles.appointmentCardTopRow}>
        <Text style={styles.appointmentCardService}>{apt.service}</Text>
      </View>
      <View style={styles.appointmentCardMiddleRow}>
        <View style={styles.appointmentCardBarber}>
          <View style={styles.appointmentBarberAvatar}>
            <Ionicons name="person" size={18} color={colors.textMuted} />
          </View>
          <Text style={styles.appointmentBarberText}>אצל {apt.barber}</Text>
        </View>
        <View style={styles.appointmentCardLocation}>
          <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
          <Text style={styles.appointmentLocationText}>{apt.branch}</Text>
        </View>
      </View>
      <View style={styles.appointmentCardBottomRow}>
        <View style={[styles.appointmentDateTimeItem, styles.appointmentDateTimeItemFirst]}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.appointmentDateTimeText}>
            {new Date(`${apt.date}T${apt.time}`).toLocaleDateString('he-IL', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.appointmentDateTimeItem}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.appointmentDateTimeText}>{apt.time}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.backgroundShape} />
      <View style={styles.header}>
        <View style={styles.headerAccentLine} />
        <View style={styles.headerIconWrapper}>
          <Ionicons name="cut" size={22} color={colors.accent} />
        </View>
        <Text style={styles.headerTitle}>BarberShop</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={26} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWithVideo}>
        {/* סרטון ברקע – קבוע */}
        <View style={styles.videoSectionFixed}>
          {VIDEO_SOURCE ? (
            <HeroVideo source={VIDEO_SOURCE} style={styles.videoPlayer} />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        <View style={styles.scrollArea}>
          <ScrollView
            style={styles.scrollViewTransparent}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.videoSpacer} />
            <View style={styles.whiteCardOverlay}>
              <View style={styles.whiteCardTopExtension} />
              <View style={styles.welcomeTextWrap}>
                {hasAppointments && isLoggedIn ? (
                  <>
                    <Text style={[styles.welcomeText, styles.welcomeTextLine1]}>היי {user?.firstName || ''}, שמחים שחזרת!</Text>
                    <Text style={styles.welcomeSubtext}>לא לשכוח שיש לך תור מוזמן</Text>
                  </>
                ) : isLoggedIn ? (
                  <Text style={styles.welcomeText}>שלום {user?.firstName || ''}, ברוך הבא!</Text>
                ) : (
                  <Text style={styles.welcomeText}>שלום אורח, ברוך הבא!</Text>
                )}
              </View>
              {hasAppointments && isLoggedIn && (
                upcomingAppointments.length === 1 ? (
                  <View style={styles.appointmentsSingleWrap}>
                    {renderAppointmentCard(upcomingAppointments[0], true)}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.appointmentsScrollContent}
                  >
                    {upcomingAppointments.map(renderAppointmentCard)}
                  </ScrollView>
                )
              )}
              <TouchableOpacity
                style={[styles.loginButton, styles.loginButtonFullWidth]}
                onPress={() => navigation.navigate(isLoggedIn ? 'Booking' : 'Login')}
              >
                <Text style={styles.loginButtonText}>
                  {isLoggedIn ? 'לחץ לקביעת תור' : 'לחץ להתחברות או הרשמה'}
                </Text>
              </TouchableOpacity>

              {/* גלריית תמונות */}
              <View style={styles.gallerySection}>
                <Text style={styles.galleryTitle}>העבודה שלנו</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {GALLERY_IMAGES.map((img, i) => (
                    <View key={i} style={styles.galleryItem}>
                      <Image source={img} style={styles.galleryImage} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* כרטיס מתהפך */}
              <View style={styles.flipCardWrapper}>
                <View style={styles.flipCardInner}>
                  <Animated.View style={[styles.flipFace, styles.flipFaceFront, flipFrontStyle]}>
                    <Image
                      source={require('../../assets/home/barbershop.jpg')}
                      style={styles.salonImage}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  <Animated.View style={[styles.flipFace, styles.flipFaceBack, flipBackStyle]}>
                    <Text style={styles.aboutText}>{ABOUT_TEXT}</Text>
                  </Animated.View>
                </View>
              </View>
              <TouchableOpacity style={styles.aboutButton} onPress={handleAboutPress}>
                <Text style={styles.aboutButtonText}>
                  {aboutFlipped ? 'סגור' : 'קצת על המספרה'}
                </Text>
              </TouchableOpacity>
            </View>

        <View style={styles.contentBelowCard}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>המוצרים שלנו</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {PRODUCTS.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImageContainer}>
                  <Image source={product.image} style={styles.productImage} resizeMode="cover" />
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <TouchableOpacity style={styles.productPriceBtn}>
                  <Text style={styles.productPriceText}>₪{product.price}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <Image
              source={require('../../assets/home/barber1.jpeg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>ניווט בעזרת Waze</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>כתובת ויצירת קשר</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>עקבו אחרינו</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-youtube" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-facebook" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-instagram" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-whatsapp" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.ratingText}>אהבתם את האפליקציה? דרגו אותנו</Text>
        </View>
        </View>
      </ScrollView>

        {noticeExpanded && (
          <View style={styles.noticeOverlay} pointerEvents="box-none">
            <TouchableOpacity activeOpacity={1} onPress={dismissNotice} style={styles.noticeOverlayTouch}>
              <Animated.View style={[styles.noticeCard, noticeAnimatedStyle]}>
                <Text style={styles.noticeTitle}>שימו לב לגבי איחורים/ביטולים/הברזות</Text>
                <Text style={styles.noticeBodyText}>
                  לקוחות יקרים,{'\n'}
                  נדרש להגיע עד 10 דקות לפני התור.{'\n'}
                  איחור או ביטול ללא תיאום יובילו לביטול אוטומטי ולחסימה זמנית באפליקציה{'\n'}
                  שחרור החסימה יתאפשר לאחר תשלום על התור שבוטל.{'\n'}
                  חשוב לציין – במקרים חריגים בלבד, עשוי להיווצר עיכוב של תור אחד מצד הספרים עקב עומס.{'\n'}
                  תודה על ההבנה
                </Text>
                <View style={styles.noticeCollapse}>
                  <Ionicons name="chevron-up" size={24} color={colors.accent} />
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </View>

      <Modal
        visible={!!appointmentMenuFor}
        transparent
        animationType="slide"
        onRequestClose={closeAppointmentMenu}
      >
        <TouchableOpacity
          style={styles.appointmentModalOverlay}
          activeOpacity={1}
          onPress={closeAppointmentMenu}
        >
          <View style={styles.appointmentModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.appointmentModalHandle} />
            <TouchableOpacity style={styles.appointmentModalBtn} onPress={handleCallBranch}>
              <Ionicons name="call-outline" size={22} color={colors.text} />
              <Text style={styles.appointmentModalBtnText}>חיוג לסניף</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.appointmentModalBtn} onPress={handleNavigateBranch}>
              <Ionicons name="navigate-outline" size={22} color={colors.text} />
              <Text style={styles.appointmentModalBtnText}>ניווט לסניף</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.appointmentModalBtn, styles.appointmentModalBtnCancel]} onPress={handleCancelAppointmentNav}>
              <Ionicons name="close-circle-outline" size={22} color="#c62828" />
              <Text style={[styles.appointmentModalBtnText, styles.appointmentModalBtnTextCancel]}>ביטול התור</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundShape: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.15,
  },
  contentWithVideo: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  videoSectionFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  videoSpacer: {
    height: 180,
  },
  whiteCardTopExtension: {
    height: 250,
    marginTop: -250,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollArea: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollViewTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  noticeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  noticeOverlayTouch: { width: '100%' },
  headerAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  menuButton: { padding: 8, marginRight: 15 },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: 3,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  contentBelowCard: {
    backgroundColor: colors.surface,
    marginHorizontal: -20,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  noticeCard: {
    backgroundColor: colors.surface,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 14,
    textAlign: 'right',
  },
  noticeBodyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 24,
    textAlign: 'right',
  },
  noticeCollapse: { alignItems: 'center', paddingTop: 16 },
  appointmentsSection: { marginBottom: 20 },
  welcomeTextWrap: { marginBottom: 16, alignSelf: 'stretch' },
  welcomeTextLine1: { marginBottom: 4 },
  welcomeSubtext: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'right',
  },
  appointmentsSingleWrap: {
    marginBottom: 4,
  },
  appointmentsScrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  upcomingAppointmentCard: {
    width: SCREEN_WIDTH - 72,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginLeft: 14,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingAppointmentCardSingle: {
    marginLeft: 0,
  },
  appointmentOptionsBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 4,
  },
  appointmentCardTopRow: { marginBottom: 12 },
  appointmentCardService: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  appointmentCardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentCardBarber: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentBarberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  appointmentBarberText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  appointmentCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentLocationText: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 5,
    textAlign: 'right',
  },
  appointmentCardBottomRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  appointmentDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 18,
  },
  appointmentDateTimeItemFirst: {
    marginLeft: 0,
  },
  appointmentDateTimeText: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 5,
    textAlign: 'right',
  },
  appointmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  appointmentModalContent: {
    backgroundColor: colors.backgroundAlt ?? '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'stretch',
  },
  appointmentModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted ?? '#999',
    alignSelf: 'center',
    marginBottom: 24,
  },
  appointmentModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  appointmentModalBtnCancel: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
  },
  appointmentModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 10,
  },
  appointmentModalBtnTextCancel: {
    color: '#c62828',
  },
  loginButtonWrapper: { marginBottom: 24 },
  loginButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginButtonFullWidth: { alignSelf: 'stretch' },
  loginButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  collapsedWelcomeLayout: { marginBottom: 24 },
  videoPlaceholder: {
    height: 200,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: 260,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  whiteCardOverlay: {
    backgroundColor: colors.surface,
    marginTop:55,
    marginBottom: 24,
    marginHorizontal: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'right',
  },
  gallerySection: { width: '100%', marginBottom: 24 },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
    textAlign: 'right',
  },
  galleryScroll: { paddingRight: 4 },
  galleryItem: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    marginLeft: 12,
  },
  galleryImage: { width: '100%', height: '100%' },
  flipCardWrapper: {
    width: '100%',
    height: 220,
    marginVertical: 20,
    perspective: 800,
  },
  flipCardInner: { width: '100%', height: '100%', position: 'relative' },
  flipFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  flipFaceFront: { left: 0, top: 0, backgroundColor: colors.border },
  flipFaceBack: {
    left: 0,
    top: 0,
    padding: 18,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  salonImage: { width: '100%', height: '100%' },
  aboutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '600',
  },
  aboutButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  aboutButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  productsScroll: { paddingRight: 4 },
  productCard: {
    width: 160,
    marginLeft: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  productImageContainer: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImage: { width: '100%', height: '100%' },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  productPriceBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  productPriceText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  heroSection: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroImageContainer: { height: 220, backgroundColor: colors.border },
  heroImage: { width: '100%', height: '100%' },
  heroButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  heroButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  heroButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  socialSection: { alignItems: 'center', paddingVertical: 32 },
  socialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  socialBtn: { padding: 10 },
  ratingText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
