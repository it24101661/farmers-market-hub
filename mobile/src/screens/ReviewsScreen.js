/**
 * Reviews — market hero + star rating picker + beautiful cards.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, ScrollView, RefreshControl, ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';

const BG = require('../../assets/market-bg.png');

function StarPicker({ value, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Text style={[styles.star, s <= value && styles.starOn]}>★</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.starLabel}>{value} / 5</Text>
    </View>
  );
}

export default function ReviewsScreen() {
  const { user, isRole } = useAuth();
  const [reviews, setReviews]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [productId, setProductId] = useState('');
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState('');
  const [average, setAverage]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews');
      if (data.success) setReviews(data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = async () => {
    const { data } = await api.get('/products');
    if (data.success) {
      setProducts(data.data);
      setProductId(data.data[0]?._id || '');
    }
  };

  useEffect(() => { load(); }, []);

  const loadAvg = async (pid) => {
    try {
      const { data } = await api.get(`/reviews/product/${pid}/average`);
      if (data.success) setAverage(data.data);
    } catch { setAverage(null); }
  };

  const ownsReview = (item) =>
    String(item.customer) === String(user?.id) || item.customerName === user?.name;

  const submit = async () => {
    if (!productId) return Alert.alert('Pick a product');
    try {
      await api.post('/reviews', { product: productId, rating, comment });
      setModal(false); setComment(''); setRating(5);
      load(); loadAvg(productId);
      Alert.alert('✅ Review submitted!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  };

  const removeOwn = async (rev) => {
    Alert.alert('Delete review?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/reviews/${rev._id}`); load(); }
        catch (e) { Alert.alert('Failed', e.response?.data?.message); }
      }},
    ]);
  };

  const adminRemove = async (rev) => {
    try {
      await api.patch(`/reviews/${rev._id}/remove`, { reason: 'Policy' });
      load();
    } catch (e) { Alert.alert('Failed', e.response?.data?.message); }
  };

  const renderStars = (n) =>
    [1,2,3,4,5].map((s) => (
      <Text key={s} style={{ color: s <= n ? '#f9a825' : '#ddd', fontSize: 16 }}>★</Text>
    ));

  const ListHeader = () => (
    <>
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>⭐ Reviews</Text>
          <Text style={styles.heroSub}>See what customers are saying</Text>
        </View>
      </ImageBackground>
      {isRole('customer', 'admin') ? (
        <View style={{ padding: 16 }}>
          <PrimaryButton
            title="＋ Add Review"
            onPress={async () => { await loadProducts(); setModal(true); }}
          />
        </View>
      ) : null}
      {reviews.length > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.summaryCount}>{reviews.length} reviews</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        data={reviews}
        keyExtractor={(r) => r._id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⭐</Text>
              <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.vegetableName}</Text>
                <Text style={styles.customerName}>by {item.customerName}</Text>
              </View>
              <View style={styles.starsRow}>{renderStars(item.rating)}</View>
            </View>
            {item.comment ? (
              <Text style={styles.comment}>"{item.comment}"</Text>
            ) : null}
            <View style={styles.actionRow}>
              {ownsReview(item) ? (
                <TouchableOpacity onPress={() => removeOwn(item)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>🗑 Delete mine</Text>
                </TouchableOpacity>
              ) : null}
              {isRole('admin') ? (
                <TouchableOpacity onPress={() => adminRemove(item)} style={styles.adminBtn}>
                  <Text style={styles.adminBtnText}>⚠️ Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.backdrop}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>⭐ Write a Review</Text>

            <Text style={styles.sectionLabel}>Select Product</Text>
            {products.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={[styles.opt, productId === p._id && styles.optOn]}
                onPress={() => { setProductId(p._id); loadAvg(p._id); }}
              >
                <Text style={[styles.optText, productId === p._id && styles.optTextOn]}>
                  {p.productName}
                </Text>
              </TouchableOpacity>
            ))}

            {average ? (
              <View style={styles.avgBox}>
                <Text style={styles.avgText}>
                  Current average: {'★'.repeat(Math.round(average.averageRating))} {average.averageRating} ({average.reviewCount} reviews)
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Your Rating</Text>
            <StarPicker value={rating} onChange={setRating} />

            <Text style={styles.sectionLabel}>Comment</Text>
            <AppTextInput
              placeholder="Share your experience..."
              value={comment}
              onChangeText={setComment}
            />

            <PrimaryButton title="Submit Review" onPress={submit} />
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

  summary:      { paddingHorizontal: 16, paddingBottom: 4 },
  summaryCount: { color: colors.textMuted, fontSize: 13 },

  card: { backgroundColor: colors.card, padding: 16, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  productName:  { fontWeight: '800', fontSize: 16, color: colors.primaryDark },
  customerName: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  starsRow:     { flexDirection: 'row' },
  comment:      { color: colors.text, fontSize: 14, lineHeight: 20, fontStyle: 'italic', marginBottom: 8 },
  actionRow:    { flexDirection: 'row', gap: 12, marginTop: 4 },
  deleteBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#ffebee' },
  deleteBtnText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  adminBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#fff3e0' },
  adminBtnText: { color: '#e65100', fontWeight: '600', fontSize: 13 },

  empty:      { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { color: colors.textMuted, fontSize: 16 },

  backdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  opt:       { padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  optOn:     { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optText:   { color: colors.text, fontWeight: '500' },
  optTextOn: { color: colors.primaryDark, fontWeight: '700' },

  avgBox:  { backgroundColor: '#fff8e1', borderRadius: 10, padding: 10, marginBottom: 8 },
  avgText: { color: '#f9a825', fontWeight: '600', fontSize: 13 },

  starRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  star:     { fontSize: 36, color: '#ddd' },
  starOn:   { color: '#f9a825' },
  starLabel: { color: colors.textMuted, fontSize: 14, marginLeft: 8 },
});