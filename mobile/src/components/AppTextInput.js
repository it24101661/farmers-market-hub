import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppTextInput({ label, error, style, ...props }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: colors.text,
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  err: { color: colors.danger, fontSize: 12, marginTop: 4 },
});