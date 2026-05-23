import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import colors from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MoreStack from './MoreStack';

const Tab = createBottomTabNavigator();

function tabIcon(icon) {
  return function Icon({ focused }) {
    return (
      <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 18 }}>
        {icon}
      </Text>
    );
  };
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,   // ← hides the nav bar so hero images show fully
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: tabIcon('🏠'), title: 'Home' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ tabBarIcon: tabIcon('🛒'), title: 'Market' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: tabIcon('📦'), title: 'Orders' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ headerShown: false, tabBarIcon: tabIcon('⋯') }}
      />
    </Tab.Navigator>
  );
}