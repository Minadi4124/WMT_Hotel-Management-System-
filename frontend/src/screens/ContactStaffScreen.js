import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const ContactStaffScreen = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const renderStaff = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.role}>{item.role}</Text>
        <Text style={styles.tasks}>{item.tasks.join(' • ')}</Text>
      </View>
      <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phoneNumber)}>
        <Ionicons name="call" size={24} color="#fff" />
        <Text style={styles.callText}>Call</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact Hotel Staff</Text>
      <Text style={styles.subtitle}>Need assistance? Our team is here to help.</Text>
      <FlatList
        data={staff}
        renderItem={renderStaff}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No staff members available at the moment.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#718096', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  role: { fontSize: 14, color: '#c0a062', fontWeight: 'bold', marginTop: 2 },
  tasks: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
  callBtn: { backgroundColor: '#38a169', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  callText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0' }
});

export default ContactStaffScreen;
