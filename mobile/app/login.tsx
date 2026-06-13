// =============================================================================
// login.tsx — Login ULTRAMODERNO sobrio.
//   • Tamagui Stack/YStack para layout limpio
//   • Reanimated 4 para animaciones de entrada nativas 60fps
//   • lucide-react-native para iconos finos consistentes con la web
//   • burnt toast nativo para feedback
//   • Mulish via expo-google-fonts
//   • Sin glass/orbes — fondo claro + verde DineTrack solo en acentos
// =============================================================================

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Lock, LogIn, Mail, ShoppingBag, UserRound } from 'lucide-react-native';
import { Text, YStack } from '@/components/ui/PText';

import { useAuthStore } from '@/stores/auth.store';
import { toastError, toastSuccess } from '@/services/toast';
import { remoteLogger } from '@/services/remote-logger';

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASS = 'admin123';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: string, p?: string) => {
    const em = (e ?? email).trim();
    const pw = p ?? password;
    if (!em || !pw) {
      toastError({ title: 'Datos incompletos', message: 'Ingresa correo y contraseña' });
      return;
    }
    setLoading(true);
    remoteLogger.info('login_attempt', { email: em });
    try {
      await login(em, pw);
      remoteLogger.info('login_success');
      toastSuccess({ title: 'Bienvenido', message: 'Sesión iniciada' });
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenciales incorrectas';
      remoteLogger.warning('login_failed', { reason: msg });
      toastError({ title: 'No pudimos entrar', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <YStack
        flex={1}
        paddingHorizontal={24}
        paddingTop={insets.top + 32}
        paddingBottom={insets.bottom + 24}
      >
        {/* ─── Header ─────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(260).easing(Easing.out(Easing.cubic))}>
          <LogoBadge />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(80).duration(280).easing(Easing.out(Easing.cubic))}
        >
          <Text fontFamily="$body" fontWeight="900" fontSize={30} color="$color" marginTop={28} letterSpacing={-0.6}>
            Bienvenido
          </Text>
          <Text fontFamily="$body" fontWeight="500" fontSize={15} color="$colorMuted" marginTop={4}>
            Inicia sesión para empezar a vender
          </Text>
        </Animated.View>

        {/* ─── Form ───────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(160).duration(300).easing(Easing.out(Easing.cubic))}
          style={{ marginTop: 32 }}
        >
          <FloatingInput
            icon={Mail}
            label="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
          />
          <View style={{ height: 14 }} />
          <FloatingInput
            icon={Lock}
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPwd}
            rightIcon={showPwd ? EyeOff : Eye}
            onRightPress={() => setShowPwd((v) => !v)}
          />
        </Animated.View>

        {/* ─── CTA ────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(240).duration(300).easing(Easing.out(Easing.cubic))}
          style={{ marginTop: 28 }}
        >
          <PrimaryButton
            label={loading ? 'Entrando…' : 'Entrar'}
            icon={LogIn}
            loading={loading}
            onPress={() => handleLogin()}
          />
        </Animated.View>

        {/* ─── Divider ────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(340).duration(280)}
          style={s.dividerWrap}
        >
          <View style={s.dividerLine} />
          <Text fontFamily="$body" fontSize={11} color="$colorSubtle" marginHorizontal={12} letterSpacing={0.6}>
            o usa cuenta demo
          </Text>
          <View style={s.dividerLine} />
        </Animated.View>

        {/* ─── Demo button ────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(300).easing(Easing.out(Easing.cubic))}
        >
          <OutlineButton
            label="Probar con cuenta demo"
            icon={UserRound}
            onPress={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASS);
              handleLogin(DEMO_EMAIL, DEMO_PASS);
            }}
          />
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeIn.delay(500).duration(260)}>
          <Text
            fontFamily="$body"
            fontSize={12}
            color="$colorSubtle"
            textAlign="center"
            marginTop={16}
            letterSpacing={0.3}
          >
            POS Shop · v0.1
          </Text>
        </Animated.View>
      </YStack>
    </KeyboardAvoidingView>
  );
}

// =============================================================================
// Sub-componentes
// =============================================================================

function LogoBadge() {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[s.logoBadge, animStyle]}>
      <ShoppingBag color="#FFFFFF" size={30} strokeWidth={2.4} />
    </Animated.View>
  );
}

interface InputProps {
  icon: typeof Mail;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  rightIcon?: typeof Eye;
  onRightPress?: () => void;
}

function FloatingInput({
  icon: Icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  rightIcon: RightIcon,
  onRightPress,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderProgress = useSharedValue(0);

  useEffect(() => {
    borderProgress.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused]);

  const animBorder = useAnimatedStyle(() => ({
    borderColor: borderProgress.value > 0.5 ? '#00932C' : '#E5E7E6',
    borderWidth: 1.4,
  }));

  return (
    <Animated.View style={[s.input, animBorder]}>
      <Icon color={focused ? '#00932C' : '#8A938D'} size={20} strokeWidth={2} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text fontFamily="$body" fontSize={10} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
          {label.toUpperCase()}
        </Text>
        <TextInput
          style={s.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C8CDC9"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {RightIcon && (
        <Pressable onPress={onRightPress} hitSlop={10}>
          <RightIcon color="#8A938D" size={18} strokeWidth={2} />
        </Pressable>
      )}
    </Animated.View>
  );
}

interface BtnProps {
  label: string;
  icon: typeof LogIn;
  onPress: () => void;
  loading?: boolean;
}

function PrimaryButton({ label, icon: Icon, onPress, loading }: BtnProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 14, stiffness: 400 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={() => {
        if (loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[s.primaryBtn, animStyle, loading && { opacity: 0.85 }]}>
        <Icon color="#FFFFFF" size={20} strokeWidth={2.4} />
        <Text fontFamily="$body" color="#FFFFFF" fontWeight="800" fontSize={16} marginLeft={10} letterSpacing={0.2}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function OutlineButton({ label, icon: Icon, onPress }: BtnProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
    >
      <Animated.View style={[s.outlineBtn, animStyle]}>
        <Icon color="#00932C" size={18} strokeWidth={2.2} />
        <Text fontFamily="$body" color="$primary" fontWeight="700" fontSize={14} marginLeft={10}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#00932C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00932C',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minHeight: 64,
  },
  inputText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: '#0C0C0C',
    padding: 0,
    margin: 0,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00932C',
    height: 56,
    borderRadius: 16,
    shadowColor: '#00932C',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7E6',
  },
});
