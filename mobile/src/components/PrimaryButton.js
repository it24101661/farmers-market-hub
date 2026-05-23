import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import colors from '../theme/colors';

export default function PrimaryButton({ title, onPress, loading, disabled, style, variant = 'primary' }) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isOutline ? styles.outline : styles.filled,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  filled:   { backgroundColor: colors.primary },
  outline:  { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary, shadowOpacity: 0 },
  disabled: { opacity: 0.55 },
  text:        { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  textOutline: { color: colors.primary },
});