import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import CustomerCreateScreen from '../screens/CustomerCreateScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import OrderCreateScreen from '../screens/OrderCreateScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MasterMenuScreen from '../screens/MasterMenuScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="CustomerCreate" 
              component={CustomerCreateScreen} 
              options={{ headerShown: true, title: 'New Customer', headerBackTitle: 'Back' }} 
            />
            <Stack.Screen 
              name="CustomerDetail" 
              component={CustomerDetailScreen} 
              options={{ headerShown: true, title: 'Client Profile', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0f172a' }} 
            />
            <Stack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen} 
              options={{ headerShown: true, title: 'Order Details', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} 
            />
            <Stack.Screen 
              name="OrderCreate" 
              component={OrderCreateScreen} 
              options={{ headerShown: true, title: 'Build New Event', headerBackTitle: 'Cancel', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} 
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ headerShown: true, title: 'My Profile', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0f172a' }} 
            />
            <Stack.Screen 
              name="MasterMenu" 
              component={MasterMenuScreen} 
              options={{ headerShown: true, title: 'Master Menu Directory', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0f172a' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
