import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Modal, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const ROOM_TYPES = [
  'Single Room', 'Standard Double', 'Deluxe Suite', 
  'Family Room', 'Couple Room', 'Team Room'
];

const ROOM_IMAGES = {
  'Single Room': 'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?q=80&w=1032',
  'Standard Double': 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1032',
  'Deluxe Suite': 'https://images.unsplash.com/photo-1729605411476-defbdab14c54?q=80&w=1170',
  'Family Room': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1170',
  'Couple Room': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1170',
  'Team Room': 'https://images.unsplash.com/photo-1770941633927-b7a15557e0e1?w=1000'
};
const ROOM_STATUSES = ['Available', 'Out of Order', 'Repair'];

const ManageRoomsScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  
  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [type, setType] = useState('');
  const [localPrice, setLocalPrice] = useState('');
  const [foreignPrice, setForeignPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [facilities, setFacilities] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Available');
  const [discount, setDiscount] = useState('0');
  const [isPromotional, setIsPromotional] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms?showAll=true');
      setRooms(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch rooms');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoomId(null);
    resetForm();
    setModalVisible(true);
  };

  const handleTypeSelect = (t) => {
    setType(t);
    // Auto-generate image if not in editing mode or if the image is currently empty/default
    if (!editingRoomId || !image || Object.values(ROOM_IMAGES).includes(image)) {
      setImage(ROOM_IMAGES[t]);
    }
  };

  const openEditModal = (room) => {
    setEditingRoomId(room._id);
    setRoomNumber(room.roomNumber || '');
    setType(room.type);
    setLocalPrice(room.localPrice.toString());
    setForeignPrice(room.foreignPrice.toString());
    setCapacity(room.capacity.toString());
    setFacilities(room.facilities.join(', '));
    setImage(room.image || ROOM_IMAGES[room.type] || '');
    setStatus(room.status || 'Available');
    setDiscount((room.discount || 0).toString());
    setIsPromotional(room.isPromotional);
    setModalVisible(true);
  };

  const handleSaveRoom = async () => {
    if (!type || !localPrice || !foreignPrice || !capacity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const roomData = {
      roomNumber,
      type,
      localPrice: Number(localPrice),
      foreignPrice: Number(foreignPrice),
      capacity: Number(capacity),
      facilities: facilities.split(',').map(f => f.trim()),
      image,
      status,
      discount: Number(discount) || 0,
      isPromotional
    };

    try {
      if (editingRoomId) {
        await api.put(`/api/rooms/${editingRoomId}`, roomData);
        Alert.alert('Success', 'Room updated successfully');
      } else {
        await api.post('/api/rooms', roomData);
        Alert.alert('Success', 'Room added successfully');
      }
      setModalVisible(false);
      resetForm();
      fetchRooms();
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingRoomId ? 'update' : 'add'} room`);
    }
  };

  const resetForm = () => {
    setRoomNumber(''); setType(''); setLocalPrice(''); setForeignPrice(''); setCapacity(''); setFacilities(''); setImage(''); setStatus('Available'); setDiscount('0'); setIsPromotional(false);
  };

  const handleDelete = (id) => {
    performDelete(id);
  };

  const performDelete = async (id) => {
    console.log(`FRONTEND: ATTEMPTING TO DELETE ROOM WITH ID: ${id}`);
    try {
      const response = await api.delete(`/api/rooms/${id}`);
      console.log(`FRONTEND: DELETE SUCCESSFUL for ID: ${id}`, response.data);
      fetchRooms();
      if (Platform.OS === 'web') {
        window.alert('Room deleted successfully!');
      } else {
        Alert.alert('Success', 'Room deleted');
      }
    } catch (error) {
      console.error("FRONTEND: DELETE ERROR:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || error.message;
      if (Platform.OS === 'web') {
        window.alert(`Failed to delete room: ${errMsg}`);
      } else {
        Alert.alert('Error', `Failed to delete room: ${errMsg}`);
      }
    }
  };

  const renderRoom = ({ item }) => (
    <View style={[styles.card, item.isPromotional && styles.promoCard]}>
      <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }} style={styles.thumbnail} />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.roomNumber}>#{item.roomNumber}</Text>
          <Text style={styles.roomType}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Available' ? '#48bb78' : item.status === 'Repair' ? '#ed8936' : '#e53e3e' }]}>
            <Text style={styles.statusBadgeText}>{item.status}</Text>
          </View>
          {item.isPromotional && <Text style={styles.promoBadge}>PROMO</Text>}
        </View>
        <Text style={styles.details}>Local: Rs {item.localPrice} | Foreign: ${item.foreignPrice}</Text>
        <Text style={styles.details}>Capacity: {item.capacity} Guests | Discount: {item.discount > 0 ? `${item.discount}%` : 'None'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => openEditModal(item)}>
          <Ionicons name="pencil-outline" size={22} color="#3182ce" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionIcon, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', padding: 8, borderRadius: 8, marginTop: 5 }]} 
          onPress={() => handleDelete(item._id || item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#e53e3e" />
          <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: 'bold', marginLeft: 5 }}>Delete Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Rooms</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Add Room</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No rooms available. Click "Add Room" to create one.</Text>}
        />

        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingRoomId ? 'Edit Room' : 'Add New Room'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#2d3748" />
                </TouchableOpacity>
              </View>
              
              <TextInput 
                style={styles.input} 
                placeholder="Room Number (e.g. 101, B-05)" 
                value={roomNumber} 
                onChangeText={setRoomNumber} 
              />
              
              <Text style={styles.inputLabel}>Select Room Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.typeSelector}>
                  {ROOM_TYPES.map((t) => (
                    <TouchableOpacity 
                      key={t} 
                      style={[styles.typeBtn, type === t && styles.typeBtnActive]} 
                      onPress={() => handleTypeSelect(t)}
                    >
                      <Text style={[styles.typeBtnText, type === t && { color: '#fff' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput 
                style={styles.input} 
                placeholder="Or type custom room type..." 
                value={ROOM_TYPES.includes(type) ? '' : type} 
                onChangeText={setType} 
              />

              <TextInput style={styles.input} placeholder="Local Price (Rs)" keyboardType="numeric" value={localPrice} onChangeText={setLocalPrice} />
              <TextInput style={styles.input} placeholder="Foreign Price ($)" keyboardType="numeric" value={foreignPrice} onChangeText={setForeignPrice} />
              <TextInput style={styles.input} placeholder="Capacity (Total Guests)" keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
              <TextInput style={styles.input} placeholder="Facilities (e.g. WiFi, AC, Pool - comma separated)" value={facilities} onChangeText={setFacilities} />
              <TextInput style={styles.input} placeholder="Image URL (Unsplash link, etc.)" value={image} onChangeText={setImage} />
              
              <Text style={styles.inputLabel}>Discount Percentage (%)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Discount (e.g. 10 for 10%)" 
                keyboardType="numeric" 
                value={discount} 
                onChangeText={setDiscount} 
              />
              
              <Text style={styles.inputLabel}>Room Status</Text>
              <View style={styles.typeSelector}>
                {ROOM_STATUSES.map((s) => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.typeBtn, status === s && styles.typeBtnActive]} 
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.typeBtnText, status === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={[styles.promoToggle, isPromotional && styles.promoActive]} 
                onPress={() => setIsPromotional(!isPromotional)}
              >
                <Ionicons name={isPromotional ? "star" : "star-outline"} size={20} color={isPromotional ? "#fff" : "#c0a062"} />
                <Text style={[styles.promoToggleText, isPromotional && { color: '#fff' }]}>
                  {isPromotional ? 'Promotional Offer Active' : 'Set as Promotional Room'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveRoom}>
                  <Text style={styles.submitBtnText}>{editingRoomId ? 'Save Changes' : 'Add Room'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7f6' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749' },
  addBtn: { backgroundColor: '#154749', flexDirection: 'row', padding: 10, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  promoCard: { borderWidth: 2, borderColor: '#c0a062', backgroundColor: '#fffdf5' },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  roomNumber: { fontSize: 18, fontWeight: 'bold', color: '#154749', marginRight: 5 },
  roomType: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginRight: 8 },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  promoBadge: { backgroundColor: '#c0a062', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 10, fontWeight: 'bold' },
  details: { fontSize: 14, color: '#4a5568', marginTop: 4 },
  actions: { flexDirection: 'column', justifyContent: 'space-around', height: 60 },
  actionIcon: { padding: 5 },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#154749' },
  inputLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#4a5568' },
  horizontalScroll: { marginBottom: 15 },
  typeSelector: { flexDirection: 'row', paddingVertical: 5 },
  typeBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: '#cbd5e0', marginRight: 10, backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#154749', borderColor: '#154749' },
  typeBtnText: { color: '#4a5568', fontSize: 13, fontWeight: 'bold' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15 },
  promoToggle: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#c0a062', alignItems: 'center', marginBottom: 20, flexDirection: 'row', justifyContent: 'center' },
  promoActive: { backgroundColor: '#c0a062' },
  promoToggleText: { color: '#c0a062', fontWeight: 'bold', marginLeft: 10 },
  modalActions: { marginTop: 10 },
  submitBtn: { padding: 18, borderRadius: 12, backgroundColor: '#154749', alignItems: 'center', elevation: 3 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#718096', fontSize: 16 }
});

export default ManageRoomsScreen;
