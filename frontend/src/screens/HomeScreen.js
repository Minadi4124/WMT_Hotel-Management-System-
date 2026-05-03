import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api, { getCurrentUser } from '../services/api';

const QUICK_ACTIONS = [
  { id: '1', label: 'Stay', icon: 'business' },
  { id: '2', label: 'Dine', icon: 'restaurant' },
  { id: '3', label: 'Family', icon: 'people' },
  { id: '4', label: 'Shop', icon: 'cart' },
  { id: '5', label: 'Weddings', icon: 'heart' }
];

const TABS = ['Discover', 'Hong Kong', 'Singapore', 'Penang', 'Manila'];

const FEATURED_OFFERS = [
  { 
    id: '1', 
    title: 'Family Getaway Special', 
    subtitle: 'Create lasting memories with your loved ones', 
    image: 'https://media.istockphoto.com/id/1358218330/photo/family-of-four-having-fun-and-enjoying-together-at-hotel-room.jpg?s=612x612&w=0&k=20&c=BlvRRxZIJ1_rLf9MCa5D1Q3lfVacItHJeIA9q6c7Z8U=',
    tag: 'FAMILY'
  },
  { 
    id: '2', 
    title: 'Romantic Couple Retreat', 
    subtitle: 'Escape to a world of intimacy and luxury', 
    image: 'https://images.unsplash.com/photo-1758523669309-843b8ff89029?w=600',
    tag: 'ROMANCE'
  },
  { 
    id: '3', 
    title: 'Executive Suite Experience', 
    subtitle: 'Unmatched comfort for the modern traveler', 
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
    tag: 'PREMIUM'
  }
];

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [bookingStatus, setBookingStatus] = useState(null);

  const checkStayStatus = async (userId) => {
    try {
      const response = await api.get('/api/bookings');
      const myBookings = response.data.filter(b => b.userId?._id === userId || b.userId === userId);
      if (myBookings.length > 0) {
        // Get the latest one
        const latest = myBookings[myBookings.length - 1];
        setBookingStatus(latest.status);
      }
    } catch (error) {
      console.log("Error checking stay status");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        checkStayStatus(currentUser._id);
      } else {
        setBookingStatus(null);
      }
    }, [])
  );
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Luxury Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.headerTopRow}>
            <View style={styles.logoContainer}>
              <View style={styles.starCircle}>
                <Ionicons name="star" size={24} color="#c0a062" />
              </View>
              <View>
                <Text style={styles.brandName}>GOLDEN</Text>
                <Text style={styles.brandSubtitle}>STAR RESORT</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.headerProfileBtn} 
              onPress={() => user ? navigation.navigate('Account') : navigation.navigate('Login')}
            >
              <Ionicons 
                name={user ? "person-circle" : "person-circle-outline"} 
                size={32} 
                color="#c0a062" 
              />
              <Text style={styles.profileTextSmall}>{user ? 'Account' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.locationBadge}>
            <Ionicons name="location-sharp" size={14} color="#c0a062" />
            <Text style={styles.locationText}>Galle Face, Colombo, Sri Lanka</Text>
          </View>
          <Text style={styles.aboutNote}>
            Experience world-class luxury at the heart of Colombo. Our resort blends traditional Sri Lankan hospitality with modern elegance, offering breathtaking ocean views and award-winning dining.
          </Text>
          
          <TouchableOpacity 
            style={styles.bookNowBtn} 
            onPress={() => navigation.navigate('RoomList')}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" style={{marginRight: 10}} />
            <Text style={styles.bookNowText}>Book Your Stay Now</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Stay Status Card */}
        {user && bookingStatus && (bookingStatus === 'Pending' || bookingStatus === 'Confirmed') && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialCommunityIcons name="clock-fast" size={24} color="#c0a062" />
              <Text style={styles.statusTitle}>Reservation Status</Text>
            </View>
            <Text style={styles.statusMessage}>
              Your booking is currently <Text style={{fontWeight: 'bold', color: '#c0a062'}}>PENDING</Text>. 
              Please wait while our admin team verifies your reservation and prepares for your check-in.
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>WAITING FOR CHECK-IN</Text>
            </View>
          </View>
        )}

        {/* Featured Dynamic Section (Carousel Style) */}
        <Text style={styles.sectionHeader}>Featured Offers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
          {FEATURED_OFFERS.map(offer => (
            <TouchableOpacity 
              key={offer.id} 
              style={styles.offerCard} 
              onPress={() => navigation.navigate('RoomList', { filterType: offer.tag })}
            >
              <Image source={{ uri: offer.image }} style={styles.offerImage} />
              <View style={offer.tag === 'FAMILY' ? styles.tagFamily : (offer.tag === 'ROMANCE' ? styles.tagRomance : styles.tagPremium)}>
                <Text style={styles.tagText}>{offer.tag}</Text>
              </View>
              <View style={styles.offerOverlay}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dynamic Content: Our Facilities */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>Why Stay With Us?</Text>
          <View style={styles.gridContainer}>
            <View style={styles.infoCard}>
              <Ionicons name="wifi" size={24} color="#154749" />
              <Text style={styles.infoLabel}>Free High-Speed WiFi</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="cafe" size={24} color="#154749" />
              <Text style={styles.infoLabel}>Gourmet Breakfast</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color="#154749" />
              <Text style={styles.infoLabel}>24/7 Security</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="car" size={24} color="#154749" />
              <Text style={styles.infoLabel}>Valet Parking</Text>
            </View>
          </View>
        </View>
        
        {/* About Us & History Section */}
        <View style={styles.aboutUsSection}>
          <Text style={styles.sectionHeader}>Our Heritage</Text>
          <View style={styles.aboutCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800' }} style={styles.aboutImage} />
            <Text style={styles.aboutFullTitle}>A Century of Luxury</Text>
            <Text style={styles.aboutFullText}>
              Founded in 1924, Mapp Grand Resort has been a beacon of Sri Lankan elegance for over a century. From royalty to modern-day travelers, we offer a unique sanctuary where the heritage of Galle Face meets contemporary sophistication. Our mission is to provide an unmatched experience of peace, luxury, and island charm.
            </Text>
          </View>
        </View>

        {/* Social Connect Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Connect With Us</Text>
          <Text style={styles.footerSubtitle}>Follow our journey on social media for exclusive updates and luxury insights.</Text>
          
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#E1306C' }]}>
              <Ionicons name="logo-instagram" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
              <Ionicons name="logo-facebook" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#000' }]}>
              <Ionicons name="logo-twitter" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomBar}>
            <Text style={styles.copyright}>© 2026 Mapp Grand Resort. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  brandHeader: { backgroundColor: '#154749', paddingHorizontal: 25, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  starCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(192, 160, 98, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#c0a062' },
  brandName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  brandSubtitle: { color: '#c0a062', fontSize: 10, fontWeight: 'bold', letterSpacing: 4, marginTop: -2 },
  headerProfileBtn: { alignItems: 'center' },
  profileTextSmall: { color: '#c0a062', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  
  welcomeSection: { padding: 25, paddingTop: 30 },
  hotelTitle: { fontSize: 26, fontWeight: 'bold', color: '#154749' },
  profileIconBtn: { alignItems: 'center' },
  profileBtnText: { fontSize: 10, color: '#154749', fontWeight: 'bold' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  locationText: { fontSize: 13, color: '#718096', marginLeft: 5, fontWeight: '500' },
  aboutNote: { fontSize: 14, color: '#4a5568', lineHeight: 22, fontStyle: 'italic', marginBottom: 20 },
  bookNowBtn: { backgroundColor: '#c0a062', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 15, elevation: 5, shadowColor: '#c0a062', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  bookNowText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  statusCard: { backgroundColor: '#154749', marginHorizontal: 25, marginTop: 20, padding: 20, borderRadius: 20, elevation: 4 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusTitle: { color: '#c0a062', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  statusMessage: { color: '#fff', fontSize: 14, lineHeight: 20, opacity: 0.9 },
  statusBadge: { backgroundColor: '#c0a062', alignSelf: 'flex-start', marginTop: 15, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#154749', marginHorizontal: 25, marginTop: 30, marginBottom: 15 },
  carouselContainer: { paddingHorizontal: 20, paddingBottom: 10 },
  offerCard: { width: 300, height: 400, marginRight: 20, borderRadius: 25, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
  offerImage: { width: '100%', height: '100%' },
  offerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', height: 120, justifyContent: 'center' },
  offerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  offerSubtitle: { color: '#e2e8f0', fontSize: 12, lineHeight: 16 },
  
  tagFamily: { position: 'absolute', top: 20, right: 20, backgroundColor: '#4299e1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagRomance: { position: 'absolute', top: 20, right: 20, backgroundColor: '#ed64a6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagPremium: { position: 'absolute', top: 20, right: 20, backgroundColor: '#c0a062', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  
  infoSection: { padding: 25, marginTop: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, borderBottomWidth: 3, borderBottomColor: '#c0a062' },
  infoLabel: { fontSize: 12, color: '#154749', fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  aboutUsSection: { padding: 5, marginBottom: 20 },
  aboutCard: { backgroundColor: '#fff', marginHorizontal: 25, borderRadius: 25, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, paddingBottom: 20 },
  aboutImage: { width: '100%', height: 200 },
  aboutFullTitle: { fontSize: 22, fontWeight: 'bold', color: '#154749', padding: 20, paddingBottom: 10 },
  aboutFullText: { fontSize: 14, color: '#4a5568', paddingHorizontal: 20, lineHeight: 22, color: '#718096' },
  
  footer: { backgroundColor: '#154749', padding: 40, paddingTop: 50, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  footerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  footerSubtitle: { color: '#a0aec0', fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 18, paddingHorizontal: 20 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  socialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginHorizontal: 15, elevation: 5 },
  bottomBar: { marginTop: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20, alignItems: 'center' },
  copyright: { color: '#718096', fontSize: 10, fontWeight: 'bold' }
});

export default HomeScreen;
