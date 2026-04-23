import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import useSWR from 'swr';
import { swrFetcher } from '../config/fetcher';

export default function CustomersScreen({ navigation }) {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: rawCustomers = [], error, isLoading, isValidating, mutate } = useSWR(
        token ? ['/api/customers', token] : null,
        swrFetcher
    );

    const filteredCustomers = useMemo(() => {
        const sorted = [...rawCustomers].sort((a,b) => a.name.localeCompare(b.name));
        return sorted.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [rawCustomers, searchQuery]);

    const renderCustomerItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('CustomerDetail', { customer: item })}
        >
            {item.photoURL ? (
                <Image source={{ uri: item.photoURL.replace('http:', 'https:') }} style={styles.avatarImage} />
            ) : (
                <View style={[styles.avatarImage, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
                </View>
            )}
            
            <View style={styles.cardContent}>
                <Text style={styles.customerName}>{item.name}</Text>
                <View style={styles.detailRow}>
                    <Ionicons name="call" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{item.phone}</Text>
                </View>
                {item.location && (
                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{item.location}</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.actionBlock}>
                <View style={styles.iconBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !rawCustomers.length) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Client CRM</Text>
                <Text style={styles.subtitle}>{filteredCustomers.length} Registered Contacts</Text>
            </View>

            {/* Native Search Bar */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search customers by name..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item._id}
                renderItem={renderCustomerItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isValidating} onRefresh={mutate} color="#2563eb" />}
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('CustomerCreate')}
                activeOpacity={0.8}
            >
                <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 10, paddingBottom: 10 },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a' },
    title: { fontSize: 28, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
    list: { paddingHorizontal: 15, paddingBottom: 100 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' },
    avatarImage: { width: 56, height: 56, borderRadius: 28, marginRight: 16, backgroundColor: '#e5e7eb' },
    avatarFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
    avatarText: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' },
    cardContent: { flex: 1 },
    customerName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    detailText: { fontSize: 14, color: '#4b5563', marginLeft: 6 },
    actionBlock: { paddingLeft: 10 },
    iconBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 12 },
    fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }
});
