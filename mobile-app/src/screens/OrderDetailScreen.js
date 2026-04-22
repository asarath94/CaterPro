import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import * as Notifications from 'expo-notifications';
import { fetchApi } from '../config/api';
import { useAuth } from '../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function OrderDetailScreen({ route, navigation }) {
    const { orderId } = route.params;
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    // Modal Settings
    const [optionsVisible, setOptionsVisible] = useState(false);

    useEffect(() => {
        loadOrder();
        requestPermissions();
        
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setOptionsVisible(true)} style={{padding: 8}}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    const requestPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please enable notifications to set local reminders.');
        }
    };

    const loadOrder = async () => {
        try {
            const data = await fetchApi(`/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrder(data);
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    const handleDelete = () => {
        Alert.alert('Erase Order', 'Permanently destroy this native mapping?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Destroy', style: 'destructive', onPress: async () => {
                try {
                    await fetchApi(`/api/orders/${orderId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                    navigation.popToTop();
                } catch(err) {
                    Alert.alert('Error', err.message);
                }
            }}
        ]);
    };

    const handleExportPDF = async () => {
        if (!order) return;
        setOptionsVisible(false);
        try {
            // Build absolute aesthetic HTML string identically matching the web platform layout.
            let eventsHtml = '';
            order.subEvents.forEach((ev, i) => {
                let menuHtml = '';
                ev.selectedMenuItems.forEach(item => {
                    menuHtml += `<p style="margin: 4px 0; font-size: 14px; font-weight: 500;">• ${item.itemName} <span style="font-size: 12px; color: #64748b;">(${item.subCategory})</span></p>`;
                });
                
                eventsHtml += `
                    <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                       <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">Event ${i+1}: ${ev.eventName}</h3>
                       <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">📅 ${new Date(ev.date).toLocaleDateString()} | 📍 ${ev.location} | 👥 ${ev.guestCount} Guests</p>
                       <h4 style="font-size: 13px; color: #94a3b8; text-transform: uppercase;">Menu Configuration</h4>
                       ${menuHtml || `<p style="font-size: 14px; color: #94a3b8; font-style: italic;">No specific items allocated</p>`}
                    </div>
                `;
            });

            const htmlContent = `
                <html>
                   <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                      <style> body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; } </style>
                   </head>
                   <body>
                      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 16px; color: white; margin-bottom: 30px;">
                          <h1 style="margin: 0; font-size: 28px;">Booking Manifest</h1>
                          <p style="margin: 5px 0 0 0; opacity: 0.9;">REF: ${order._id.substring(order._id.length - 8).toUpperCase()}</p>
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                          <div>
                              <h2 style="margin: 0 0 5px 0; color: #0f172a;">${order.customer.name}</h2>
                              <p style="margin: 0; color: #64748b;">📞 ${order.customer.phone || 'N/A'}</p>
                              <p style="margin: 0; color: #64748b;">📍 ${order.customer.location || 'N/A'}</p>
                          </div>
                          <div style="text-align: right;">
                              <div style="background: #e0e7ff; color: #4338ca; padding: 8px 16px; border-radius: 8px; font-weight: bold; display: inline-block;">
                                  ${order.status}
                              </div>
                          </div>
                      </div>
                      
                      ${eventsHtml}
                      
                      <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
                          Generated securely via Catering Native iOS/Android Engine
                      </div>
                   </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    const scheduleReminder = async () => {
        if (!order) return;
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Catering Reminder: ${order.customer.name}`,
                    body: `Check ingredient stock for the upcoming event!`,
                    data: { orderId: order._id }
                },
                trigger: { seconds: 10 },
            });
            Alert.alert('Reminder Set', 'A device push notification will trigger securely in 10 seconds.');
        } catch (err) {
            Alert.alert('Error', 'Failed to schedule notification');
        }
    };

    if (!order) return <View style={styles.center}><Text>Loading native order payload...</Text></View>;

    return (
        <View style={{flex: 1}}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.manifestHeader}>
                        <Text style={styles.title}>Manifest #{order._id.substring(order._id.length - 8).toUpperCase()}</Text>
                        <View style={[styles.badge, order.status === 'Confirmed' ? styles.badgeConfirmed : styles.badgePending]}>
                            <Text style={[styles.badgeText, order.status === 'Confirmed' ? styles.badgeTextConfirmed : styles.badgeTextPending]}>{order.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.client}>Client: <Text style={{fontWeight: 'bold', color: '#111827'}}>{order.customer.name}</Text></Text>
                    {order.customer.phone && <Text style={styles.detailText}>📞 {order.customer.phone}</Text>}
                    {order.customer.location && <Text style={styles.detailText}>📍 {order.customer.location}</Text>}
                </View>

                <TouchableOpacity style={styles.reminderBtn} onPress={scheduleReminder} activeOpacity={0.8}>
                    <Text style={styles.reminderBtnText}>🔔 Set Local Push Reminder</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Event Blocks</Text>

                {order.subEvents?.map((ev, i) => (
                    <View key={ev._id} style={styles.eventCard}>
                        <View style={styles.eventHeader}>
                            <View>
                                <Text style={styles.eventNum}>EVENT {i + 1}</Text>
                                <Text style={styles.eventName}>{ev.eventName}</Text>
                            </View>
                            <View style={styles.guestBadge}>
                                <Text style={styles.guestBadgeText}>{ev.guestCount} Guests</Text>
                            </View>
                        </View>
                        
                        <View style={styles.eventMeta}>
                            <Text style={styles.metaText}>📅 {new Date(ev.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})} at {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            <Text style={styles.metaText}>📍 {ev.location}</Text>
                        </View>

                        <View style={styles.menuContainer}>
                            <Text style={styles.menuTitle}>Allocated Menu Items</Text>
                            {ev.selectedMenuItems && ev.selectedMenuItems.length > 0 ? (
                                ev.selectedMenuItems.map((item, idx) => (
                                    <View key={item._id || idx} style={styles.menuItem}>
                                        <View style={[styles.dot, { backgroundColor: item.category === 'Veg' ? '#22c55e' : '#ef4444' }]} />
                                        <Text style={styles.menuItemText}>{item.itemName}</Text>
                                        <Text style={styles.menuItemSub}>{item.subCategory}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noItems}>No specific items selected.</Text>
                            )}
                        </View>
                    </View>
                ))}
                
                <View style={{height: 40}} />
            </ScrollView>

            <Modal
                transparent={true}
                visible={optionsVisible}
                animationType="fade"
                onRequestClose={() => setOptionsVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setOptionsVisible(false)} activeOpacity={1}>
                    <View style={styles.actionSheet}>
                        <View style={styles.actionHandle} />
                        <Text style={styles.sheetTitle}>Order Actions</Text>
                        
                        <TouchableOpacity style={styles.sheetBtn} onPress={handleExportPDF}>
                            <Ionicons name="document-text-outline" size={24} color="#2563eb" />
                            <Text style={styles.sheetBtnText}>Export PDF Manifest</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sheetBtn} onPress={() => {setOptionsVisible(false); navigation.navigate('OrderCreate', { editOrder: order, customer: order.customer })}}>
                            <Ionicons name="pencil-outline" size={24} color="#10b981" />
                            <Text style={styles.sheetBtnText}>Modify / Edit Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.sheetBtn, {borderBottomWidth: 0}]} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                            <Text style={[styles.sheetBtnText, {color: '#ef4444'}]}>Delete Order Forever</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    manifestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgePending: { backgroundColor: '#fef3c7' },
    badgeTextPending: { color: '#d97706', fontWeight: 'bold', fontSize: 12 },
    badgeConfirmed: { backgroundColor: '#dcfce7' },
    badgeTextConfirmed: { color: '#16a34a', fontWeight: 'bold', fontSize: 12 },
    client: { fontSize: 16, color: '#64748b', marginBottom: 8 },
    detailText: { fontSize: 14, color: '#475569', marginBottom: 4 },
    reminderBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    reminderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 16, marginLeft: 4 },
    eventCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    eventHeader: { backgroundColor: '#0f172a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eventNum: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
    eventName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    guestBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    guestBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    eventMeta: { padding: 16, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    metaText: { fontSize: 14, color: '#475569', fontWeight: '500', marginBottom: 4 },
    menuContainer: { padding: 16 },
    menuTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    menuItemText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    menuItemSub: { fontSize: 12, color: '#64748b', fontWeight: '600', backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    noItems: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },
    
    // Bottom Sheet Options
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    actionSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    actionHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
    sheetBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    sheetBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginLeft: 16 }
});
