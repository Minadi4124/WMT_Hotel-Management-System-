import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api, { getCurrentUser } from '../services/api';

const RoomDetailScreen = ({ route, navigation }) => {
  const { room } = route.params;
  const user = getCurrentUser();
  const isForeignRate = user?.guestType === 'Foreign';
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [loading, setLoading] = useState(false);
  
  // Date States
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);

  const discountPercent = room?.discount || 0;
  const originalPrice = isForeignRate ? room?.foreignPrice : room?.localPrice;
  const pricePerNight = originalPrice * (1 - discountPercent / 100);
  const currency = isForeignRate ? '$' : 'Rs';

  const calculateNights = () => {
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const totalPrice = pricePerNight * nights;

  const onCheckInChange = (event, selectedDate) => {
    setShowCheckIn(false);
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!isNaN(date.getTime())) {
        setCheckInDate(date);
        if (date >= checkOutDate) {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);
          setCheckOutDate(nextDay);
        }
      }
    }
  };

  const onCheckOutChange = (event, selectedDate) => {
    setShowCheckOut(false);
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!isNaN(date.getTime())) {
        if (date <= checkInDate) {
          Alert.alert('Invalid Date', 'Check-out date must be after check-in date.');
        } else {
          setCheckOutDate(date);
        }
      }
    }
  };

  const formatDate = (date) => {
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return "";
    }
  };

  const handleBooking = async () => {
    const totalGuests = parseInt(adults) + parseInt(children);
    if (totalGuests > room.capacity) {
      Alert.alert('Capacity Error', `This room can only accommodate up to ${room.capacity} guests.`);
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book a room.');
      navigation.navigate('Account');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        userId: user.id || user._id, 
        roomId: room._id,
        checkInDate: formatDate(checkInDate),
        checkOutDate: formatDate(checkOutDate),
        guests: {
          adults: parseInt(adults),
          children: parseInt(children)
        },
        totalPrice: totalPrice,
        status: 'Pending'
      };

      await api.post('/api/bookings', bookingData);
      
      Alert.alert(
        'Booking Successful!', 
        'Wait for you are checkin. You can see your reservation status in your account.', 
        [{ text: 'OK', onPress: () => navigation.navigate('CustomerApp') }]
      );
    } catch (error) {
      console.error("Booking Error:", error.response?.data || error.message);
      Alert.alert('Booking Failed', error.response?.data?.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: room?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{room?.type} <Text style={{color: '#c0a062'}}>#{room?.roomNumber}</Text></Text>
              <View style={styles.capacityBadge}>
                <Ionicons name="people" size={14} color="#718096" />
                <Text style={styles.capacityText}>Max {room.capacity} Guests</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>{currency} {pricePerNight} <Text style={{ fontSize: 12, color: '#718096' }}>/ night</Text></Text>
              {discountPercent > 0 && (
                <Text style={styles.originalPriceText}>{currency} {originalPrice}</Text>
              )}
              <Text style={styles.totalStayLabel}>Total for {nights} {nights > 1 ? 'nights' : 'night'}: {currency} {totalPrice}</Text>
            </View>
          </View>

          <View style={styles.facilitiesContainer}>
            {(room?.facilities || []).map((fac, index) => (
              <View key={index} style={styles.facilityTag}>
                <Ionicons name="checkmark-circle" size={14} color="#38a169" />
                <Text style={styles.facilityText}>{fac}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Select Dates & Guests</Text>
            
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Check-in Date</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={formatDate(checkInDate)}
                    onChange={(e) => onCheckInChange(null, e.target.value)}
                    style={styles.webInput}
                  />
                ) : (
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckIn(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#154749" />
                    <Text style={styles.dateText}>{formatDate(checkInDate)}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Check-out Date</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={formatDate(checkOutDate)}
                    onChange={(e) => onCheckOutChange(null, e.target.value)}
                    style={styles.webInput}
                  />
                ) : (
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowCheckOut(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#154749" />
                    <Text style={styles.dateText}>{formatDate(checkOutDate)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {Platform.OS !== 'web' && showCheckIn && (
              <DateTimePicker
                value={checkInDate}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCheckInChange}
              />
            )}

            {Platform.OS !== 'web' && showCheckOut && (
              <DateTimePicker
                value={checkOutDate}
                mode="date"
                minimumDate={new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCheckOutChange}
              />
            )}

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adults</Text>
                <View style={styles.counter}>
                  <TouchableOpacity onPress={() => setAdults(Math.max(1, parseInt(adults)-1).toString())}>
                    <Ionicons name="remove-circle-outline" size={26} color="#c0a062" />
                  </TouchableOpacity>
                  <Text style={styles.counterText}>{adults}</Text>
                  <TouchableOpacity onPress={() => setAdults((parseInt(adults)+1).toString())}>
                    <Ionicons name="add-circle-outline" size={26} color="#c0a062" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Children (≤12)</Text>
                <View style={styles.counter}>
                  <TouchableOpacity onPress={() => setChildren(Math.max(0, parseInt(children)-1).toString())}>
                    <Ionicons name="remove-circle-outline" size={26} color="#c0a062" />
                  </TouchableOpacity>
                  <Text style={styles.counterText}>{children}</Text>
                  <TouchableOpacity onPress={() => setChildren((parseInt(children)+1).toString())}>
                    <Ionicons name="add-circle-outline" size={26} color="#c0a062" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.bookButton, 
                (loading || room.status !== 'Available') && { backgroundColor: '#a0aec0', shadowColor: 'transparent' }
              ]} 
              onPress={handleBooking} 
              disabled={loading || room.status !== 'Available'}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>
                  {room.status === 'Available' ? 'Book Now' : 'Room Not Available'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7fafc' },
  container: { flex: 1 },
  image: { width: '100%', height: 300 },
  content: { padding: 20, marginTop: -30, backgroundColor: '#f7fafc', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#154749', marginBottom: 4 },
  capacityBadge: { flexDirection: 'row', alignItems: 'center' },
  capacityText: { fontSize: 13, color: '#718096', marginLeft: 5 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#c0a062', textAlign: 'right' },
  originalPriceText: { fontSize: 14, color: '#a0aec0', textDecorationLine: 'line-through', textAlign: 'right' },
  facilitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  facilityTag: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  facilityText: { fontSize: 13, color: '#4a5568', marginLeft: 6, fontWeight: '500' },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#154749' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  inputGroup: { flex: 0.48 },
  label: { fontSize: 14, color: '#718096', marginBottom: 8, fontWeight: '600' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, backgroundColor: '#f8fafc' },
  dateText: { fontSize: 15, color: '#2d3748', marginLeft: 10 },
  webInput: { padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: 15, color: '#2d3748', width: '100%', outline: 'none' },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 8, backgroundColor: '#f8fafc' },
  counterText: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  bookButton: { backgroundColor: '#c0a062', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, shadowColor: '#c0a062', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6, minHeight: 55, justifyContent: 'center' },
  bookButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  totalStayLabel: { fontSize: 11, color: '#154749', fontWeight: 'bold', marginTop: 4, backgroundColor: '#fffdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }
});

export default RoomDetailScreen;
