import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const RoomCard = ({ room, onPress, isForeignRate }) => {
  const price = isForeignRate ? room.foreignPrice : room.localPrice;
  const currency = isForeignRate ? '$' : 'Rs';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: room.image || 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      {room.isPromotional && (
        <View style={styles.promoBadge}>
          <Text style={styles.promoText}>Promo Offer</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{room.type}</Text>
        <Text style={styles.price}>{currency} {price} / night</Text>
        <Text style={styles.capacity}>Max Guests: {room.capacity}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: 150,
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2d3748',
  },
  price: {
    fontSize: 16,
    color: '#2b6cb0',
    fontWeight: '600',
    marginBottom: 5,
  },
  capacity: {
    fontSize: 14,
    color: '#718096',
  }
});

export default RoomCard;
