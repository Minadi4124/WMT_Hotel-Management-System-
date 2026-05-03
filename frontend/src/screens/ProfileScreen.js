import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, logout } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(getCurrentUser());

  const handleSignOut = () => {
    console.log("Sign out button pressed");
    
    const performLogout = () => {
      console.log("Performing logout...");
      logout();
      setUser(null);
      navigation.navigate('Explore');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', onPress: performLogout }
        ]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          <Text style={styles.notLoggedInText}>You are not signed in</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200' }} 
            style={styles.avatar} 
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </View>
        
        <Text style={styles.fullName}>{user.fullName || 'Guest User'}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={22} color="#154749" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={22} color="#154749" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user.phone || '+94 77 123 4567'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={22} color="#154749" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>Colombo, Sri Lanka</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color="#fff" style={{marginRight: 10}} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#154749' },
  
  profileCard: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 30, marginBottom: 20 },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c0a062', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  
  fullName: { fontSize: 24, fontWeight: 'bold', color: '#154749' },
  username: { fontSize: 14, color: '#718096', marginBottom: 12 },
  roleBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#4a5568', letterSpacing: 1 },
  
  infoSection: { backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f7fafc' },
  infoTextContainer: { marginLeft: 20 },
  infoLabel: { fontSize: 12, color: '#a0aec0', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#2d3748', fontWeight: '500' },
  
  signOutBtn: { backgroundColor: '#e53e3e', margin: 25, padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notLoggedInText: { fontSize: 18, color: '#718096', marginTop: 15, marginBottom: 25 },
  loginBtn: { backgroundColor: '#154749', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default ProfileScreen;
