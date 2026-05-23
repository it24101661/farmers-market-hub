/**
 * Deliveries — admin assigns routes; agents update statuses.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
  RefreshControl, Modal, ScrollView, ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import PrimaryButton from '../components/PrimaryButton';
import AppTextInput from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';

const BG = require('../../assets/market-bg.png');

const STATUSES = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];

const STATUS_COLOR = {
  assigned:   { bg: '#e3f2fd', text: '#1565c0' },
  picked_up:  { bg: '#fff3e0', text: '#e65100' },
  in_transit: { bg: '#ede7f6', text: '#4527a0' },
  delivered:  { bg: '#e8f5e9', text: '#2e7d32' },
  failed:     { bg: '#ffebee', text: '#c62828' },
};

export default function DeliveryScreen() {
  const { isRole } = useAuth();
  const [list, setList]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [orders, setOrders]         = useState([]);
  const [agents, setAgents]         = useState([]);
  const [orderPick, setOrderPick]   = useState('');
  const [agentPick, setAgentPick]   = useState('');
  const [routeTxt, setRouteTxt]     = useState('Hub → Customer');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/deliveries');
      if (data.success) setList(data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const openAssign = async () => {
    const [ordRes, usrRes] = await Promise.all([api.get('/orders'), api.get('/reports/users')]);
    const o = ordRes.data.success ? ordRes.data.data : [];
    const u = usrRes.data.success ? usrRes.data.data.filter((x) => x.role === 'delivery') : [];
    setOrders(o); setAgents(u);
    setOrderPick(o[0]?._id || ''); setAgentPick(u[0]?._id || '');
    setAssignModal(true);
  };

  const assign = async () => {
    if (!orderPick) return Alert.alert('Select order');
    try {
      await api.post('/deliveries', { order: orderPick, deliveryAgent: agentPick || undefined, route: routeTxt });
      setAssignModal(false); load();
    } catch (e) {
      Alert.alert('Assign failed', e.response?.data?.message || e.message);
    }
  };

  const nextStatus = async (item, st) => {
    try {
      await api.put(`/deliveries/${item._id}`, { deliveryStatus: st }); load();
    } catch (e) {
      Alert.alert('Update failed', e.response?.data?.message);
    }
  };

  return (
    <View style={styles.root}>
      {/* Hero */}
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>🚚 Deliveries</Text>
          <Text style={styles.heroSub}>Track and manage delivery routes</Text>
        </View>
      </ImageBackground>

      {isRole('admin') ? (
        <View style={styles.toolbar}>
          <PrimaryButton title="＋ Assign Delivery" onPress={openAssign} />
        </View>
      ) : null}

      <FlatList
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        data={list}
        keyExtractor={(d) => d._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No deliveries yet.</Text>}
        renderItem={({ item }) => {
          const s = STATUS_COLOR[item.deliveryStatus] || STATUS_COLOR.assigned;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>🚚 #{item._id?.slice(-6)}</Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{item.deliveryStatus}</Text>
                </View>
              </View>
              <Text style={styles.meta}>👤 Agent: {item.agentName || 'Unassigned'}</Text>
              <Text style={styles.meta}>📍 Route: {item.route || '—'}</Text>

              {isRole('admin', 'delivery') ? (
                <View style={styles.pills}>
                  {STATUSES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.pill, item.deliveryStatus === st && styles.pillActive]}
                      onPress={() => nextStatus(item, st)}
                    >
                      <Text style={[styles.pillT, item.deliveryStatus === st && styles.pillTActive]}>
                        {st.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {isRole('admin', 'delivery') ? (
                <TouchableOpacity onPress={() => nextStatus(item, 'delivered')}>
                  <Text style={styles.link}>⏱ Set to now (demo)</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />

      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.back}>
          <ScrollView style={styles.box}>
            <Text style={styles.h}>📦 New Delivery Assignment</Text>
            <Text style={styles.lab}>Select Order</Text>
            {orders.map((o) => (
              <TouchableOpacity
                key={o._id}
                style={[styles.opt, orderPick === o._id && styles.optOn]}
                onPress={() => setOrderPick(o._id)}
              >
                <Text style={styles.optText}>Order #{o._id.slice(-6)} · {o.customerName}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.lab}>Delivery Agent</Text>
            {agents.map((a) => (
              <TouchableOpacity
                key={a._id}
                style={[styles.opt, agentPick === a._id && styles.optOn]}
                onPress={() => setAgentPick(a._id)}
              >
                <Text style={styles.optText}>{a.name}</Text>
              </TouchableOpacity>
            ))}
            <AppTextInput label="Route notes" value={routeTxt} onChangeText={setRouteTxt} />
            <PrimaryButton title="Assign" onPress={assign} />
            <TouchableOpacity onPress={() => setAssignModal(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: { height: 140, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(27,94,32,0.65)', justifyContent: 'flex-end', padding: 16, paddingBottom: 18 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  toolbar: { padding: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },

  card: { backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId:  { fontWeight: '800', color: colors.primaryDark, fontSize: 15 },
  badge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta:    { color: colors.textMuted, marginTop: 4, fontSize: 14 },
  pills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  pill:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  pillT:   { fontSize: 11, fontWeight: '600', color: colors.primaryDark, textTransform: 'capitalize' },
  pillTActive: { color: '#fff' },
  link:    { marginTop: 10, color: colors.primary, fontWeight: '600', fontSize: 13 },
  empty:   { textAlign: 'center', marginTop: 40, color: colors.textMuted },

  back: { flex: 1, backgroundColor: '#00000077', justifyContent: 'center', padding: 16 },
  box:  { backgroundColor: colors.card, borderRadius: 20, padding: 20 },
  h:    { fontSize: 18, fontWeight: '800', marginBottom: 16, color: colors.primaryDark },
  lab:  { marginVertical: 8, fontWeight: '700', color: colors.text },
  opt:  { padding: 12, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8, borderRadius: 12 },
  optOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optText: { color: colors.text, fontWeight: '500' },
});