/**
 * More menu — hub links with market hero header.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

const BG = require('../../assets/market-bg.png');

export default function MoreMenuScreen({ navigation }) {
  const { user, logout, isRole } = useAuth();

  const Item = ({ emoji, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chev}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.wrap}>
      {/* Hero */}
      <ImageBackground source={BG} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEmoji}>⋯</Text>
          <Text style={styles.heroTitle}>More</Text>
          <View style={styles.emailPill}>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Menu items */}
      <View style={styles.section}>
        <Item emoji="⭐" title="Reviews" subtitle="Ratings & comments" onPress={() => navigation.navigate('Reviews')} />
        <Item emoji="💳" title="Payments" subtitle="History & record payments" onPress={() => navigation.navigate('Payments')} />
        {isRole('delivery', 'admin') ? (
          <Item
            emoji="🚚"
            title="Deliveries"
            subtitle={isRole('delivery') ? 'Your assigned routes' : 'All deliveries'}
            onPress={() => navigation.navigate('Deliveries')}
          />
        ) : null}
        {isRole('farmer', 'admin') ? (
          <Item emoji="🌾" title="My Stock" subtitle="Harvested vegetables" onPress={() => navigation.navigate('Stock')} />
        ) : null}
        {isRole('admin') ? (
          <Item emoji="⚙️" title="Admin Dashboard" subtitle="Users, exports, KPIs" onPress={() => navigation.navigate('Admin')} />
        ) : null}
      </View>

      <View style={styles.logoutWrap}>
        <PrimaryButton title="Log Out" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },

  hero: { height: 160, width: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(27,94,32,0.7)', justifyContent: 'flex-end', padding: 16, paddingBottom: 20 },
  heroEmoji: { fontSize: 28, marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  emailPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  emailText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  section: { backgroundColor: colors.card, marginTop: 16, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowEmoji: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  sub:      { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  chev:     { fontSize: 22, color: colors.primary, fontWeight: '300' },

  logoutWrap: { margin: 16, marginTop: 24 },
});