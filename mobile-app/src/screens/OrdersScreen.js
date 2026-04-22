import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchApi } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen({ navigation }) {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadOrders(activeTab);
        });
        return unsubscribe;
    }, [navigation, activeTab]);

    const loadOrders = async (tabStr = activeTab) => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/orders?filter=${tabStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Sort to show newest first
            const sorted = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        loadOrders(tab);
    }

    const renderOrderItem = ({ item }) => {
        // Find smallest and largest dates in subEvents
        let dateSummary = 'Unknown Date';
        if (item.subEvents && item.subEvents.length > 0) {
           const dates = item.subEvents.map(e => new Date(e.date).getTime());
           const minD = new Date(Math.min(...dates));
           dateSummary = minD.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.customerBlock}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.customer.name[0]?.toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.customerName}>{item.customer.name}</Text>
                            <Text style={styles.refId}>REF: {item._id.substring(item._id.length - 6).toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'Confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                        <Text style={[styles.statusText, item.status === 'Confirmed' ? styles.statusTextConfirmed : styles.statusTextPending]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        <Text style={styles.footerText}>{dateSummary}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="layers-outline" size={16} color="#6b7280" />
                        <Text style={styles.footerText}>{item.subEvents.length} Events</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Bookings</Text>
                <Text style={styles.subtitle}>{orders.length} {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Orders</Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]} 
                    onPress={() => handleTabChange('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'past' && styles.tabBtnActive]} 
                    onPress={() => handleTabChange('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past History</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 10, paddingBottom: 15 },
    tabContainer: { flexDirection: 'row', marginHorizontal: 15, marginBottom: 15, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    tabText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
    tabTextActive: { color: '#2563eb' },
    title: { fontSize: 28, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
    list: { paddingHorizontal: 15, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f3f4f6' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    customerBlock: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#bfdbfe' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
    customerName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    refId: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusPending: { backgroundColor: '#fef3c7' },
    statusTextPending: { color: '#d97706', fontSize: 12, fontWeight: 'bold' },
    statusConfirmed: { backgroundColor: '#dcfce7' },
    statusTextConfirmed: { color: '#16a34a', fontSize: 12, fontWeight: 'bold' },
    cardDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-start', gap: 20 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
    fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }
});
