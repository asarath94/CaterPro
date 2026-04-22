import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../config/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
    const { token, admin, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [optionsVisible, setOptionsVisible] = useState(false);
    
    // States for the 3 main metrics
    const [stats, setStats] = useState({ customers: 0, menus: 0, orders: 0 });
    const [nextEvents, setNextEvents] = useState([]);

    const loadData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Promise.all to fetch all metrics concurrently exactly like the Web dashboard
            const [customersData, menusData, ordersData] = await Promise.all([
                fetchApi('/api/customers', { headers }),
                fetchApi('/api/menu', { headers }),
                fetchApi('/api/orders?filter=upcoming', { headers })
            ]);

            setStats({
                customers: customersData.length || 0,
                menus: menusData.length || 0,
                orders: ordersData.length || 0
            });

            // Calculate 'Next Up' timeline
            const allSubEvents = [];
            ordersData.forEach(order => {
                if (order.subEvents) {
                    order.subEvents.forEach(ev => {
                        allSubEvents.push({
                            ...ev,
                            orderId: order._id,
                            customerName: order.customer.name,
                            orderStatus: order.status
                        });
                    });
                }
            });

            const now = new Date();
            const upcoming = allSubEvents
                .filter(ev => new Date(ev.date) > now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3); // Grab closest 3

            setNextEvents(upcoming);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            <View style={styles.header}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {admin?.businessLogo ? (
                        <Image source={{ uri: admin.businessLogo.replace('http:', 'https:') }} style={styles.avatarLogo} />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{admin?.businessName?.[0]?.toUpperCase() || 'C'}</Text>
                        </View>
                    )}
                    <Text style={styles.adminName} numberOfLines={1}>{admin?.businessName || 'Catering Dashboard'}</Text>
                </View>
                
                <TouchableOpacity onPress={() => setOptionsVisible(true)} style={{padding: 5}}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            >
            {/* Metric Cards Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderBottomColor: '#3b82f6' }]}>
                    <Ionicons name="people" size={24} color="#3b82f6" />
                    <Text style={styles.statNumber}>{stats.customers}</Text>
                    <Text style={styles.statLabel}>Total Clients</Text>
                </View>
                <View style={[styles.statCard, { borderBottomColor: '#f59e0b' }]}>
                    <Ionicons name="restaurant" size={24} color="#f59e0b" />
                    <Text style={styles.statNumber}>{stats.menus}</Text>
                    <Text style={styles.statLabel}>Menu Items</Text>
                </View>
                <View style={[styles.statCard, { borderBottomColor: '#10b981', width: '100%', marginTop: 15 }]}>
                    <Ionicons name="receipt" size={24} color="#10b981" />
                    <Text style={styles.statNumber}>{stats.orders}</Text>
                    <Text style={styles.statLabel}>Active Orders</Text>
                </View>
            </View>

            {/* Next Up Timeline */}
            <Text style={styles.sectionTitle}>Next Up</Text>
            {nextEvents.length > 0 ? (
                <View style={styles.timelineContainer}>
                    {nextEvents.map((ev, i) => (
                        <View key={ev._id} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            {i !== nextEvents.length - 1 && <View style={styles.timelineLine} />}
                            <View style={styles.timelineCard}>
                                <Text style={styles.evName}>{ev.eventName}</Text>
                                <Text style={styles.evClient}>{ev.customerName}</Text>
                                <View style={styles.evFooter}>
                                    <Text style={styles.evDate}>
                                        <Ionicons name="time-outline" size={12} /> {new Date(ev.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </Text>
                                    <Text style={styles.evGuest}>
                                        <Ionicons name="people-outline" size={12} /> {ev.guestCount}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={40} color="#9ca3af" />
                    <Text style={styles.emptyText}>No upcoming sub-events.</Text>
                </View>
            )}

            </ScrollView>

            {/* Profile Options Modal */}
            <Modal transparent={true} visible={optionsVisible} animationType="fade" onRequestClose={() => setOptionsVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setOptionsVisible(false)} activeOpacity={1}>
                    <View style={styles.actionSheet}>
                        <View style={styles.actionHandle} />
                        <Text style={styles.sheetTitle}>Account Menu</Text>
                        
                        <TouchableOpacity style={styles.sheetBtn} onPress={() => { setOptionsVisible(false); navigation.navigate('MasterMenu'); }}>
                            <Ionicons name="restaurant-outline" size={24} color="#10b981" />
                            <Text style={styles.sheetBtnText}>Master Menu Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sheetBtn} onPress={() => { setOptionsVisible(false); navigation.navigate('Profile'); }}>
                            <Ionicons name="person-circle-outline" size={24} color="#2563eb" />
                            <Text style={styles.sheetBtnText}>Business Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.sheetBtn, {borderBottomWidth: 0}]} onPress={() => { setOptionsVisible(false); logout(); }}>
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                            <Text style={[styles.sheetBtnText, {color: '#ef4444'}]}>Secure Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#0f172a', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    adminName: { color: '#fff', fontSize: 26, fontWeight: '900', marginLeft: 16, maxWidth: '78%' },
    avatarLogo: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', borderWidth: 2, borderColor: '#3b82f6' },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
    
    // Bottom Sheet Options
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    actionSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    actionHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
    sheetBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    sheetBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginLeft: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 15 },
    statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderBottomWidth: 4 },
    statNumber: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginVertical: 5 },
    statLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginHorizontal: 20, marginTop: 10, mb: 10 },
    timelineContainer: { paddingHorizontal: 20, paddingBottom: 40, marginTop: 15 },
    timelineItem: { flexDirection: 'row', marginBottom: 20 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563eb', marginTop: 10, zIndex: 2 },
    timelineLine: { position: 'absolute', left: 6, top: 24, bottom: -20, width: 2, backgroundColor: '#bfdbfe', zIndex: 1 },
    timelineCard: { flex: 1, marginLeft: 15, backgroundColor: '#fff', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    evName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    evClient: { fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 8 },
    evFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
    evDate: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
    evGuest: { fontSize: 12, color: '#ea580c', fontWeight: '600' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9ca3af', marginTop: 10 }
});
