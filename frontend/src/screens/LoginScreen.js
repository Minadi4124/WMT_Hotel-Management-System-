import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { setCurrentUser } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  
  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    setServerError('');
    if(!validate()) return;
    
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { user } = response.data;
      
      setCurrentUser(user); // Save user session
      
      if (user.role === 'admin' || user.role === 'staff') {
        navigation.replace('AdminApp');
      } else {
        navigation.replace('CustomerApp');
      }
    } catch (error) {
      if (error.message === 'Network Error') {
        setServerError('Network Error: Cannot connect to the server. Please ensure the backend is running.');
        return;
      }
      const errorMsg = error.response?.data?.message || 'Invalid username or password';
      if (error.response?.status === 404) {
        setServerError('Account Not Found: Please register first before signing in.');
      } else {
        setServerError(errorMsg);
      }
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600' }} 
      style={styles.container}
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('CustomerApp')}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          
          {serverError ? <Text style={styles.mainErrorText}>{serverError}</Text> : null}
          
          {/* Dummy inputs to catch browser autofill */}
          <TextInput style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }} autoComplete="username" />
          <TextInput style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }} secureTextEntry autoComplete="current-password" />
          
          <TextInput 
            style={[styles.input, errors.username && styles.inputError]} 
            placeholder="Username" 
            placeholderTextColor="#999"
            value={username} 
            onChangeText={(val) => { setUsername(val); setErrors({...errors, username: null}) }}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="none"
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          <TextInput 
            style={[styles.input, errors.password && styles.inputError]} 
            placeholder="Password" 
            placeholderTextColor="#999"
            value={password} 
            onChangeText={(val) => { setPassword(val); setErrors({...errors, password: null}) }}
            secureTextEntry
            autoComplete="new-password"
            textContentType="none"
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{fontWeight:'bold'}}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  backButton: { padding: 20, paddingTop: 10 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#eee', textAlign: 'center', marginBottom: 40, marginTop: 5 },
  mainErrorText: { color: '#feb2b2', fontSize: 14, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 5, 
    marginTop: 10, 
    fontSize: 16,
    outlineStyle: 'none'
  },
  inputError: { borderWidth: 1, borderColor: '#feb2b2' },
  errorText: { color: '#feb2b2', fontSize: 12, marginLeft: 5, marginBottom: 5 },
  button: { backgroundColor: '#c0a062', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#fff', textAlign: 'center', marginTop: 25, fontSize: 16 }
});

export default LoginScreen;
