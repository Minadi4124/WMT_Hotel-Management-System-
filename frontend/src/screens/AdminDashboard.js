import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalReservations: 0,
    availableRooms: 0,
    activeGuests: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const roomsRes = await api.get('/api/rooms');
        const bookingsRes = await api.get('/api/bookings');
        const billingRes = await api.get('/api/billing');

        const available = roomsRes.data.filter(r => r.status === 'Available').length;
        const pending = billingRes.data.filter(b => b.paymentStatus === 'Pending').length;

        setStats({
          totalReservations: bookingsRes.data.length,
          availableRooms: available,
          activeGuests: bookingsRes.data.filter(b => b.status === 'Checked-in').length,
          pendingPayments: pending
        });
      } catch (error) {
        console.error("Stats Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcome}>Executive Portal</Text>
              <Text style={styles.title}>Luxury Control</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Floating Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#e6fffa', borderLeftWidth: 5, borderLeftColor: '#38b2ac' }]}>
              <Ionicons name="people" size={24} color="#38b2ac" />
              <Text style={styles.statValue}>{stats.totalReservations}</Text>
              <Text style={styles.statLabel}>Total Stays</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fffaf0', borderLeftWidth: 5, borderLeftColor: '#c0a062' }]}>
              <Ionicons name="bed" size={24} color="#c0a062" />
              <Text style={styles.statValue}>{stats.availableRooms}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ebf8ff', borderLeftWidth: 5, borderLeftColor: '#4299e1' }]}>
              <Ionicons name="wallet" size={24} color="#4299e1" />
              <Text style={styles.statValue}>{stats.pendingPayments}</Text>
              <Text style={styles.statLabel}>Unpaid</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Master Control Center</Text>

          {/* Luxury Action Cards */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#154749' }]} onPress={() => navigation.navigate('Billing')}>
              <View style={styles.actionIcon}><Ionicons name="cash-outline" size={24} color="#c0a062" /></View>
              <Text style={styles.actionTitle}>Financials</Text>
              <Text style={styles.actionSub}>Audits & Revenue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#c0a062' }]} onPress={() => navigation.navigate('GuestManagement')}>
              <View style={styles.actionIcon}><Ionicons name="people-outline" size={24} color="#fff" /></View>
              <Text style={styles.actionTitle}>Guests</Text>
              <Text style={styles.actionSub}>CRM & Profiles</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2b6cb0' }]} onPress={() => navigation.navigate('Rooms')}>
              <View style={styles.actionIcon}><Ionicons name="bed-outline" size={24} color="#fff" /></View>
              <Text style={styles.actionTitle}>Rooms</Text>
              <Text style={styles.actionSub}>Inventory Control</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#553c9a' }]} onPress={() => navigation.navigate('ManageStaff')}>
              <View style={styles.actionIcon}><Ionicons name="accessibility-outline" size={24} color="#fff" /></View>
              <Text style={styles.actionTitle}>Staff</Text>
              <Text style={styles.actionSub}>Operations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#319795', width: '100%' }]} onPress={() => navigation.navigate('ReservationManagement')}>
              <View style={styles.actionIcon}><Ionicons name="calendar-outline" size={24} color="#fff" /></View>
              <View>
                <Text style={styles.actionTitle}>Reservations & Requests</Text>
                <Text style={styles.actionSub}>Manage active booking requests</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

          {/* Quick Notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="notifications" size={20} color="#154749" />
            <Text style={styles.noticeText}>System running at 100% efficiency. All departments online.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#154749' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 30, backgroundColor: '#154749', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 15, height: 180 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 5, letterSpacing: 0.5 },
  logoutBtn: { padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, marginTop: -60 },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 25, 
    width: '31%', 
    elevation: 8, 
    shadowColor: '#154749', shadowOpacity: 0.15, shadowRadius: 15, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#154749', marginVertical: 4 },
  statLabel: { fontSize: 10, color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1a202c', marginBottom: 20, marginLeft: 5 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  actionBtn: { 
    width: '48%', 
    padding: 20, 
    borderRadius: 30, 
    marginBottom: 15, 
    elevation: 6, 
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  actionIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  actionTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  actionSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 5 },
  noticeBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#edf2f7', 
    padding: 18, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  noticeText: { flex: 1, fontSize: 12, color: '#4a5568', marginLeft: 12, fontWeight: '500' }
});

export default AdminDashboard;
