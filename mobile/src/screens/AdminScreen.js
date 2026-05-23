/**
 * Admin — dashboard metrics, user management, download reports.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Switch, Alert,
  ScrollView, RefreshControl, ImageBackground,
  TouchableOpacity, Linking,
} from 'react-native';
import colors from '../theme/colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

const BG = require('../../assets/market-bg.png');

function StatCard({ emoji, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const { user } = useAuth();
  const [dash, setDash]     = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  const base = Constants.expoConfig?.extra?.apiUrl?.replace(/\/api\/?$/, '') || '';
  const pdfUrl  = `${base}/api/reports/dashboard/pdf`;
  const jsonUrl = `${base}/api/reports/export/json`;

  const load = async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/users'),
      ]);
      if (d.data.success) setDash(d.data.data);
      if (u.data.success) setUsers(u.data.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Admin only');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user?.role]);

  const toggle = async (u) => {
    try {
      await api.patch(`/reports/users/${u._id}/active`, { isActive: !u.isActive });
      load();
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.message);
    }
  };

  const openReport = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open', 'Copy this URL and open in your browser:\n\n' + url)
    );
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Admin role required.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
    >
      {/* Hero */}
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>⚙️ Admin Panel</Text>
          <Text style={styles.heroSub}>Sales, users & reports</Text>
        </View>
      </ImageBackground>

      <View style={styles.body}>

        {/* Stats */}
        {dash ? (
          <>
            <View style={styles.statsRow}>
              <StatCard emoji="💰" label="Total Sales" value={`$${Number(dash.totalSales).toFixed(0)}`} />
              <StatCard emoji="📦" label="Orders" value={dash.orderCount} />
              <StatCard emoji="👥" label="Active Users" value={dash.activeUsers} />
            </View>

            {/* Top vegetables */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🥦 Top Vegetables (by qty sold)</Text>
              {dash.topSellingVegetables?.slice(0, 5).map((v, i) => (
                <View key={`${v.name}-${i}`} style={styles.rankRow}>
                  <Text style={styles.rankNum}>#{i + 1}</Text>
                  <Text style={styles.rankName}>{v.name}</Text>
                  <Text style={styles.rankValue}>{v.quantitySold} pcs</Text>
                </View>
              ))}
            </View>

            {/* Top farmers */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌾 Top Farmers</Text>
              {dash.topFarmers?.map((f, i) => (
                <View key={`${f.farmerId}-${i}`} style={styles.rankRow}>
                  <Text style={styles.rankNum}>#{i + 1}</Text>
                  <Text style={styles.rankName}>{f.farmerName || 'Unknown'}</Text>
                  <Text style={styles.rankValue}>{f.productCount} products</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.muted}>Pull down to load stats.</Text>
          </View>
        )}

        {/* Download Reports */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📥 Download Reports</Text>
          <Text style={styles.muted}>Tap a button to open the report in your browser.</Text>

          <TouchableOpacity style={styles.downloadBtn} onPress={() => openReport(pdfUrl)}>
            <Text style={styles.downloadEmoji}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.downloadTitle}>Dashboard PDF</Text>
              <Text style={styles.downloadSub}>Full sales & ops report</Text>
            </View>
            <Text style={styles.downloadArrow}>↓</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.downloadBtn, { marginTop: 10 }]} onPress={() => openReport(jsonUrl)}>
            <Text style={styles.downloadEmoji}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.downloadTitle}>Export JSON</Text>
              <Text style={styles.downloadSub}>Raw data export</Text>
            </View>
            <Text style={styles.downloadArrow}>↓</Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            ⚠️ Reports require authentication. If prompted, use your admin credentials.
          </Text>
        </View>

        {/* Users */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Users ({users.length})</Text>
          <FlatList
            scrollEnabled={false}
            data={users}
            keyExtractor={(u) => u._id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <View style={styles.rolePill}>
                    <Text style={styles.roleText}>{item.role}</Text>
                  </View>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggle(item)}
                  trackColor={{ true: colors.primaryLight, false: '#ddd' }}
                  thumbColor={item.isActive ? colors.primary : '#f4f3f4'}
                />
              </View>
            )}
          />
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body:   { padding: 16 },

  hero: { height: 180, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(27,94,32,0.65)', justifyContent: 'flex-end', padding: 16, paddingBottom: 18 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 14, padding: 14, alignItems: 'center' },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  statLabel: { fontSize: 11, color: colors.primary, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: 12 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },

  rankRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankNum:   { width: 28, fontWeight: '800', color: colors.primary, fontSize: 14 },
  rankName:  { flex: 1, color: colors.text, fontWeight: '500' },
  rankValue: { color: colors.textMuted, fontSize: 13 },

  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.border },
  downloadEmoji: { fontSize: 28 },
  downloadTitle: { fontWeight: '700', color: colors.primaryDark, fontSize: 15 },
  downloadSub:   { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  downloadArrow: { fontSize: 20, color: colors.primary, fontWeight: '800' },
  noteText: { color: colors.textMuted, fontSize: 11, marginTop: 12, lineHeight: 16 },

  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontWeight: '800', color: colors.primaryDark, fontSize: 16 },
  name:  { fontWeight: '700', fontSize: 15, color: colors.text },
  email: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rolePill: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  roleText: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});