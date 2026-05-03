import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import BookingsScreen from '../screens/BookingsScreen';
import AdminDashboard from '../screens/AdminDashboard';
import ManageRoomsScreen from '../screens/ManageRoomsScreen';
import BillingScreen from '../screens/BillingScreen';
import RoomListScreen from '../screens/RoomListScreen';
import GuestManagementScreen from '../screens/GuestManagementScreen';
import ReservationManagementScreen from '../screens/ReservationManagementScreen';
import ManageStaffScreen from '../screens/ManageStaffScreen';
import ContactStaffScreen from '../screens/ContactStaffScreen';
import MyBillsScreen from '../screens/MyBillsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0a3d3e', 
        paddingBottom: 25,
        paddingTop: 10,
        height: 85,
        borderTopWidth: 0,
        elevation: 10,
      },
      tabBarActiveTintColor: '#ffffff',
      tabBarInactiveTintColor: '#88a9a9',
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Explore') iconName = 'search';
        else if (route.name === 'Reservations') iconName = 'calendar';
        else if (route.name === 'Staff') iconName = 'call';
        else if (route.name === 'Bills') iconName = 'receipt';
        else if (route.name === 'Account') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Explore" component={HomeScreen} />
    <Tab.Screen name="Reservations" component={BookingsScreen} />
    <Tab.Screen name="Staff" component={ContactStaffScreen} />
    <Tab.Screen name="Bills" component={MyBillsScreen} />
    <Tab.Screen name="Account" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Rooms" component={ManageRoomsScreen} />
    <Tab.Screen name="Staff" component={ManageStaffScreen} />
    <Tab.Screen name="Billing" component={BillingScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CustomerApp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CustomerApp" component={CustomerTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AdminApp" component={AdminTabs} />
        <Stack.Screen name="RoomList" component={RoomListScreen} options={{ headerShown: true, title: 'Find a Room' }} />
        <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ headerShown: true, title: 'Room Details' }} />
        <Stack.Screen name="GuestManagement" component={GuestManagementScreen} options={{ headerShown: true, title: 'Guest Management' }} />
        <Stack.Screen name="ReservationManagement" component={ReservationManagementScreen} options={{ headerShown: true, title: 'Reservations' }} />
        <Stack.Screen name="ManageStaff" component={ManageStaffScreen} options={{ headerShown: true, title: 'Staff Operations' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
