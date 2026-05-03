import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('25'); // Default age
  const [role, setRole] = useState('guest');
  const [guestType, setGuestType] = useState('Local');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (fullName.trim().length < 3) {
      newErrors.fullName = 'Full Name must be at least 3 characters';
      valid = false;
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }

    if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      valid = false;
    }

    if (password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    setServerError('');
    setSuccessMessage('');
    if (!validate()) return;

    setLoading(true);
    console.log("Registering user with guestType:", guestType);
    try {
      const response = await api.post('/api/auth/register', { 
        fullName, phoneNumber, email, username, password, role, age: parseInt(age), guestType
      });
      
      setSuccessMessage('Register successfully! Redirecting to login...');
      
      // Clear fields
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setUsername('');
      setPassword('');
      
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (error) {
      console.error("Register Error:", error.response?.data || error.message);
      if (error.message === 'Network Error') {
        setServerError('Network Error: Cannot connect to the server.');
      } else {
        setServerError(error.response?.data?.message || 'Server error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRoleButton = (roleName, label) => (
    <TouchableOpacity 
      style={[styles.roleButton, role === roleName && styles.roleButtonActive]} 
      onPress={() => setRole(roleName)}
    >
      <Text style={[styles.roleText, role === roleName && styles.roleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('CustomerApp')}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        
        {serverError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#e53e3e" />
            <Text style={styles.mainErrorText}>{serverError}</Text>
          </View>
        ) : null}
        
        {successMessage ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#38a169" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Select Role</Text>
        <View style={styles.roleContainer}>
          {renderRoleButton('guest', 'Guest')}
          {renderRoleButton('staff', 'Staff')}
          {renderRoleButton('admin', 'Admin')}
        </View>

        {role === 'guest' && (
          <>
            <Text style={styles.label}>Residency Status</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, guestType === 'Local' && styles.roleButtonActive]} 
                onPress={() => setGuestType('Local')}
              >
                <Text style={[styles.roleText, guestType === 'Local' && styles.roleTextActive]}>Local Guest</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, guestType === 'Foreign' && styles.roleButtonActive]} 
                onPress={() => setGuestType('Foreign')}
              >
                <Text style={[styles.roleText, guestType === 'Foreign' && styles.roleTextActive]}>Foreign Guest</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TextInput 
          style={[styles.input, errors.fullName && styles.inputError]} 
          placeholder="Full Name" 
          value={fullName} 
          onChangeText={(val) => { setFullName(val); setErrors({...errors, fullName: null}) }}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

        <TextInput 
          style={[styles.input, errors.phoneNumber && styles.inputError]} 
          placeholder="Phone Number" 
          value={phoneNumber} 
          onChangeText={(val) => { setPhoneNumber(val); setErrors({...errors, phoneNumber: null}) }}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

        <TextInput 
          style={[styles.input, errors.email && styles.inputError]} 
          placeholder="Email Address" 
          value={email} 
          onChangeText={(val) => { setEmail(val); setErrors({...errors, email: null}) }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={styles.row}>
           <View style={{ flex: 0.6 }}>
              <TextInput 
                style={[styles.input, errors.username && styles.inputError]} 
                placeholder="Username" 
                value={username} 
                onChangeText={(val) => { setUsername(val); setErrors({...errors, username: null}) }}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
           </View>
           <View style={{ flex: 0.35 }}>
              <TextInput 
                style={styles.input} 
                placeholder="Age" 
                value={age} 
                onChangeText={setAge}
                keyboardType="numeric"
              />
           </View>
        </View>

        <TextInput 
          style={[styles.input, errors.password && styles.inputError]} 
          placeholder="Password" 
          value={password} 
          onChangeText={(val) => { setPassword(val); setErrors({...errors, password: null}) }}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  backButton: { padding: 20, paddingTop: 10 },
  container: { flexGrow: 1, padding: 20, paddingTop: 0, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#feb2b2' },
  mainErrorText: { color: '#e53e3e', fontSize: 14, marginLeft: 10, fontWeight: 'bold' },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fff4', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#9ae6b4' },
  successText: { color: '#38a169', fontSize: 14, marginLeft: 10, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#555' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 5, alignItems: 'center', backgroundColor: '#fff' },
  roleButtonActive: { backgroundColor: '#c0a062', borderColor: '#c0a062' },
  roleText: { color: '#555', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 5, borderWidth: 1, borderColor: '#ddd', marginTop: 10 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginLeft: 5, marginBottom: 5 },
  button: { backgroundColor: '#c0a062', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, minHeight: 55, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#c0a062', textAlign: 'center', marginTop: 20, fontSize: 16 }
});

export default RegisterScreen;
