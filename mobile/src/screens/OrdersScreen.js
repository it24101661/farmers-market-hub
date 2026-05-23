/**
 * Orders — place (customer), approve/reject/track, history.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity,
  StyleSheet, Alert, Modal, ActivityIndicator, ScrollView, ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import AppTextInput from '../components/AppTextInput';

const BG = require('../../assets/market-bg.png');

const STATUS_STYLE = {
  pending:    { bg: '#fff3e0', text: '#e65100' },
  approved:   { bg: '#e8f5e9', text: '#2e7d32' },
  processing: { bg: '#e3f2fd', text: '#1565c0' },
  shipped:    { bg: '#ede7f6', text: '#4527a0' },
  delivered:  { bg: '#e0f7fa', text: '#006064' },
  rejected:   { bg: '#ffebee', text: '#c62828' },
  cancelled:  { bg: '#fafafa', text: '#9e9e9e' },
};

export default function OrdersScreen() {
  const { isRole } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [selId, setSelId]       = useState('');
  const [qty, setQty]           = useState('1');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      if (data.success) setOrders(data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = async () => {
    const { data } = await api.get('/products');
    const prods = data.success ? data.data : [];
    setProducts(prods);
    setSelId(prods[0]?._id || '');
  };

  useEffect(() => { load(); }, []);

  const openPlace = async () => { await loadProducts(); setQty('1'); setModal(true); };

  const place = async () => {
    if (!selId) { Alert.alert('Pick a product'); return; }
    const qn = Number(qty);
    if (!qn || qn < 1) { Alert.alert('Invalid quantity'); return; }
    try {
      await api.post('/orders', { orderedItems: [{ productId: selId, quantity: qn }] });
      setModal(false); load();
      Alert.alert('✅ Success', 'Order placed!');
    } catch (e) {
      Alert.alert('Could not place', e.response?.data?.message || e.message);
    }
  };

  const setStatus = async (order, status) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { orderStatus: status }); load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed');
    }
  };

  const ListHeader = () => (
    <>
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>📦 Orders</Text>
          <Text style={styles.heroSub}>Track and manage your orders</Text>
        </View>
      </ImageBackground>
      <View style={styles.toolbar}>
        {isRole('customer', 'admin') ? (
          <PrimaryButton title="＋ New Order" onPress={openPlace} style={{ flex: 1, marginRight: 8 }} />
        ) : null}
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshTxt}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      {loading && orders.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : null}
    </>
  );

  const Row = ({ item }) => {
    const s = STATUS_STYLE[item.orderStatus] || STATUS_STYLE.cancelled;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>Order #{item._id?.slice(-6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.text }]}>{item.orderStatus}</Text>
          </View>
        </View>
        <Text style={styles.meta}>👤 {item.customerName}</Text>
        <Text style={styles.meta}>💰 Total: ${Number(item.totalAmount).toFixed(2)}</Text>
        <Text style={styles.small}>🕒 {new Date(item.orderDate || item.createdAt).toLocaleString()}</Text>
        {isRole('farmer', 'admin') ? (
          <View style={styles.rowBtns}>
            {item.orderStatus === 'pending' ? (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setStatus(item, 'approved')}>
                  <Text style={styles.btnT}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.danger }]} onPress={() => setStatus(item, 'rejected')}>
                  <Text style={styles.btnT}>✗ Reject</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#78909c' }]} onPress={() => setStatus(item, 'processing')}>
                  <Text style={styles.btnT}>Processing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#5c6bc0' }]} onPress={() => setStatus(item, 'shipped')}>
                  <Text style={styles.btnT}>🚚 Shipped</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setStatus(item, 'delivered')}>
                  <Text style={styles.btnT}>✓ Delivered</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No orders yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Row item={item} />
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.back}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>🛒 Place Order</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.opt, selId === p._id && styles.optOn]}
                  onPress={() => setSelId(p._id)}
                >
                  <Text style={styles.optText}>{p.productName} — ${p.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <AppTextInput label="Quantity" keyboardType="number-pad" value={qty} onChangeText={setQty} />
            <PrimaryButton title="Submit Order" onPress={place} />
            <TouchableOpacity onPress={() => setModal(false)} style={{ marginTop: 12 }}>
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: { height: 180, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(27,94,32,0.65)', justifyContent: 'flex-end', padding: 16, paddingBottom: 18 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  toolbar:    { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  refreshBtn: { borderWidth: 1.5, borderColor: colors.primary, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  refreshTxt: { color: colors.primary, fontWeight: '700' },

  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId:     { fontWeight: '800', fontSize: 16, color: colors.primaryDark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta:   { marginTop: 4, color: colors.textMuted, fontSize: 14 },
  small:  { marginTop: 6, fontSize: 11, color: colors.textMuted },
  rowBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textMuted },

  back:       { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },
  opt:    { padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  optOn:  { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optText: { color: colors.text, fontWeight: '500' },
});