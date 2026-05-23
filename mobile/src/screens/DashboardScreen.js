/**
 * Home dashboard — role-aware welcome with market hero background.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

export default function DashboardScreen() {
  const { user, isRole } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!isRole('admin')) return;
    setLoading(true);
    try {
      const { data } = await api.get('/reports/dashboard');
      if (data.success) setStats(data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.role]);

  return (
    <ScrollView
      style={styles.wrap}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
    >
      {/* Hero with market background */}
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEmoji}>🌿</Text>
          <Text style={styles.heroName}>Hello, {user?.name}!</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{user?.role}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.body}>

        {/* About card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 About Farmers Market Hub</Text>
          <Text style={styles.cardBody}>
            Browse fresh vegetables, place orders, and track deliveries. Farmers manage stock; admins
            oversee users and reports; delivery agents update routes in real time.
          </Text>
        </View>

        {/* Admin stats */}
        {isRole('admin') ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Quick Stats</Text>
            {loading && !stats ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
            ) : stats ? (
              <View style={styles.statsRow}>
                <StatCard emoji="💰" label="Total Sales" value={`$${Number(stats.totalSales).toFixed(0)}`} />
                <StatCard emoji="👥" label="Active Users" value={stats.activeUsers} />
                <StatCard emoji="📦" label="Orders" value={stats.orderCount} />
              </View>
            ) : (
              <Text style={styles.cardBody}>Could not load stats. Pull to refresh.</Text>
            )}
          </View>
        ) : null}

        {/* Quick tips by role */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRole('farmer') ? '🌾 Farmer Tips' :
             isRole('delivery') ? '🚚 Delivery Tips' :
             isRole('admin') ? '⚙️ Admin Tips' : '🛒 Shopping Tips'}
          </Text>
          <Text style={styles.cardBody}>
            {isRole('farmer')
              ? 'Manage your stock under the More menu. Keep quantities updated so customers see accurate availability.'
              : isRole('delivery')
              ? 'Check the Delivery tab for assigned routes. Mark orders as delivered when complete.'
              : isRole('admin')
              ? 'Use Reports for full analytics. Monitor payments and reviews from the More tab.'
              : 'Browse the Market tab for fresh produce. Add to cart and track your orders live.'}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: { height: 220, width: '100%' },
  heroOverlay: {
    flex: 1,
    backgroundColor: colors.overlayGreen,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 24,
  },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroName:  { fontSize: 26, fontWeight: '800', color: '#fff' },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  rolePillText: { color: '#fff', fontWeight: '600', textTransform: 'capitalize', fontSize: 13 },

  body: { padding: 16 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.text },
  cardBody:  { color: colors.textMuted, lineHeight: 22, fontSize: 14 },

  // Stats row
  statsRow:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  statCard: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  statLabel: { fontSize: 11, color: colors.primary, marginTop: 2, textAlign: 'center' },
});