import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const STAFF_ROLES = ['Housekeeping', 'Chef', 'Security'];

const ManageStaffScreen = () => {
  const [staff, setStaff] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Housekeeping');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [tasks, setTasks] = useState('');
  const [errors, setErrors] = useState({});

  const validateStaff = () => {
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
    if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch staff details');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);
  
  const openAddModal = () => {
    setEditingStaffId(null);
    resetForm();
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (member) => {
    setEditingStaffId(member._id);
    setFullName(member.fullName);
    setRole(member.role);
    setPhoneNumber(member.phoneNumber);
    setEmail(member.email);
    setTasks(member.tasks.join(', '));
    setErrors({});
    setModalVisible(true);
  };

  const handleSaveStaff = async () => {
    if (!validateStaff()) return;

    try {
      const staffData = {
        fullName,
        role,
        phoneNumber,
        email,
        tasks: tasks.split(',').map(t => t.trim())
      };

      if (editingStaffId) {
        await api.put(`/api/staff/${editingStaffId}`, staffData);
        Alert.alert('Success', 'Staff details updated');
      } else {
        await api.post('/api/staff', staffData);
        Alert.alert('Success', 'Staff member added');
      }
      
      setModalVisible(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingStaffId ? 'update' : 'add'} staff`);
    }
  };

  const resetForm = () => {
    setFullName(''); setRole('Housekeeping'); setPhoneNumber(''); setEmail(''); setTasks('');
  };

  const handleDelete = (id) => {
    console.log("Deleting Staff ID:", id);
    const performDelete = async () => {
      try {
        console.log("Attempt 1: DELETE...");
        await api.delete(`/api/staff/${id}`);
        
        console.log("Success via DELETE");
        setStaff(prev => prev.filter(s => s._id !== id));
        window.alert("SUCCESS: Staff member removed from database!");
        fetchStaff();
      } catch (error) {
        console.warn("Attempt 1 failed, trying Fallback POST...", error.message);
        try {
          // Absolute path fallback
          await api.post(`/api/staff/delete/${id}`);
          console.log("Success via POST Fallback");
          setStaff(prev => prev.filter(s => s._id !== id));
          window.alert("SUCCESS: Staff member removed (via fallback)!");
          fetchStaff();
        } catch (fallbackError) {
          console.error("All attempts failed:", fallbackError);
          const status = fallbackError.response?.status || "Unknown";
          const msg = fallbackError.response?.data?.message || fallbackError.message;
          window.alert(`FAILED: Could not delete staff. \nStatus: ${status}\nError: ${msg}`);
        }
      }
    };

    if (window.confirm("ARE YOU SURE? This will permanently delete this staff member from the database.")) {
      performDelete();
    }
  };

  const renderStaff = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.staffName}>{item.fullName}</Text>
        <Text style={styles.staffRole}>{item.role}</Text>
        <Text style={styles.details}>{item.email}</Text>
        <Text style={styles.details}>{item.phoneNumber}</Text>
        {item.tasks.length > 0 && (
          <Text style={styles.tasks}>Tasks: {item.tasks.join(', ')}</Text>
        )}
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
          style={[styles.actionBtn, { marginTop: 10 }]} 
          onPress={() => {
            console.log("Delete staff clicked:", item.fullName);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staff}
        renderItem={renderStaff}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingStaffId ? 'Edit Staff Member' : 'Add Staff Member'}</Text>
            
            <TextInput 
              style={[styles.input, errors.fullName && styles.inputError]} 
              placeholder="Full Name" 
              value={fullName} 
              onChangeText={(val) => { setFullName(val); setErrors({...errors, fullName: null}) }} 
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            
            <Text style={styles.inputLabel}>Select Role</Text>
            <View style={styles.roleSelector}>
              {STAFF_ROLES.map((r) => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]} 
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleBtnText, role === r && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput 
              style={[styles.input, errors.email && styles.inputError]} 
              placeholder="Email Address" 
              keyboardType="email-address" 
              value={email} 
              onChangeText={(val) => { setEmail(val); setErrors({...errors, email: null}) }} 
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput 
              style={[styles.input, errors.phoneNumber && styles.inputError]} 
              placeholder="Phone Number" 
              keyboardType="phone-pad" 
              value={phoneNumber} 
              onChangeText={(val) => { setPhoneNumber(val); setErrors({...errors, phoneNumber: null}) }} 
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

            <TextInput 
              style={styles.input} 
              placeholder="Assign Tasks (comma separated)" 
              value={tasks} 
              onChangeText={setTasks} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveStaff}>
                <Text style={styles.submitBtnText}>{editingStaffId ? 'Save Changes' : 'Add Staff'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749' },
  addBtn: { backgroundColor: '#154749', flexDirection: 'row', padding: 10, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  info: { flex: 1 },
  staffName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  staffRole: { fontSize: 14, color: '#c0a062', fontWeight: 'bold', marginTop: 2 },
  details: { fontSize: 14, color: '#718096', marginTop: 4 },
  tasks: { fontSize: 12, color: '#4a5568', marginTop: 8, backgroundColor: '#f0f2f2', padding: 8, borderRadius: 6 },
  actions: { flexDirection: 'column', justifyContent: 'space-around', height: 60 },
  actionBtn: { padding: 5 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#154749' },
  inputLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#4a5568' },
  roleSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  roleBtn: { flex: 0.32, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e0', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#154749', borderColor: '#154749' },
  roleBtnText: { color: '#4a5568', fontSize: 12, fontWeight: 'bold' },
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
  errorText: { color: '#e53e3e', fontSize: 12, marginBottom: 10, fontWeight: 'bold', marginLeft: 5 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 0.48, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  submitBtn: { flex: 0.48, padding: 15, borderRadius: 10, backgroundColor: '#154749', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default ManageStaffScreen;
