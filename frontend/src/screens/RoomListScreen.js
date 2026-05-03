import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { getCurrentUser } from '../services/api';

const RoomListScreen = ({ navigation, route }) => {
  const { filterType } = route.params || {};
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(getCurrentUser());
  
  // Filters
  const [showOffersOnly, setShowOffersOnly] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/rooms');
      setRooms(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the resort server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    // 1. Handle "Offers Only" toggle
    if (showOffersOnly && (room.discount || 0) <= 0) return false;
    
    // 2. Handle specific "Family" or "Premium" filters from Home Screen
    if (filterType === 'FAMILY') {
      return room.type?.toLowerCase().includes('family');
    }
    if (filterType === 'PREMIUM') {
      return room.type?.toLowerCase().includes('executive') || room.type?.toLowerCase().includes('suite');
    }
    if (filterType === 'ROMANCE') {
      const type = room.type?.toLowerCase() || '';
      return (type.includes('standard') && type.includes('double')) || type.includes('couple');
    }
    
    return true;
  });

  useEffect(() => {
    fetchRooms();
    
    // Auto-refresh room list every 10 seconds to show real-time availability
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderRoom = ({ item }) => {
    const isForeign = user?.guestType === 'Foreign';
    return (
      <TouchableOpacity 
        style={styles.roomCard} 
        onPress={() => navigation.navigate('RoomDetail', { room: item, isForeignRate: isForeign })}
      >
        <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }} style={styles.roomImage} />
        
        {item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>SAVE {item.discount}%</Text>
          </View>
        )}
        
        {item.status !== 'Available' && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>NOT AVAILABLE</Text>
          </View>
        )}
  
        <View style={styles.roomDetails}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomType}>{item.type} <Text style={{color: '#c0a062'}}>#{item.roomNumber}</Text></Text>
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={14} color="#718096" />
              <Text style={styles.capacityText}>{item.capacity}</Text>
            </View>
          </View>
          
          <Text style={styles.roomFacilities}>{item.facilities.slice(0, 3).join(' • ')}</Text>
          
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Price per night</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.roomPrice}>
                  {isForeign ? '$' : 'Rs'} { (isForeign ? item.foreignPrice : item.localPrice) * (1 - (item.discount || 0) / 100) }
                </Text>
                {item.discount > 0 && (
                  <Text style={styles.originalPrice}>{isForeign ? '$' : 'Rs'} {isForeign ? item.foreignPrice : item.localPrice}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.bookBtn, item.status !== 'Available' && { backgroundColor: '#cbd5e0' }]} 
              onPress={() => item.status === 'Available' && navigation.navigate('RoomDetail', { room: item, isForeignRate: isForeign })}
            >
              <Text style={styles.bookBtnText}>{item.status === 'Available' ? 'View Details' : 'Booked Out'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.mainTitle}>Find Your Room</Text>
          <Text style={styles.subTitle}>{filteredRooms.length} luxury options available</Text>
        </View>
        <TouchableOpacity 
          style={[styles.offerToggle, showOffersOnly && styles.offerToggleActive]} 
          onPress={() => setShowOffersOnly(!showOffersOnly)}
        >
          <Ionicons name="pricetag" size={18} color={showOffersOnly ? "#fff" : "#c0a062"} />
          <Text style={[styles.offerToggleText, showOffersOnly && { color: '#fff' }]}>
            {showOffersOnly ? "All Rooms" : "Offers Only"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#154749" />
          <Text style={styles.loadingText}>Unveiling luxury options...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={50} color="#a0aec0" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRooms}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={<Text style={styles.emptyText}>No rooms found matching your criteria.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  topHeader: { padding: 25, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#154749' },
  subTitle: { fontSize: 13, color: '#a0aec0', marginTop: 2 },
  
  offerToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#c0a062' },
  offerToggleActive: { backgroundColor: '#c0a062' },
  offerToggleText: { fontSize: 13, fontWeight: 'bold', color: '#c0a062', marginLeft: 8 },

  listContainer: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between' },
  roomCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 15,
    width: '48%',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8
  },
  roomImage: { width: '100%', height: 120 },
  
  discountBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#e53e3e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, elevation: 3 },
  discountText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  roomDetails: { padding: 12 },
  roomHeader: { marginBottom: 5 },
  roomType: { fontSize: 15, fontWeight: 'bold', color: '#154749' },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  capacityText: { fontSize: 11, color: '#718096', marginLeft: 4 },
  
  roomFacilities: { fontSize: 10, color: '#a0aec0', marginBottom: 12 },
  
  priceContainer: { borderTopWidth: 1, borderTopColor: '#f7fafc', paddingTop: 10 },
  priceLabel: { fontSize: 9, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 2 },
  roomPrice: { fontSize: 16, fontWeight: 'bold', color: '#154749' },
  originalPrice: { fontSize: 12, color: '#a0aec0', textDecorationLine: 'line-through' },
  
  bookBtn: { backgroundColor: '#154749', paddingVertical: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  loadingText: { textAlign: 'center', marginTop: 15, color: '#154749', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { textAlign: 'center', color: '#718096', marginTop: 15, marginBottom: 20, lineHeight: 20 },
  retryBtn: { backgroundColor: '#154749', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  unavailableOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  unavailableText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});

export default RoomListScreen;
