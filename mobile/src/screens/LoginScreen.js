/**
 * Login — email/password with full-screen farmers-market background.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

// Place your market image in mobile/assets/market-bg.png
const BG = require('../../assets/market-bg.png');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      {/* Dark overlay to make text legible */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Brand header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🌿</Text>
            <Text style={styles.logo}>Farmers Market Hub</Text>
            <Text style={styles.sub}>Fresh produce. Connected community.</Text>
          </View>

          {/* Frosted glass card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            <AppTextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <AppTextInput
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <PrimaryButton title="Sign In" onPress={onSubmit} loading={loading} />

            <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>New here? <Text style={styles.linkBold}>Create account</Text></Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Demo: customer@market.com / password123
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1 },
  flex:    { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },

  // Brand header
  header:  { alignItems: 'center', marginBottom: 32 },
  emoji:   { fontSize: 48, marginBottom: 8 },
  logo:    { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  sub:     { color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: 14, textAlign: 'center' },

  // Frosted card
  card: {
    backgroundColor: colors.cardOverlay,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 20,
    textAlign: 'center',
  },

  link:     { marginTop: 18, alignSelf: 'center' },
  linkText: { color: colors.textMuted, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  hint:     { marginTop: 20, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});