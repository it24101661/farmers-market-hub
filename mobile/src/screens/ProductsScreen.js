/**
 * Products — market hero + live search filter.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ImageBackground,
  TextInput,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';

const BG = require('../../assets/market-bg.png');

const emptyForm = {
  productName: '',
  category: '',
  price: '',
  quantity: '',
  description: '',
  image: '',
  availabilityStatus: 'in_stock',
};

export default function ProductsScreen() {
  const { user, isRole } = useAuth();
  const [allList, setAllList] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = isRole('farmer', 'admin');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      if (data.success) {
        setAllList(data.data);
        setList(data.data);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // Live search — filters instantly as user types
  useEffect(() => {
    const q = search.toLowerCase().trim();
    const cat = category.toLowerCase().trim();
    const filtered = allList.filter((item) => {
      const matchName = !q || item.productName.toLowerCase().includes(q);
      const matchCat = !cat || item.category.toLowerCase().includes(cat);
      return matchName && matchCat;
    });
    setList(filtered);
  }, [search, category, allList]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModal(true); };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      productName: item.productName,
      category: item.category,
      price: String(item.price),
      quantity: String(item.quantity),
      description: item.description || '',
      image: item.image || '',
      availabilityStatus: item.availabilityStatus || 'in_stock',
    });
    setModal(true);
  };

  const saveProduct = async () => {
    if (!form.productName.trim() || !form.category.trim()) {
      Alert.alert('Validation', 'Name and category are required.'); return;
    }
    const price = Number(form.price);
    const qty = Number(form.quantity);
    if (Number.isNaN(price) || Number.isNaN(qty)) {
      Alert.alert('Validation', 'Price and quantity must be numbers.'); return;
    }
    const body = {
      productName: form.productName.trim(),
      category: form.category.trim(),
      price, quantity: qty,
      description: form.description.trim(),
      image: form.image.trim(),
      availabilityStatus: form.availabilityStatus,
    };
    try {
      if (editingId) await api.put(`/products/${editingId}`, body);
      else await api.post('/products', body);
      setModal(false); load();
    } catch (e) {
      Alert.alert('Save failed', e.response?.data?.message || e.message);
    }
  };

  const remove = async (item) => {
    Alert.alert('Delete product?', item.productName, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/products/${item._id}`); load(); }
        catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed'); }
      }},
    ]);
  };

  const showActionsFor = (item) => {
    if (!canManage) return false;
    if (isRole('admin')) return true;
    const fid = item.farmer?._id || item.farmer;
    return String(fid) === String(user?.id);
  };

  const ListHeader = () => (
    <>
      {/* Market hero image */}
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>🛒 Market</Text>
          <Text style={styles.heroSub}>Fresh produce from local farmers</Text>
        </View>
      </ImageBackground>

      {/* Live search bar */}
      <View style={styles.searchBox}>
        <View style={styles.searchInputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables, fruits..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter row */}
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.searchInput, styles.catInput]}
            placeholder="Filter by category..."
            placeholderTextColor={colors.textMuted}
            value={category}
            onChangeText={setCategory}
            autoCorrect={false}
          />
          {canManage ? (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={styles.addBtnText}>＋</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Results count */}
        <Text style={styles.resultsCount}>
          {list.length} {list.length === 1 ? 'product' : 'products'} found
        </Text>
      </View>

      {loading && allList.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={list}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🥦</Text>
              <Text style={styles.emptyText}>No products match "{search}"</Text>
              <TouchableOpacity onPress={() => { setSearch(''); setCategory(''); }}>
                <Text style={styles.clearSearch}>Clear search</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <ProductCard
              item={item}
              showActions={showActionsFor(item)}
              onEdit={openEdit}
              onDelete={remove}
              onPress={() => {}}
            />
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? '✏️ Edit Product' : '＋ New Product'}</Text>
            <AppTextInput label="Name" value={form.productName} onChangeText={(t) => setForm({ ...form, productName: t })} />
            <AppTextInput label="Category" value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} />
            <AppTextInput label="Price" keyboardType="decimal-pad" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
            <AppTextInput label="Quantity" keyboardType="number-pad" value={form.quantity} onChangeText={(t) => setForm({ ...form, quantity: t })} />
            <AppTextInput label="Description" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
            <AppTextInput label="Image URL" value={form.image} onChangeText={(t) => setForm({ ...form, image: t })} />
            <PrimaryButton title="Save Product" onPress={saveProduct} />
            <TouchableOpacity style={styles.cancel} onPress={() => setModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: { height: 180, width: '100%' },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27,94,32,0.65)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 18,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  searchBox: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  clearBtn:    { fontSize: 14, color: colors.textMuted, paddingLeft: 8 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  catInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.primaryDark,
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 30 },

  resultsCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },

  empty: { alignItems: 'center', marginTop: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  clearSearch: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 16 },
  modalCard:     { backgroundColor: colors.card, borderRadius: 20, padding: 20, maxHeight: '92%' },
  modalTitle:    { fontSize: 20, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },
  cancel:        { marginTop: 8 },
  cancelText:    { color: colors.primary, fontWeight: '600', textAlign: 'center', marginVertical: 12 },
});