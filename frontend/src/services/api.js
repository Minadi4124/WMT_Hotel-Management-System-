import axios from 'axios';
import { Platform } from 'react-native';

export const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : 'http://10.212.249.126:5000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Mock session storage
let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
  console.log("Session updated:", user?.fullName);
};

export const getCurrentUser = () => currentUser;

export const logout = () => {
  currentUser = null;
};

export default api;
