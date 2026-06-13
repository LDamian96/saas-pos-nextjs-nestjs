// =============================================================================
// login.tsx — Login ultramoderno sobrio premium.
// =============================================================================

import { ComponentType, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { Eye, EyeOff, Lock, LogIn, Mail, ShoppingBag, UserRound } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/theme';

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
      toastError('Datos incompletos', 'Ingresa correo y contraseña');
      return;
    }
    setLoading(true);
    remoteLogger.info('login_attempt', { email: em });
    try {
      await login(em, pw);
      remoteLogger.info('login_success');
      toastSuccess('Bienvenido', 'Sesión iniciada');
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenciales incorrectas';
      remoteLogger.warning('login_failed', { reason: msg });
      toastError('No pudimos entrar', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}>
        <Animated.View entering={FadeIn.duration(260).easing(Easing.out(Easing.cubic))}>
          <LogoBadge />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(280).easing(Easing.out(Easing.cubic))}>
          <Text style={s.title}>Bienvenido</Text>
          <Text style={s.subtitle}>Inicia sesión para empezar a vender</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(300).easing(Easing.out(Easing.cubic))} style={{ marginTop: 32 }}>
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

        <Animated.View entering={FadeInUp.delay(240).duration(300).easing(Easing.out(Easing.cubic))} style={{ marginTop: 28 }}>
          <Button label={loading ? 'Entrando…' : 'Entrar'} icon={LogIn} loading={loading} onPress={() => handleLogin()} size="lg" />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(340).duration(280)} style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>O USA CUENTA DEMO</Text>
          <View style={s.dividerLine} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(300).easing(Easing.out(Easing.cubic))}>
          <Button
            label="Probar con cuenta demo"
            icon={UserRound}
            variant="outline"
            onPress={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASS);
              handleLogin(DEMO_EMAIL, DEMO_PASS);
            }}
          />
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeIn.delay(500).duration(260)}>
          <Text style={s.footer}>POS Shop · v1.0</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    <Animated.View style={[s.logo, animStyle]}>
      <ShoppingBag color="#FFFFFF" size={30} strokeWidth={2.4} />
    </Animated.View>
  );
}

interface InputProps {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  rightIcon?: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
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
  const border = useSharedValue(0);
  border.value = withTiming(focused ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });

  const animBorder = useAnimatedStyle(() => ({
    borderColor: border.value > 0.5 ? colors.brand : colors.border,
    borderWidth: 1.4,
  }));

  return (
    <Animated.View style={[s.input, animBorder]}>
      <Icon color={focused ? colors.brand : colors.textSubtle} size={20} strokeWidth={2} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.inputLabel}>{label.toUpperCase()}</Text>
        <TextInput
          style={s.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
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
          <RightIcon color={colors.textSubtle} size={18} strokeWidth={2} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontFamily: fonts.black, fontSize: 30, color: colors.text, marginTop: 28, letterSpacing: -0.6 },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted, marginTop: 4 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    minHeight: 64,
  },
  inputLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.textSubtle, letterSpacing: 1.2 },
  inputText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, padding: 0, margin: 0 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.bold, fontSize: 10, color: colors.textSubtle, marginHorizontal: 12, letterSpacing: 1.2 },
  footer: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle, textAlign: 'center', marginTop: 16, letterSpacing: 0.3 },
});
