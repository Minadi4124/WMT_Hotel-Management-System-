import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { getCurrentUser } from '../services/api';

const BookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Placeholder userId for demo - in real app, get from auth context
  const userId = "69f3b0cc4694f99fc2e536c4"; // chamath

  const fetchBookings = async () => {
    const user = getCurrentUser();
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/bookings');
      const myBookings = response.data.filter(b => b.userId?._id === user.id);
      setBookings(myBookings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000); // Poll every 5 seconds to catch status updates
    return () => clearInterval(interval);
  }, []);

  const renderBooking = ({ item }) => {
    let statusMessage = "";
    let statusColor = "#718096";

    if (item.status === 'Pending') {
      statusMessage = "Waiting for book your rooms...";
      statusColor = "#ecc94b";
    } else if (item.status === 'Confirmed') {
      statusMessage = "Your booking is confirmed! See you soon.";
      statusColor = "#48bb78";
    } else if (item.status === 'Checked-in') {
      statusMessage = "Welcome the room!";
      statusColor = "#4299e1";
    } else if (item.status === 'Checked-out') {
      statusMessage = "Hope you enjoyed your stay!";
      statusColor = "#718096";
    } else if (item.status === 'Cancelled') {
      statusMessage = "Booking cancelled.";
      statusColor = "#e53e3e";
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.roomType}>{item.roomId?.type || 'Room'} #{item.roomId?.roomNumber || '?'}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.dates}>
          {new Date(item.checkInDate).toLocaleDateString()} - {new Date(item.checkOutDate).toLocaleDateString()}
        </Text>

        <View style={styles.messageBox}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle-outline" size={20} color={statusColor} />
            <Text style={[styles.statusMsg, { color: statusColor }]}>{statusMessage}</Text>
          </View>
          
          {item.status === 'Pending' && (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                Alert.alert('Cancel Booking', 'Are you sure you want to cancel this reservation?', [
                  { text: 'No' },
                  { text: 'Yes, Cancel', onPress: async () => {
                    try {
                      await api.put(`/api/bookings/${item._id}`, { status: 'Cancelled' });
                      fetchBookings();
                      Alert.alert('Success', 'Your booking has been cancelled.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to cancel booking');
                    }
                  }}
                ]);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Bookings</Text>
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't booked any rooms yet.</Text>}
          onRefresh={fetchBookings}
          refreshing={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 18, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roomType: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  dates: { fontSize: 14, color: '#718096', marginBottom: 15 },
  messageBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, justifyContent: 'space-between' },
  statusMsg: { fontSize: 13, fontWeight: 'bold', marginLeft: 10 },
  cancelBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e53e3e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cancelBtnText: { color: '#e53e3e', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0' }
});

export default BookingsScreen;
