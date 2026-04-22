import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchApi } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerDetailScreen({ route, navigation }) {
    const { customer } = route.params;
    const { token } = useAuth();
    
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        loadCustomerOrders();
        
        // Add Edit & Trash icon to header
        navigation.setOptions({
            headerRight: () => (
                <View style={{flexDirection: 'row', gap: 18, paddingRight: 8}}>
                    <TouchableOpacity onPress={() => navigation.navigate('CustomerCreate', { customer })}>
                        <Ionicons name="pencil-outline" size={24} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteCustomer}>
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )
        });
    }, [navigation, customer]);

    const loadCustomerOrders = async () => {
        try {
            const data = await fetchApi(`/api/orders?customerId=${customer._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrders(data);
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleDeleteCustomer = () => {
        Alert.alert('Delete Client', `Are you sure you want to permanently erase ${customer.name}? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await fetchApi(`/api/customers/${customer._id}`, { 
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        navigation.goBack(); // Trigger refresh back on Customers List
                    } catch (err) {
                        Alert.alert('Error', err.message);
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerBlock}>
                    {customer.photoURL ? (
                        <Image source={{ uri: customer.photoURL.replace('http:', 'https:') }} style={styles.avatarLarge} />
                    ) : (
                        <View style={[styles.avatarLarge, styles.avatarFallback]}>
                            <Text style={styles.avatarText}>{customer.name[0]?.toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{customer.name}</Text>
                    <Text style={styles.subText}>Registered Client</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Contact Details</Text>
                    
                    <View style={styles.row}>
                        <Ionicons name="call" size={20} color="#64748b" />
                        <Text style={styles.rowText}>{customer.phone || 'No phone provided'}</Text>
                    </View>
                    
                    {customer.email && (
                        <View style={styles.row}>
                            <Ionicons name="mail" size={20} color="#64748b" />
                            <Text style={styles.rowText}>{customer.email}</Text>
                        </View>
                    )}

                    {customer.location && (
                        <View style={styles.row}>
                            <Ionicons name="location" size={20} color="#64748b" />
                            <Text style={styles.rowText}>{customer.location}</Text>
                        </View>
                    )}
                </View>

                {/* Orders Section */}
                <View style={styles.ordersSection}>
                    <Text style={styles.sectionTitle}>Booking History</Text>
                    
                    {loadingOrders ? (
                        <ActivityIndicator style={{marginTop: 20}} color="#2563eb" />
                    ) : orders.length === 0 ? (
                        <Text style={styles.emptyText}>No orders linked to this client yet.</Text>
                    ) : (
                        orders.map(order => (
                            <TouchableOpacity 
                                key={order._id} 
                                style={styles.orderCard}
                                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderRef}>Manifest #{order._id.substring(order._id.length - 6).toUpperCase()}</Text>
                                    <View style={[styles.statusBadge, order.status === 'Confirmed' ? styles.badgeConfirmed : styles.badgePending]}>
                                        <Text style={[styles.statusText, order.status === 'Confirmed' ? styles.textConfirmed : styles.textPending]}>{order.status}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.orderEventsCount}>
                                    {order.subEvents?.length || 0} Event Blocks
                                </Text>
                                
                                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                                    <View style={styles.dateChip}>
                                        <Text style={styles.dateChipText}>
                                            {order.subEvents?.[0]?.date 
                                                ? new Date(order.subEvents[0].date).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'}) 
                                                : 'Unscheduled'}
                                        </Text>
                                    </View>
                                    {order.subEvents?.length > 1 && <Text style={styles.plusMore}>+{order.subEvents.length - 1} more</Text>}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
                
                <View style={{height: 40}} />
            </ScrollView>

            <View style={styles.bottomTray}>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('OrderCreate', { customer })}
                    activeOpacity={0.8}
                >
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>+ Add Event / Order</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    headerBlock: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOpacity: 0.05, elevation: 4 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    avatarFallback: { backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bfdbfe' },
    avatarText: { fontSize: 40, fontWeight: 'bold', color: '#2563eb' },
    name: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
    subText: { fontSize: 14, color: '#64748b', marginTop: 4 },
    infoCard: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rowText: { fontSize: 15, color: '#475569', marginLeft: 12 },
    ordersSection: { paddingHorizontal: 20 },
    emptyText: { color: '#64748b', fontStyle: 'italic', marginTop: 10 },
    orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderRef: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeConfirmed: { backgroundColor: '#dcfce7' },
    badgePending: { backgroundColor: '#fef3c7' },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    textConfirmed: { color: '#16a34a' },
    textPending: { color: '#d97706' },
    orderEventsCount: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
    dateChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dateChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
    plusMore: { fontSize: 12, color: '#94a3b8', marginLeft: 8, fontWeight: '600' },
    bottomTray: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    actionBtn: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});
