import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';

export default function ProductCard({ item, onPress, onEdit, onDelete, showActions }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.img} />
      ) : (
        <View style={[styles.img, styles.placeholder]}>
          <Text style={styles.phText}>🌿</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{item.productName}</Text>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.price}>
          ${Number(item.price).toFixed(2)} · Qty {item.quantity}
        </Text>
        <Text style={styles.status}>{item.availabilityStatus?.replace('_', ' ')}</Text>
        {showActions ? (
          <View style={styles.row}>
            {onEdit ? (
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
            {onDelete ? (
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.dangerBtn}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  img: { width: 100, height: 100, backgroundColor: colors.primaryLight },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  phText: { fontSize: 32 },
  body: { flex: 1, padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  price: { marginTop: 6, color: colors.primaryDark, fontWeight: '600' },
  status: { marginTop: 4, fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
