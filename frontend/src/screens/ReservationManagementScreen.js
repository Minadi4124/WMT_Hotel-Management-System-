import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'];

const ReservationManagementScreen = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchReservations = async () => {
    try {
      const response = await api.get('/api/bookings');
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReservations(sorted);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    if (processingId === id) return;
    
    // Optimistic UI Update: Change local state immediately
    const previousReservations = [...reservations];
    const updatedReservations = reservations.map(res => 
      res._id === id ? { ...res, status: newStatus } : res
    );
    setReservations(updatedReservations);
    setProcessingId(id);

    try {
      console.log(`Updating booking ${id} to ${newStatus}...`);
      await api.put(`/api/bookings/${id}`, { status: newStatus });
      
      if (newStatus === 'Checked-out') {
        await api.post(`/api/billing/generate/${id}`);
        Alert.alert('✅ Success', 'Guest checked out. Bill generated in Finance section.');
      }
      
      // Re-fetch to ensure sync with server (e.g. for counts)
      fetchReservations();
    } catch (error) {
      console.error("Update Error:", error);
      // Revert on error
      setReservations(previousReservations);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status. Please check your connection.');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmAction = (id, newStatus, message) => {
    Alert.alert('Confirm Action', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Proceed', onPress: () => updateStatus(id, newStatus) }
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ecc94b';
      case 'Confirmed': return '#48bb78';
      case 'Checked-in': return '#4299e1';
      case 'Checked-out': return '#718096';
      case 'Cancelled': return '#e53e3e';
      default: return '#cbd5e0';
    }
  };

  const getCount = (status) => {
    if (status === 'All') return reservations.length;
    return reservations.filter(r => r.status === status).length;
  };

  const filteredData = reservations.filter(r => filter === 'All' || r.status === filter);

  const renderReservation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{item.userId?.fullName || 'Guest'}</Text>
          <Text style={styles.guestContact}>{item.userId?.phoneNumber} • {item.userId?.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name="time-outline" size={12} color="#fff" style={{marginRight: 4}} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Ionicons name="bed-outline" size={18} color="#154749" />
          <Text style={styles.detailText}>{item.roomId?.type || 'Room'} #{item.roomId?.roomNumber || '?'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={18} color="#154749" />
          <Text style={styles.detailText}>{item.guests?.adults} Adults, {item.guests?.children} Children</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color="#154749" />
          <Text style={styles.detailText}>
            {new Date(item.checkInDate).toLocaleDateString()} → {new Date(item.checkOutDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === 'Pending' && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>⏳ Waiting for confirmation</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        {item.status === 'Pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.confirmBtn]} 
              onPress={() => updateStatus(item._id, 'Confirmed')}
            >
              <Text style={styles.btnText}>✓ Confirm Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]} 
              onPress={() => confirmAction(item._id, 'Cancelled', 'Cancel this request?')}
            >
              <Text style={styles.btnText}>✕ Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'Confirmed' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.checkInBtn]} 
            onPress={() => updateStatus(item._id, 'Checked-in')}
          >
            <Text style={styles.btnText}>→ Check-in Guest</Text>
          </TouchableOpacity>
        )}

        {item.status === 'Checked-in' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.checkOutBtn]} 
            onPress={() => updateStatus(item._id, 'Checked-out')}
          >
            <Text style={styles.btnText}>✓ Check-out & Bill</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Reservations & Requests</Text>
        
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity 
                key={f} 
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
                <View style={[styles.countBadge, filter === f && styles.countBadgeActive]}>
                  <Text style={[styles.countText, filter === f && styles.countTextActive]}>{getCount(f)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#154749" style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderReservation}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No {filter.toLowerCase()} reservations found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7f6' },
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749', marginHorizontal: 20, marginTop: 20, marginBottom: 15 },
  
  filterContainer: { backgroundColor: '#f4f7f6', paddingBottom: 10 },
  filterScroll: { paddingHorizontal: 15 },
  filterTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  filterTabActive: { backgroundColor: '#154749', borderColor: '#154749' },
  filterTabText: { fontSize: 13, fontWeight: 'bold', color: '#718096' },
  filterTabTextActive: { color: '#fff' },
  countBadge: { backgroundColor: '#edf2f7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontSize: 11, fontWeight: 'bold', color: '#2d3748' },
  countTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 15, padding: 18, marginBottom: 20, marginHorizontal: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  guestName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  guestContact: { fontSize: 12, color: '#718096', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  detailsBox: { borderTopWidth: 1, borderTopColor: '#f0f2f2', paddingTop: 15, marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#4a5568', marginLeft: 10 },
  
  waitingBanner: { backgroundColor: '#fffaf0', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#f6ad55', marginBottom: 15 },
  waitingText: { fontSize: 13, color: '#c0a062', fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { backgroundColor: '#48bb78' },
  checkInBtn: { backgroundColor: '#4299e1' },
  checkOutBtn: { backgroundColor: '#718096' },
  cancelBtn: { backgroundColor: '#e53e3e' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0', fontSize: 15 }
});

export default ReservationManagementScreen;
