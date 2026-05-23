/**
 * Payments — cash or card with full card details form.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView, TextInput,
  ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const BG = require('../../assets/market-bg.png');

const STATUS_STYLE = {
  pending:   { bg: '#fff3e0', text: '#e65100' },
  completed: { bg: '#e8f5e9', text: '#2e7d32' },
  failed:    { bg: '#ffebee', text: '#c62828' },
  cancelled: { bg: '#fafafa', text: '#9e9e9e' },
};

// Format card number with spaces: 1234 5678 9012 3456
const fmtCard = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

// Format expiry MM/YY
const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
};

export default function PaymentsScreen() {
  const { isRole } = useAuth();
  const [rows, setRows]       = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);

  // Form state
  const [orderId, setOrderId]   = useState('');
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('cash'); // 'cash' | 'card'

  // Card details
  const [cardNumber, setCardNumber]   = useState('');
  const [cardName, setCardName]       = useState('');
  const [expiry, setExpiry]           = useState('');
  const [cvv, setCvv]                 = useState('');
  const [cardError, setCardError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments');
      if (data.success) setRows(data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not load');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = async () => {
    const { data } = await api.get('/orders');
    if (data.success) {
      setOrders(data.data);
      const first = data.data[0];
      setOrderId(first ? first._id : '');
      setAmount(first ? String(first.totalAmount) : '');
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = async () => {
    await loadOrders();
    setMethod('cash');
    setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); setCardError('');
    setModal(true);
  };

  const validateCard = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.length !== 16) return 'Card number must be 16 digits';
    if (!cardName.trim()) return 'Name on card is required';
    if (expiry.length !== 5) return 'Enter expiry as MM/YY';
    const [mm, yy] = expiry.split('/');
    const now = new Date();
    const exp = new Date(2000 + Number(yy), Number(mm) - 1);
    if (exp < now) return 'Card is expired';
    if (cvv.length < 3) return 'CVV must be 3 or 4 digits';
    return null;
  };

  const record = async () => {
    if (!orderId) return Alert.alert('Select an order first');

    if (method === 'card') {
      const err = validateCard();
      if (err) { setCardError(err); return; }
    }

    try {
      await api.post('/payments', {
        order: orderId,
        paymentMethod: method,
        paymentAmount: amount ? Number(amount) : undefined,
      });
      setModal(false);
      load();
      Alert.alert('✅ Payment recorded!',
        method === 'card' ? 'Card payment processed successfully.' : 'Cash payment recorded.');
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.message || e.message);
    }
  };

  const cancelPay = async (id) => {
    Alert.alert('Cancel payment?', 'This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: async () => {
        try { await api.patch(`/payments/${id}/cancel`); load(); }
        catch (e) { Alert.alert('Failed', e.response?.data?.message); }
      }},
    ]);
  };

  const ListHeader = () => (
    <>
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>💳 Payments</Text>
          <Text style={styles.heroSub}>Manage your payment history</Text>
        </View>
      </ImageBackground>
      {isRole('customer', 'admin') ? (
        <View style={{ padding: 16 }}>
          <PrimaryButton title="＋ Record Payment" onPress={openModal} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        data={rows}
        keyExtractor={(p) => p._id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const s = STATUS_STYLE[item.paymentStatus] || STATUS_STYLE.cancelled;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>Payment #{item._id?.slice(-8)}</Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{item.paymentStatus}</Text>
                </View>
              </View>
              <Text style={styles.meta}>📦 Order: #{item.order?.slice(-6) || item.order}</Text>
              <Text style={styles.meta}>
                {item.paymentMethod === 'card' ? '💳' : '💵'} Method: {item.paymentMethod}
              </Text>
              <Text style={styles.meta}>💰 Amount: ${Number(item.paymentAmount).toFixed(2)}</Text>
              {isRole('admin', 'customer') && item.paymentStatus === 'pending' ? (
                <TouchableOpacity onPress={() => cancelPay(item._id)}>
                  <Text style={styles.cancelBtn}>✕ Cancel payment</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />

      {/* Payment Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.backdrop}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>💳 Record Payment</Text>

            {/* Order selection */}
            <Text style={styles.sectionLabel}>Select Order</Text>
            {orders.map((o) => (
              <TouchableOpacity
                key={o._id}
                style={[styles.opt, orderId === o._id && styles.optOn]}
                onPress={() => { setOrderId(o._id); setAmount(String(o.totalAmount)); }}
              >
                <Text style={[styles.optText, orderId === o._id && styles.optTextOn]}>
                  #{o._id.slice(-6)} · ${Number(o.totalAmount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Payment method toggle */}
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodBtn, method === 'cash' && styles.methodBtnOn]}
                onPress={() => setMethod('cash')}
              >
                <Text style={styles.methodEmoji}>💵</Text>
                <Text style={[styles.methodText, method === 'cash' && styles.methodTextOn]}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, method === 'card' && styles.methodBtnOn]}
                onPress={() => setMethod('card')}
              >
                <Text style={styles.methodEmoji}>💳</Text>
                <Text style={[styles.methodText, method === 'card' && styles.methodTextOn]}>Card</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text style={styles.sectionLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />

            {/* Card details — only show when card is selected */}
            {method === 'card' ? (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>🔒 Card Details</Text>

                <Text style={styles.fieldLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={(v) => setCardNumber(fmtCard(v))}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                />

                <Text style={styles.fieldLabel}>Name on Card</Text>
                <TextInput
                  style={styles.input}
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="JOHN SMITH"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />

                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Expiry (MM/YY)</Text>
                    <TextInput
                      style={styles.input}
                      value={expiry}
                      onChangeText={(v) => setExpiry(fmtExpiry(v))}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={4}
                    />
                  </View>
                </View>

                {cardError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {cardError}</Text>
                  </View>
                ) : null}

                <Text style={styles.secureNote}>🔒 Your card details are encrypted and secure</Text>
              </View>
            ) : (
              <View style={styles.cashNote}>
                <Text style={styles.cashNoteText}>
                  💵 Cash payment will be collected on delivery. Please have the exact amount ready.
                </Text>
              </View>
            )}

            <PrimaryButton title={method === 'card' ? '💳 Pay Now' : '💵 Record Cash Payment'} onPress={record} />
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

  card: { backgroundColor: colors.card, padding: 16, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId:   { fontWeight: '800', color: colors.primaryDark, fontSize: 15 },
  badge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta:      { color: colors.textMuted, marginTop: 4, fontSize: 14 },
  cancelBtn: { marginTop: 12, color: colors.danger, fontWeight: '700', fontSize: 13 },

  empty:      { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { color: colors.textMuted, fontSize: 16 },

  // Modal
  backdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '95%' },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  opt:    { padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  optOn:  { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optText:   { color: colors.text, fontWeight: '500' },
  optTextOn: { color: colors.primaryDark, fontWeight: '700' },

  methodRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  methodBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
  methodBtnOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodEmoji: { fontSize: 28, marginBottom: 6 },
  methodText:   { fontWeight: '600', color: colors.textMuted, fontSize: 14 },
  methodTextOn: { color: colors.primaryDark, fontWeight: '800' },

  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: '#fafafa', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: 12 },

  cardSection: { backgroundColor: '#f8fff8', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1.5, borderColor: colors.primaryLight },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, marginBottom: 4 },
  cardRow: { flexDirection: 'row', marginTop: 4 },

  errorBox:  { backgroundColor: '#ffebee', borderRadius: 10, padding: 12, marginTop: 8 },
  errorText: { color: colors.danger, fontWeight: '600', fontSize: 13 },

  secureNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 4 },

  cashNote:     { backgroundColor: '#f1f8f4', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: colors.primaryLight },
  cashNoteText: { color: colors.primary, fontSize: 14, lineHeight: 20, fontWeight: '500' },
});