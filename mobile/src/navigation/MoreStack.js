import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import AdminScreen from '../screens/AdminScreen';
import StockScreen from '../screens/StockScreen';

const Stack = createNativeStackNavigator();

export default function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu"   component={MoreMenuScreen} />
      <Stack.Screen name="Reviews"    component={ReviewsScreen} />
      <Stack.Screen name="Payments"   component={PaymentsScreen} />
      <Stack.Screen name="Deliveries" component={DeliveryScreen} />
      <Stack.Screen name="Admin"      component={AdminScreen} />
      <Stack.Screen name="Stock"      component={StockScreen} />
    </Stack.Navigator>
  );
}