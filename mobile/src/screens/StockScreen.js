/**
 * Farmer stock CRUD — market hero + availability toggle.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView, RefreshControl, ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';

const BG = require('../../assets/market-bg.png');

const empty = { vegetableName: '', stockQuantity: '', marketPrice: '', availability: 'available' };

const AVAIL = ['available', 'unavailable'];

export default function StockScreen() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stocks');
      if (data.success) setRows(data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed loading stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.vegetableName.trim()) return Alert.alert('Name required');
    const sq = Number(form.stockQuantity);
    const mp = Number(form.marketPrice);
    if (Number.isNaN(sq) || Number.isNaN(mp)) return Alert.alert('Qty and price must be numbers');
    try {
      const body = {
        vegetableName: form.vegetableName.trim(),
        stockQuantity: sq,
        marketPrice: mp,
        availability: form.availability,
      };
      if (editId) await api.put(`/stocks/${editId}`, body);
      else await api.post('/stocks', body);
      setModal(false); load();
    } catch (e) {
      Alert.alert('Save failed', e.response?.data?.message || e.message);
    }
  };

  const removeRow = async (item) => {
    Alert.alert('Remove stock?', item.vegetableName, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await api.delete(`/stocks/${item._id}`); load(); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not delete'); }
      }},
    ]);
  };

  const openEdit = (item) => {
    setEditId(item._id);
    setForm({
      vegetableName: item.vegetableName,
      stockQuantity: String(item.stockQuantity),
      marketPrice: String(item.marketPrice),
      availability: item.availability,
    });
    setModal(true);
  };

  const ListHeader = () => (
    <>
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>🌾 My Stock</Text>
          <Text style={styles.heroSub}>Manage your harvest inventory</Text>
        </View>
      </ImageBackground>
      <View style={{ padding: 16 }}>
        <PrimaryButton
          title="＋ Add Harvest"
          onPress={() => { setEditId(null); setForm(empty); setModal(true); }}
        />
      </View>
      {rows.length > 0 ? (
        <Text style={styles.countText}>{rows.length} items in stock</Text>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        data={rows}
        keyExtractor={(r) => r._id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No stock yet. Add your first harvest!</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.vegetableName}</Text>
                <Text style={styles.farmer}>by {item.farmerName}</Text>
              </View>
              <View style={[
                styles.availBadge,
                { backgroundColor: item.availability === 'available' ? '#e8f5e9' : '#ffebee' }
              ]}>
                <Text style={[
                  styles.availText,
                  { color: item.availability === 'available' ? colors.primary : colors.danger }
                ]}>
                  {item.availability === 'available' ? '✓ Available' : '✗ Unavailable'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statChipLabel}>Qty</Text>
                <Text style={styles.statChipValue}>{item.stockQuantity}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipLabel}>Price</Text>
                <Text style={styles.statChipValue}>${item.marketPrice}</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(item)}>
                <Text style={styles.removeBtnText}>🗑 Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.backdrop}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{editId ? '✏️ Update Stock' : '🌱 New Harvest'}</Text>

            <AppTextInput
              label="Vegetable name"
              value={form.vegetableName}
              onChangeText={(t) => setForm({ ...form, vegetableName: t })}
            />
            <AppTextInput
              label="Quantity"
              keyboardType="number-pad"
              value={form.stockQuantity}
              onChangeText={(t) => setForm({ ...form, stockQuantity: t })}
            />
            <AppTextInput
              label="Market price ($)"
              keyboardType="decimal-pad"
              value={form.marketPrice}
              onChangeText={(t) => setForm({ ...form, marketPrice: t })}
            />

            <Text style={styles.sectionLabel}>Availability</Text>
            <View style={styles.availRow}>
              {AVAIL.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.availOpt, form.availability === a && styles.availOptOn]}
                  onPress={() => setForm({ ...form, availability: a })}
                >
                  <Text style={[styles.availOptText, form.availability === a && styles.availOptTextOn]}>
                    {a === 'available' ? '✓ Available' : '✗ Unavailable'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton title="Save" onPress={save} />
            <TouchableOpacity onPress={() => setModal(false)} style={{ marginTop: 12, marginBottom: 24 }}>
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: { height: 160, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(27,94,32,0.65)', justifyContent: 'flex-end', padding: 16, paddingBottom: 18 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  countText: { paddingHorizontal: 16, paddingBottom: 8, color: colors.textMuted, fontSize: 13 },

  card: { backgroundColor: colors.card, padding: 16, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  title:    { fontSize: 17, fontWeight: '800', color: colors.text },
  farmer:   { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  availText:  { fontSize: 12, fontWeight: '700' },

  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statChip:      { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 10, padding: 10, alignItems: 'center' },
  statChipLabel: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  statChipValue: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },

  btnRow:       { flexDirection: 'row', gap: 10 },
  editBtn:      { flex: 1, backgroundColor: colors.primaryLight, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  editBtnText:  { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  removeBtn:    { flex: 1, backgroundColor: '#ffebee', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' },
  removeBtnText: { color: colors.danger, fontWeight: '700', fontSize: 14 },

  empty:      { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { color: colors.textMuted, fontSize: 16, textAlign: 'center' },

  backdrop:   { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  availRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  availOpt:    { flex: 1, padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, alignItems: 'center' },
  availOptOn:  { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  availOptText:   { fontWeight: '600', color: colors.textMuted },
  availOptTextOn: { color: colors.primaryDark, fontWeight: '800' },
});