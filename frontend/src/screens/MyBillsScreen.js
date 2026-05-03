import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { getCurrentUser } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Modal, TextInput, ScrollView } from 'react-native';

const MyBillsScreen = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  // Card Details State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const user = getCurrentUser();
  const userId = user?.id;

  // Convert database currency 'Rs' → 'LKR', keep '$' as-is
  const formatCurrency = (currency) => currency === 'Rs' ? 'LKR' : (currency || '$');

  const fetchMyBills = async () => {
    try {
      const response = await api.get('/api/billing');
      const myBills = response.data.filter(b => b.guestId?._id === userId && b.isVisibleToGuest);
      setBills(myBills);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBills();
  }, []);

  const handlePayNow = (bill) => {
    setSelectedBill(bill);
    setModalVisible(true);
  };

  const processPayment = async () => {
    if (!selectedBill || !selectedBill._id) {
      Alert.alert('Error', 'No bill selected for payment');
      return;
    }

    if (!cardNumber || !expiry || !cvv) {
      Alert.alert('Error', 'Please enter all card details');
      return;
    }

    if (cardNumber.length < 16) {
      Alert.alert('Error', 'Invalid card number. Please enter a 16-digit number.');
      return;
    }

    try {
      const response = await api.put(`/api/billing/${selectedBill._id}/guest-pay`, {
        paymentMethod: 'Online Card'
      });
      if (response.data) {
        setModalVisible(false);
        setCardNumber(''); setExpiry(''); setCvv('');
        fetchMyBills();
        Alert.alert('Payment Submitted', 'Your payment has been submitted and is currently awaiting admin verification.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Payment failed. Please check your connection or contact the hotel.');
    }
  };

  const downloadBill = async (bill) => {
    const fmtCur = bill.currency === 'Rs' ? 'LKR' : (bill.currency || '$');
    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a202c; line-height: 1.6; }
            .header { border-bottom: 3px solid #c0a062; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            .hotel-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #154749; letter-spacing: 1px; }
            .invoice-label { font-size: 48px; color: #e2e8f0; font-weight: 900; position: absolute; right: 50px; top: 40px; opacity: 0.5; }
            .section { margin-bottom: 35px; background: #f8fafc; padding: 25px; border-radius: 15px; }
            .section-title { font-size: 14px; text-transform: uppercase; color: #c0a062; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .label { color: #718096; font-weight: 500; }
            .value { color: #2d3748; font-weight: 700; }
            .total-row { border-top: 2px solid #154749; padding-top: 20px; margin-top: 30px; font-size: 24px; color: #154749; }
            .footer { margin-top: 80px; text-align: center; font-size: 14px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .gold { color: #c0a062; }
          </style>
        </head>
        <body>
          <div class="invoice-label">INVOICE</div>
          <div class="header">
            <div>
              <div class="hotel-name">MAPP HOTELS</div>
              <div style="font-size: 12px; color: #718096;">LUXURY GUEST RESIDENCE</div>
            </div>
            <div style="text-align: right; font-size: 14px; color: #4a5568;">
              Ref: #${bill._id.slice(-6).toUpperCase()}<br/>
              Date: ${new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Guest Information</div>
            <div class="row"><span class="label">Guest Name</span> <span class="value">${user?.fullName || 'Valued Guest'}</span></div>
            <div class="row"><span class="label">Room Reference</span> <span class="value">${bill.bookingId?.roomId?.type || 'Luxury Suite'} #${bill.bookingId?.roomId?.roomNumber || 'N/A'}</span></div>
            <div class="row"><span class="label">Payment Status</span> <span class="value" style="color: ${bill.paymentStatus === 'Done' ? '#38a169' : '#ecc94b'};">${bill.paymentStatus.toUpperCase()}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Billing Summary</div>
            <div class="row"><span class="label">Base Accommodation Rate</span> <span class="value">${fmtCur} ${bill.originalPrice}</span></div>
            <div class="row"><span class="label">Exclusive Discount Applied</span> <span class="value" style="color: #38a169;">- ${fmtCur} ${bill.discountAmount}</span></div>
            ${bill.extraCharges > 0 ? `
              <div class="row"><span class="label">Additional Services <small class="gold">(${bill.extraChargesDescription || 'Service Charges'})</small></span> <span class="value" style="color: #e53e3e;">+ ${fmtCur} ${bill.extraCharges}</span></div>
            ` : ''}
          </div>

          <div class="total-row row">
            <span style="font-weight: 900;">TOTAL PAYABLE</span>
            <span style="font-weight: 900;">${fmtCur} ${bill.finalAmount}</span>
          </div>

          <div class="footer">
            Thank you for choosing Mapp Hotels. We hope your stay was exceptional.<br/>
            <small>This is a computer-generated document. No signature required.</small>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_${bill._id.slice(-5)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const downloadAllBills = async () => {
    if (bills.length === 0) return;

    const billsHtml = bills.map(bill => {
      const bCur = bill.currency === 'Rs' ? 'LKR' : (bill.currency || '$');
      return `
        <div class="bill-page" style="page-break-after: always; margin-bottom: 50px; border-bottom: 1px dashed #ccc; padding-bottom: 30px;">
          <div class="header">
            <div class="title">INVOICE</div>
            <div>Mapp Hotel Management</div>
          </div>
          
          <div class="section">
            <div class="row"><span class="label">Guest:</span> <span>${user?.fullName || 'Guest'}</span></div>
            <div class="row"><span class="label">Date:</span> <span>${new Date().toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Room Type:</span> <span>${bill.bookingId?.roomId?.type || 'N/A'}</span></div>
            <div class="row"><span class="label">Status:</span> <span>${bill.paymentStatus}</span></div>
          </div>

          <div class="section">
            <div class="row"><span>Original Price</span> <span>${bCur} ${bill.originalPrice}</span></div>
            <div class="row" style="color: #38a169;"><span>Discount</span> <span>- ${bCur} ${bill.discountAmount}</span></div>
            ${bill.extraCharges > 0 ? `
              <div class="row" style="color: #e53e3e;"><span>Extra Charges</span> <span>+ ${bCur} ${bill.extraCharges}</span></div>
              <div class="extra-desc">Reason: ${bill.extraChargesDescription || 'Service charges'}</div>
            ` : ''}
          </div>

          <div class="total-row row">
            <span class="label">Total Amount</span>
            <span class="label">${bCur} ${bill.finalAmount}</span>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #154749; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 28px; color: #154749; font-weight: bold; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { font-weight: bold; }
            .total-row { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; font-size: 20px; color: #154749; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            .extra-desc { font-style: italic; font-size: 13px; color: #666; margin-left: 20px; }
          </style>
        </head>
        <body>
          ${billsHtml}
          <div class="footer">
            Generated Summary of All Bills - Mapp Hotels
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'All_Bills_Summary.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate combined PDF');
    }
  };

  const renderBill = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.bookingId?.roomId?.type || 'Room Service'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.paymentStatus === 'Done' ? '#48bb78' : (item.paymentStatus === 'Pending' ? '#ecc94b' : '#e53e3e') 
          }]}>
            <Text style={styles.statusText}>{item.paymentStatus === 'Pending' ? 'Awaiting Confirmation' : item.paymentStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.label}>Original Price:</Text>
        <Text style={styles.value}>{formatCurrency(item.currency)} {item.originalPrice}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.label}>Discount:</Text>
        <Text style={[styles.value, { color: '#38a169' }]}>- {formatCurrency(item.currency)} {item.discountAmount}</Text>
      </View>
      {item.extraCharges > 0 && (
        <View style={{ marginBottom: 5 }}>
          <View style={styles.priceRow}>
            <Text style={styles.label}>Extra Charges:</Text>
            <Text style={[styles.value, { color: '#e53e3e' }]}>+ {formatCurrency(item.currency)} {item.extraCharges}</Text>
          </View>
          {item.extraChargesDescription && (
            <Text style={styles.extraDesc}>({item.extraChargesDescription})</Text>
          )}
        </View>
      )}
      
      {item.paymentDate && (
        <View style={styles.priceRow}>
          <Text style={styles.label}>Paid on:</Text>
          <Text style={styles.value}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
        </View>
      )}

      <View style={styles.divider} />
      <View style={styles.priceRow}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>{formatCurrency(item.currency)} {item.finalAmount}</Text>
      </View>

      {item.paymentStatus === 'Unpaid' ? (
        <TouchableOpacity style={styles.payBtn} onPress={() => handlePayNow(item)}>
          <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.payBtnText}>Pay with Card</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.downloadFullBtn} onPress={() => downloadBill(item)}>
          <Ionicons name="document-text-outline" size={20} color="#154749" style={{ marginRight: 8 }} />
          <Text style={styles.downloadFullBtnText}>Download PDF Invoice</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>My Bills & Payments</Text>
          {bills.length > 1 && (
            <TouchableOpacity style={styles.downloadAllBtn} onPress={downloadAllBills}>
              <Ionicons name="documents-outline" size={20} color="#fff" />
              <Text style={styles.downloadAllText}>Download All</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={bills}
          renderItem={renderBill}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No bills found for your account.</Text>}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Secure Card Payment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2d3748" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.paymentTotal}>
              Total to Pay: {formatCurrency(selectedBill?.currency)} {selectedBill?.finalAmount}
            </Text>

            <View style={styles.cardBox}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0000 0000 0000 0000" 
                keyboardType="numeric" 
                maxLength={16}
                value={cardNumber} 
                onChangeText={setCardNumber} 
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 0.48 }}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="MM/YY" 
                    maxLength={5}
                    value={expiry} 
                    onChangeText={setExpiry} 
                  />
                </View>
                <View style={{ flex: 0.48 }}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="123" 
                    keyboardType="numeric" 
                    maxLength={3}
                    secureTextEntry
                    value={cvv} 
                    onChangeText={setCvv} 
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={processPayment}>
              <Text style={styles.confirmBtnText}>Confirm & Pay Now</Text>
            </TouchableOpacity>
            
            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={12} color="#718096" />
              <Text style={styles.securityText}>Your payment information is encrypted and secure.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { flex: 1, padding: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#154749' },
  downloadAllBtn: { backgroundColor: '#154749', flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8 },
  downloadAllText: { color: '#fff', marginLeft: 5, fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 14, color: '#718096' },
  value: { fontSize: 14, color: '#2d3748', fontWeight: '500' },
  extraDesc: { fontSize: 12, color: '#718096', fontStyle: 'italic', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#edf2f7', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#154749' },
  payBtn: { backgroundColor: '#c0a062', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold' },
  downloadFullBtn: { backgroundColor: '#edf2f7', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e0' },
  downloadFullBtnText: { color: '#154749', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', width: '90%', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#154749' },
  paymentTotal: { fontSize: 18, fontWeight: 'bold', color: '#c0a062', marginBottom: 20, textAlign: 'center' },
  cardBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e0' },
  inputLabel: { fontSize: 12, color: '#718096', marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  confirmBtn: { backgroundColor: '#154749', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  securityText: { fontSize: 11, color: '#718096', marginLeft: 5 }
});

export default MyBillsScreen;
