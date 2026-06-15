import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { toastSuccess, toastError } from '@/api/helpers';
import { getBiometricStatus, loginWithBiometric } from '@/services/biometric.service';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const login = useAuthStore(s => s.login);
  const [bioReady, setBioReady] = useState(false);

  // Animaciones de entrada
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 50 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(formSlide, { toValue: 0, useNativeDriver: true, friction: 8, tension: 40 }),
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Detectar si hay biometria configurada para mostrar el boton
    getBiometricStatus().then((st) => {
      setBioReady(st.hasHardware && st.isEnrolled && st.saved);
    });
  }, []);

  const handleBiometricLogin = async () => {
    const creds = await loginWithBiometric();
    if (!creds) {
      toastError('Huella no reconocida', 'Intenta de nuevo o usa tu contrasena');
      return;
    }
    handleLogin(creds.email, creds.password);
  };

  const handleLogin = async (e?: string, p?: string) => {
    const em = e || email.trim();
    const pw = p || password;
    if (!em || !pw) { toastError('Error', 'Ingresa email y contrasena'); return; }
    setLoading(true);
    try {
      await login(em, pw);
      toastSuccess('Bienvenido', 'Sesion iniciada');
      router.replace('/(tabs)');
    } catch (err: any) {
      toastError('Error', err?.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={[s.inner, { paddingTop: insets.top }]}>
        {/* Logo animado */}
        <Animated.View style={[s.logoSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={s.logoOuter}>
            <View style={s.logo}>
              <Text style={s.logoText}>P</Text>
            </View>
          </View>
          <Text style={s.title}>POS Shop</Text>
          <Text style={s.subtitle}>Sistema de Punto de Venta</Text>
        </Animated.View>

        {/* Form animado */}
        <Animated.View style={[s.formSection, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}>
          <View style={s.formCard}>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Correo electronico</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>✉</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Contrasena</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPwd}
                />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
                  <Text style={s.eyeText}>{showPwd ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.loginBtn, loading && s.loginBtnLoading]}
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.loginBtnText}>Iniciar Sesion</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo + Huella */}
          <View style={s.demoSection}>
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>o continua con</Text>
              <View style={s.dividerLine} />
            </View>

            {bioReady && (
              <TouchableOpacity
                style={[s.demoBtn, { backgroundColor: '#7c3aed', borderColor: '#7c3aed', marginBottom: 10 }]}
                onPress={handleBiometricLogin}
                activeOpacity={0.85}
              >
                <Text style={[s.demoBtnText, { color: '#ffffff' }]}>👆  Entrar con huella</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={s.demoBtn}
              onPress={() => { setEmail('admin@demo.com'); setPassword('admin123'); handleLogin('admin@demo.com', 'admin123'); }}
              activeOpacity={0.7}
            >
              <Text style={s.demoBtnText}>👤  Cuenta Demo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={s.footer}>Powered by POS Shop v1.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoOuter: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: '#94a3b8', fontSize: 15, marginTop: 6, fontWeight: '500' },

  formSection: {},
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  fieldWrap: { marginBottom: 18 },
  label: { color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: '600', letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, height: 52, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  eyeBtn: { padding: 8 },
  eyeText: { fontSize: 18 },

  loginBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    elevation: 6,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  loginBtnLoading: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  demoSection: { marginTop: 28 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginHorizontal: 14 },
  demoBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#faf5ff',
    borderWidth: 1.5,
    borderColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: { color: '#7c3aed', fontWeight: '700', fontSize: 15 },

  footer: { color: '#cbd5e1', textAlign: 'center', fontSize: 12, marginTop: 32, fontWeight: '500' },
});
