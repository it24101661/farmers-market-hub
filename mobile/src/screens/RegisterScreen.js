/**
 * Register — choose role with frosted-glass UI over market background.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import colors from '../theme/colors';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const BG = require('../../assets/market-bg.png');

const ROLES = [
  { id: 'customer',  emoji: '🛒', label: 'Customer' },
  { id: 'farmer',   emoji: '🌾', label: 'Farmer' },
  { id: 'delivery', emoji: '🚚', label: 'Delivery' },
  { id: 'admin',    emoji: '⚙️', label: 'Admin' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('customer');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name required';
    if (!email.trim()) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password || password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.emoji}>🌿</Text>
            <Text style={styles.logo}>Join the Market</Text>
            <Text style={styles.sub}>Create your account below</Text>
          </View>

          <View style={styles.card}>
            <AppTextInput label="Full name" value={name} onChangeText={setName} error={errors.name} />
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

            <Text style={styles.roleLabel}>I am a…</Text>
            <View style={styles.roles}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.chip, role === r.id && styles.chipOn]}
                  onPress={() => setRole(r.id)}
                >
                  <Text style={styles.chipEmoji}>{r.emoji}</Text>
                  <Text style={[styles.chipText, role === r.id && styles.chipTextOn]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton title="Create Account" onPress={submit} loading={loading} />

            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back to login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1 },
  flex:    { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayDark },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },

  header:  { alignItems: 'center', marginBottom: 28 },
  emoji:   { fontSize: 44, marginBottom: 8 },
  logo:    { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub:     { color: 'rgba(255,255,255,0.75)', marginTop: 6, fontSize: 13, textAlign: 'center' },

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

  roleLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10, marginTop: 4 },
  roles:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipOn:      { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipEmoji:   { fontSize: 16 },
  chipText:    { color: colors.text, fontSize: 13, fontWeight: '500' },
  chipTextOn:  { fontWeight: '700', color: colors.primaryDark },

  back:     { marginTop: 18, alignSelf: 'center' },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});