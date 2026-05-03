import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Modal, TextInput, Platform } from 'react-native';

const BillingScreen = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  // Edit State
  const [extraAmount, setExtraAmount] = useState('');
  const [extraDesc, setExtraDesc] = useState('');

  const fetchBills = async () => {
    try {
      const response = await api.get('/api/billing');
      setBills(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const toggleVisibility = async (id, currentStatus) => {
    try {
      await api.put(`/api/billing/${id}/visibility`, { isVisible: !currentStatus });
      fetchBills();
      Alert.alert('Success', !currentStatus ? 'Bill is now visible to the guest' : 'Bill is now hidden from the guest');
    } catch (error) {
      Alert.alert('Error', 'Failed to update visibility');
    }
  };

  const markAsPaid = async (id) => {
    try {
      await api.put(`/api/billing/${id}/pay`);
      fetchBills();
      Alert.alert('Success', 'Payment marked as Done');
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const openEditModal = (bill) => {
    setSelectedBill(bill);
    setExtraAmount(bill.extraCharges.toString());
    setExtraDesc(bill.extraChargesDescription || '');
    setModalVisible(true);
  };

  const handleSaveExtra = async () => {
    try {
      await api.put(`/api/billing/${selectedBill._id}/extra`, { 
        amount: extraAmount,
        description: extraDesc 
      });
      setModalVisible(false);
      fetchBills();
      Alert.alert('Success', 'Charges updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update charges');
    }
  };

  const downloadBill = async (bill) => {
    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a202c; line-height: 1.6; }
            .header { border-bottom: 3px solid #c0a062; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            .hotel-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #154749; letter-spacing: 1px; }
            .invoice-label { font-size: 48px; color: #e2e8f0; font-weight: 900; position: absolute; right: 50px; top: 40px; opacity: 0.5; }
            .section { margin-bottom: 35px; background: #f8fafc; padding: 25px; borderRadius: 15px; }
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
            <div class="row"><span class="label">Guest Name</span> <span class="value">${bill.guestId?.fullName || 'Valued Guest'}</span></div>
            <div class="row"><span class="label">Room Reference</span> <span class="value">${bill.bookingId?.roomId?.type || 'Luxury Suite'} #${bill.bookingId?.roomId?.roomNumber || 'N/A'}</span></div>
            <div class="row"><span class="label">Payment Status</span> <span class="value" style="color: ${bill.paymentStatus === 'Done' ? '#38a169' : '#ecc94b'};">${bill.paymentStatus.toUpperCase()}</span></div>
          </div>
 
          <div class="section">
            <div class="section-title">Billing Summary</div>
            <div class="row"><span class="label">Base Accommodation Rate</span> <span class="value">${bill.currency} ${bill.originalPrice}</span></div>
            <div class="row"><span class="label">Exclusive Discount Applied</span> <span class="value" style="color: #38a169;">- ${bill.currency} ${bill.discountAmount}</span></div>
            ${bill.extraCharges > 0 ? `
              <div class="row"><span class="label">Additional Services <small class="gold">(${bill.extraChargesDescription || 'Service Charges'})</small></span> <span class="value" style="color: #e53e3e;">+ ${bill.currency} ${bill.extraCharges}</span></div>
            ` : ''}
          </div>
 
          <div class="total-row row">
            <span style="font-weight: 900;">TOTAL PAYABLE</span>
            <span style="font-weight: 900;">${bill.currency} ${bill.finalAmount}</span>
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

    const billsHtml = bills.map(bill => `
      <div class="bill-page" style="page-break-after: always; margin-bottom: 40px; border-bottom: 1px dashed #ccc; padding-bottom: 20px;">
        <div class="header">
          <div class="title">INVOICE</div>
          <div>Mapp Hotel Management</div>
        </div>
        
        <div class="section">
          <div class="row"><span class="label">Guest:</span> <span>${bill.guestId?.fullName || 'Guest'}</span></div>
          <div class="row"><span class="label">Date:</span> <span>${new Date().toLocaleDateString()}</span></div>
          <div class="row"><span class="label">Room Type:</span> <span>${bill.bookingId?.roomId?.type || 'N/A'}</span></div>
          <div class="row"><span class="label">Payment Status:</span> <span>${bill.paymentStatus}</span></div>
        </div>

        <div class="section">
          <div class="row"><span>Original Price</span> <span>${bill.currency} ${bill.originalPrice}</span></div>
          <div class="row" style="color: #38a169;"><span>Discount</span> <span>- ${bill.currency} ${bill.discountAmount}</span></div>
          ${bill.extraCharges > 0 ? `
            <div class="row" style="color: #e53e3e;"><span>Extra Charges</span> <span>+ ${bill.currency} ${bill.extraCharges}</span></div>
            <div class="extra-desc">Reason: ${bill.extraChargesDescription || 'Service charges'}</div>
          ` : ''}
        </div>

        <div class="total-row row">
          <span class="label">Total Amount</span>
          <span class="label">${bill.currency} ${bill.finalAmount}</span>
        </div>
      </div>
    `).join('');

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
          <h1 style="text-align: center; color: #154749;">Combined Billing Summary</h1>
          <p style="text-align: center;">Report Generated: ${new Date().toLocaleString()}</p>
          <hr/>
          ${billsHtml}
          <div class="footer">
            End of Billing Report - Mapp Hotels
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
        link.download = 'All_Guests_Billing_Report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate combined PDF report');
    }
  };

  const renderBill = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.guestName}>{item.guestId?.fullName || 'Guest'}</Text>
          {item.paymentMethod && (
            <Text style={styles.methodText}>via {item.paymentMethod}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.paymentStatus === 'Done' ? '#48bb78' : (item.paymentStatus === 'Pending' ? '#ecc94b' : '#e53e3e') 
        }]}>
          <Text style={styles.statusText}>{item.paymentStatus}</Text>
        </View>
        {!item.isVisibleToGuest && (
          <View style={[styles.statusBadge, { backgroundColor: '#718096', marginLeft: 8 }]}>
            <Text style={styles.statusText}>HIDDEN</Text>
          </View>
        )}
      </View>

      <Text style={styles.roomInfo}>Room: {item.bookingId?.roomId?.type || 'N/A'}</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Original Price:</Text>
        <Text style={styles.originalPrice}>{item.currency} {item.originalPrice}</Text>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Discount:</Text>
        <Text style={styles.discountPrice}>- {item.currency} {item.discountAmount}</Text>
      </View>

      {item.extraCharges > 0 && (
        <View style={{ marginBottom: 10 }}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Extra Charges:</Text>
            <Text style={styles.extraPrice}>+ {item.currency} {item.extraCharges}</Text>
          </View>
          {item.extraChargesDescription ? (
            <Text style={styles.extraDesc}>({item.extraChargesDescription})</Text>
          ) : null}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.priceRow}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalPrice}>{item.currency} {item.finalAmount}</Text>
      </View>

      <View style={styles.actions}>
        {item.paymentStatus !== 'Done' ? (
          <>
            <TouchableOpacity 
              style={[
                styles.payBtn, 
                item.paymentStatus === 'Pending' ? { backgroundColor: '#ecc94b' } : { backgroundColor: '#a0aec0' }
              ]} 
              onPress={() => item.paymentStatus === 'Pending' ? markAsPaid(item._id) : Alert.alert('Action Required', 'Admin can only confirm after the guest makes the payment.')}
            >
              <Text style={styles.btnText}>{item.paymentStatus === 'Pending' ? 'Verify & Done' : 'Wait for Payment'}</Text>
            </TouchableOpacity>
            
            {item.paymentStatus === 'Unpaid' && (
              <TouchableOpacity style={styles.extraBtn} onPress={() => openEditModal(item)}>
                <Text style={styles.btnText}>Edit Charges</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.downloadBtn, { backgroundColor: item.isVisibleToGuest ? '#e53e3e' : '#154749', marginLeft: 10 }]} 
              onPress={() => toggleVisibility(item._id, item.isVisibleToGuest)}
            >
              <Ionicons name={item.isVisibleToGuest ? "eye-off-outline" : "eye-outline"} size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{flex: 1, backgroundColor: '#f0fff4', padding: 8, borderRadius: 8, marginRight: 10, alignItems: 'center'}}>
            <Text style={{color: '#38a169', fontWeight: 'bold', fontSize: 12}}>Payment Completed</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.downloadBtn, {marginLeft: 10}]} onPress={() => downloadBill(item)}>
          <Ionicons name="download-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Financial Management</Text>
        {bills.length > 0 && (
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
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No bills generated yet.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Bill Details</Text>
            
            <Text style={styles.inputLabel}>Extra Charges Amount</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={extraAmount} 
              onChangeText={setExtraAmount} 
            />
            
            <Text style={styles.inputLabel}>Charges Description</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              multiline 
              placeholder="e.g. Minibar, Late checkout, Damage" 
              value={extraDesc} 
              onChangeText={setExtraDesc} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExtra}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#154749', margin: 20 },
  downloadAllBtn: { backgroundColor: '#154749', flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 },
  downloadAllText: { color: '#fff', marginLeft: 5, fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 18, marginBottom: 20, elevation: 3, marginHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  guestName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  methodText: { fontSize: 11, color: '#c0a062', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  roomInfo: { fontSize: 14, color: '#718096', marginBottom: 15 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  priceLabel: { fontSize: 14, color: '#4a5568' },
  originalPrice: { fontSize: 14, color: '#718096', textDecorationLine: 'line-through' },
  discountPrice: { fontSize: 14, color: '#38a169', fontWeight: 'bold' },
  extraPrice: { fontSize: 14, color: '#e53e3e', fontWeight: 'bold' },
  extraDesc: { fontSize: 12, color: '#718096', fontStyle: 'italic', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#edf2f7', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#154749' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  payBtn: { backgroundColor: '#38a169', flex: 0.4, padding: 10, borderRadius: 8, alignItems: 'center' },
  extraBtn: { backgroundColor: '#3182ce', flex: 0.4, padding: 10, borderRadius: 8, alignItems: 'center' },
  downloadBtn: { backgroundColor: '#154749', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#a0aec0' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', width: '90%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#154749', marginBottom: 20 },
  inputLabel: { fontSize: 14, color: '#718096', marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 0.48, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  saveBtn: { flex: 0.48, padding: 15, borderRadius: 10, backgroundColor: '#154749', alignItems: 'center' },
  cancelBtnText: { color: '#718096', fontWeight: 'bold' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default BillingScreen;
