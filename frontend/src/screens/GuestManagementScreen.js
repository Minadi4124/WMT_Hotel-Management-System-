import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const GuestManagementScreen = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Local, Foreign
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [guestType, setGuestType] = useState('Local');
  const [errors, setErrors] = useState({});

  const validateGuest = () => {
    let valid = true;
    let newErrors = {};

    const nameRegex = /^[a-zA-Z\s.]+$/;
    if (fullName.trim().length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters';
      valid = false;
    } else if (/[0-9]/.test(fullName.trim())) {
      newErrors.fullName = 'Full Name cannot contain numbers';
      valid = false;
    } else if (!nameRegex.test(fullName.trim())) {
      newErrors.fullName = 'Full Name cannot contain special characters';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email Address is required';
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      valid = false;
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      valid = false;
    }

    if (isAdding) {
      if (!username.trim() || username.includes(' ')) {
        newErrors.username = 'Username is required (single word)';
        valid = false;
      }
      if (!password || password.length < 6) {
        newErrors.password = 'Password must be at least 6 digits';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const fetchGuests = async () => {
    try {
      const response = await api.get('/api/auth/guests');
      setGuests(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const openAddModal = () => {
    setIsAdding(true);
    setSelectedGuest(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setLoyaltyPoints('0');
    setGuestType('Local');
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (guest) => {
    setIsAdding(false);
    setSelectedGuest(guest);
    setFullName(guest.fullName);
    setPhoneNumber(guest.phoneNumber);
    setEmail(guest.email || '');
    setLoyaltyPoints(guest.loyaltyPoints?.toString() || '0');
    setGuestType(guest.guestType || 'Local');
    setErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!validateGuest()) return;

    try {
      const data = {
        fullName,
        phoneNumber,
        email,
        loyaltyPoints: parseInt(loyaltyPoints),
        guestType
      };

      if (isAdding) {
        await api.post('/api/auth/register', { 
          ...data, 
          username, 
          password, 
          role: 'guest' 
        });
        Alert.alert('Success', 'New guest added successfully');
      } else {
        await api.put(`/api/auth/users/${selectedGuest._id}`, data);
        Alert.alert('Success', 'Guest details updated successfully');
      }
      
      setModalVisible(false);
      fetchGuests();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save guest';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleDelete = (id) => {
    console.log("Delete button clicked for ID:", id);
    
    const performDelete = async () => {
      try {
        console.log(`Attempting deletion for ID: ${id}`);
        // Try standard DELETE first
        await api.delete(`/api/auth/users/${id}`);
        
        console.log("Deleted via DELETE method");
        setGuests(prev => prev.filter(g => g._id !== id));
        window.alert("Guest deleted successfully!");
      } catch (error) {
        console.warn("DELETE method failed, trying POST fallback...", error.message);
        try {
          // Fallback to POST if DELETE is blocked
          // Fallback to POST
          await api.post(`/api/auth/users/delete/${id}`);
          console.log("Success via POST Fallback");
          setGuests(prev => prev.filter(g => g._id !== id));
          window.alert("SUCCESS: Guest removed (via fallback)!");
          fetchGuests();
        } catch (fallbackError) {
          console.error("All guest removal attempts failed:", fallbackError);
          const status = fallbackError.response?.status || "Unknown";
          const msg = fallbackError.response?.data?.message || fallbackError.message;
          window.alert(`FAILED: Could not delete guest. \nStatus: ${status}\nError: ${msg}`);
        }
      }
    };

    if (window.confirm("ARE YOU SURE? This will permanently delete this guest and all their records.")) {
      performDelete();
    }
  };

  const filteredGuests = guests.filter(guest => {
    if (filter === 'All') return true;
    return guest.guestType?.toLowerCase() === filter.toLowerCase();
  });

  const renderGuest = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.details}>@{item.username} | {item.phoneNumber}</Text>
        <Text style={styles.details}>{item.email}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.loyalty}>Points: {item.loyaltyPoints || 0}</Text>
          <View style={[styles.typeBadge, { backgroundColor: (item.guestType?.toLowerCase() === 'foreign') ? '#3182ce' : '#38a169' }]}>
            <Text style={styles.typeText}>{item.guestType || 'Local'}</Text>
          </View>
        </View>
        {item.age <= 12 && <Text style={styles.childTag}>CHILD (Age: {item.age})</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => openEditModal(item)}
          activeOpacity={0.6}
        >
          <Ionicons name="pencil-outline" size={24} color="#3182ce" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, { marginLeft: 10 }]} 
          onPress={() => {
            console.log("Trash icon pressed for:", item.fullName);
            handleDelete(item._id);
          }}
          activeOpacity={0.6}
        >
          <Ionicons name="trash" size={24} color="#e53e3e" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Guest Management</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add-circle" size={40} color="#154749" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'All' && styles.filterBtnActive]} 
            onPress={() => setFilter('All')}
          >
            <Text style={[styles.filterBtnText, filter === 'All' && styles.filterBtnTextActive]}>All Guests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'Local' && styles.filterBtnActiveLocal]} 
            onPress={() => setFilter('Local')}
          >
            <Text style={[styles.filterBtnText, filter === 'Local' && styles.filterBtnTextActive]}>Local</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'Foreign' && styles.filterBtnActiveForeign]} 
            onPress={() => setFilter('Foreign')}
          >
            <Text style={[styles.filterBtnText, filter === 'Foreign' && styles.filterBtnTextActive]}>Foreign</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredGuests}
          renderItem={renderGuest}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={fetchGuests}
        />

        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isAdding ? 'Add New Guest' : 'Edit Guest Details'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              {isAdding && (
                <>
                  <Text style={styles.label}>Username</Text>
                  <TextInput 
                    style={[styles.input, errors.username && styles.inputError]} 
                    value={username} 
                    onChangeText={(val) => { setUsername(val); setErrors({...errors, username: null}) }} 
                    autoCapitalize="none"
                    placeholder="Enter unique username"
                  />
                  {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                  <Text style={styles.label}>Password</Text>
                  <TextInput 
                    style={[styles.input, errors.password && styles.inputError]} 
                    value={password} 
                    onChangeText={(val) => { setPassword(val); setErrors({...errors, password: null}) }} 
                    secureTextEntry
                    placeholder="Enter temporary password"
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </>
              )}

              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={[styles.input, errors.fullName && styles.inputError]} 
                value={fullName} 
                onChangeText={(val) => { setFullName(val); setErrors({...errors, fullName: null}) }} 
                placeholder="Guest's full name" 
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={[styles.input, errors.phoneNumber && styles.inputError]} 
                value={phoneNumber} 
                onChangeText={(val) => { setPhoneNumber(val); setErrors({...errors, phoneNumber: null}) }} 
                keyboardType="phone-pad" 
                placeholder="+94..." 
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={[styles.input, errors.email && styles.inputError]} 
                value={email} 
                onChangeText={(val) => { setEmail(val); setErrors({...errors, email: null}) }} 
                autoCapitalize="none" 
                keyboardType="email-address" 
                placeholder="email@example.com" 
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={styles.label}>Loyalty Points</Text>
              <TextInput style={styles.input} value={loyaltyPoints} onChangeText={setLoyaltyPoints} keyboardType="numeric" />
              
              <Text style={styles.label}>Guest Type (Nationality)</Text>
              <View style={styles.typeToggleRow}>
                <TouchableOpacity 
                  style={[styles.typeToggle, guestType === 'Local' && styles.typeToggleActive]} 
                  onPress={() => setGuestType('Local')}
                >
                  <Text style={[styles.typeToggleText, guestType === 'Local' && styles.typeToggleTextActive]}>Local</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeToggle, guestType === 'Foreign' && styles.typeToggleActive]} 
                  onPress={() => setGuestType('Foreign')}
                >
                  <Text style={[styles.typeToggleText, guestType === 'Foreign' && styles.typeToggleTextActive]}>Foreign</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{isAdding ? 'Create Guest Account' : 'Save Changes'}</Text>
              </TouchableOpacity>
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
  addBtn: { padding: 5 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  details: { fontSize: 13, color: '#718096', marginTop: 2 },
  loyalty: { fontSize: 12, color: '#c0a062', fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginLeft: 10 },
  typeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  childTag: { color: '#e53e3e', fontSize: 11, fontWeight: 'bold', marginTop: 4, backgroundColor: '#fff5f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  typeToggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeToggle: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 5, alignItems: 'center', backgroundColor: '#fff' },
  typeToggleActive: { backgroundColor: '#154749', borderColor: '#154749' },
  typeToggleText: { color: '#555', fontWeight: 'bold' },
  typeToggleTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 10 },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#154749' },
  label: { fontSize: 14, color: '#718096', marginBottom: 8, fontWeight: '600' },
  input: { 
    backgroundColor: '#f9f9f9', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 5,
    outlineStyle: 'none'
  },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginBottom: 15, marginLeft: 5 },
  saveBtn: { backgroundColor: '#154749', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 4, borderWidth: 1, borderColor: '#eee' },
  filterBtnActive: { backgroundColor: '#154749', borderColor: '#154749' },
  filterBtnActiveLocal: { backgroundColor: '#38a169', borderColor: '#38a169' },
  filterBtnActiveForeign: { backgroundColor: '#3182ce', borderColor: '#3182ce' },
  filterBtnText: { fontSize: 12, fontWeight: 'bold', color: '#718096' },
  filterBtnTextActive: { color: '#fff' }
});

export default GuestManagementScreen;
