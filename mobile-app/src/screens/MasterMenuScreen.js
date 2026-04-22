import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { fetchApi } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function MasterMenuScreen({ navigation }) {
    const { token } = useAuth();
    
    // Core Data
    const [menuItems, setMenuItems] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals & Forms
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Item Form State
    const [itemForm, setItemForm] = useState({ category: 'Veg', subCategory: '', itemName: '' });
    
    // Category Form State
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        fetchDependencies();
    }, []);

    const fetchDependencies = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [menusData, catsData] = await Promise.all([
                fetchApi('/api/menu', { headers }),
                fetchApi('/api/menu/categories', { headers })
            ]);
            setMenuItems(menusData);
            setSubCategories(catsData);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch catalog.');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [menuItems, searchQuery]);

    const vegItems = filteredItems.filter(item => item.category === 'Veg');
    const nonVegItems = filteredItems.filter(item => item.category === 'Non-Veg');

    // Handlers
    const openAddItemModal = () => {
        setEditingId(null);
        setItemForm({ 
            category: 'Veg', 
            subCategory: subCategories.length > 0 ? subCategories[0].name : '', 
            itemName: '' 
        });
        setItemModalVisible(true);
    };

    const openEditItemModal = (item) => {
        setEditingId(item._id);
        setItemForm({
            category: item.category,
            subCategory: item.subCategory,
            itemName: item.itemName
        });
        setItemModalVisible(true);
    };

    const handleDeleteItem = (id) => {
        Alert.alert('Delete Item', 'Are you sure you want to permanently delete this menu item?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await fetchApi(`/api/menu/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        fetchDependencies();
                    } catch(err) {
                        Alert.alert('Error', err.message);
                    }
                } 
            }
        ]);
    };

    const handleDeleteCategory = (id) => {
        Alert.alert('Delete Category', 'This permanently removes it from the picker dropdown. Proceed?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await fetchApi(`/api/menu/categories/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        fetchDependencies();
                    } catch(err) {
                        Alert.alert('Error', err.message);
                    }
                } 
            }
        ]);
    };

    const handleSaveItem = async () => {
        if (!itemForm.itemName.trim() || !itemForm.subCategory) {
            Alert.alert('Validation Check', 'Item name and Sub-category are strictly required.');
            return;
        }

        setSaving(true);
        try {
            const url = editingId ? `/api/menu/${editingId}` : '/api/menu';
            const method = editingId ? 'PUT' : 'POST';
            
            await fetchApi(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(itemForm)
            });

            setItemModalVisible(false);
            fetchDependencies();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSaving(true);
        try {
            await fetchApi('/api/menu/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newCategoryName.trim() })
            });
            setNewCategoryName('');
            fetchDependencies();
            // Automatically select it
            setItemForm(prev => ({ ...prev, subCategory: newCategoryName.trim() }));
            setCategoryModalVisible(false);
            // After creating category, maybe re-open Item Model if it was interrupted
            if (itemModalVisible) {
                // Return to it
            }
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const renderMenuBlock = (item) => (
        <View key={item._id} style={styles.itemCard}>
            <View style={styles.itemMeta}>
                <Text style={styles.itemTitle}>{item.itemName}</Text>
                <Text style={styles.itemSub}>{item.subCategory}</Text>
            </View>
            <View style={styles.itemActions}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#eff6ff'}]} onPress={() => openEditItemModal(item)}>
                    <Ionicons name="pencil" size={16} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#fef2f2'}]} onPress={() => handleDeleteItem(item._id)}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Native Search Bar */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search menu items or categories..."
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

            <ScrollView contentContainerStyle={styles.directoryList} showsVerticalScrollIndicator={false}>
                
                {/* Veg Block */}
                {vegItems.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.dot, {backgroundColor: '#10b981'}]} />
                            <Text style={[styles.sectionTitle, {color: '#047857'}]}>Vegetarian Menu</Text>
                        </View>
                        {vegItems.map(renderMenuBlock)}
                    </View>
                )}

                {/* Non-Veg Block */}
                {nonVegItems.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.dot, {backgroundColor: '#ef4444'}]} />
                            <Text style={[styles.sectionTitle, {color: '#b91c1c'}]}>Non-Vegetarian Menu</Text>
                        </View>
                        {nonVegItems.map(renderMenuBlock)}
                    </View>
                )}

                {vegItems.length === 0 && nonVegItems.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Directory Empty</Text>
                        <Text style={styles.emptySub}>No items match your criteria.</Text>
                    </View>
                )}

                <View style={{height: 100}} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={openAddItemModal} activeOpacity={0.8}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Main Item Form Modal */}
            <Modal visible={itemModalVisible} animationType="slide" transparent={true} onRequestClose={() => setItemModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => setItemModalVisible(false)} />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>{editingId ? 'Edit Menu Item' : 'Add New Item'}</Text>
                            <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Segment Controller */}
                        <View style={styles.segmentWrapper}>
                            <TouchableOpacity style={[styles.segmentBtn, itemForm.category === 'Veg' && styles.segmentActiveVeg]} onPress={() => setItemForm({...itemForm, category: 'Veg'})}>
                                <Text style={[styles.segmentText, itemForm.category === 'Veg' && {color: '#fff'}]}>Vegetarian</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.segmentBtn, itemForm.category === 'Non-Veg' && styles.segmentActiveNonVeg]} onPress={() => setItemForm({...itemForm, category: 'Non-Veg'})}>
                                <Text style={[styles.segmentText, itemForm.category === 'Non-Veg' && {color: '#fff'}]}>Non-Veg</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inputs */}
                        <Text style={styles.fieldLabel}>Item Name</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            placeholder="e.g. Garlic Naan" 
                            placeholderTextColor="#9ca3af"
                            value={itemForm.itemName}
                            onChangeText={(t) => setItemForm({...itemForm, itemName: t})}
                        />

                        <Text style={styles.fieldLabel}>Sub-Category Grouping</Text>
                        <View style={{flexDirection: 'row', gap: 10}}>
                            {subCategories.length === 0 ? (
                                <View style={[styles.modalInput, {flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center'}]}>
                                    <Text style={{color: '#94a3b8'}}>None Available</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal style={{flex: 1}} showsHorizontalScrollIndicator={false}>
                                    {subCategories.map(sc => (
                                        <TouchableOpacity 
                                            key={sc._id} 
                                            style={[styles.chip, itemForm.subCategory === sc.name && styles.chipActive]}
                                            onPress={() => setItemForm({...itemForm, subCategory: sc.name})}
                                        >
                                            <Text style={[styles.chipText, itemForm.subCategory === sc.name && styles.chipTextActive]}>{sc.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                            <TouchableOpacity style={styles.addCatBtn} onPress={() => setCategoryModalVisible(true)}>
                                <Ionicons name="add" size={20} color="#2563eb" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? 'Commit Edits' : 'Deploy Native Item'}</Text>}
                        </TouchableOpacity>

                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Category Addition Model */}
            <Modal visible={categoryModalVisible} animationType="fade" transparent={true} onRequestClose={() => setCategoryModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalOverlay, {justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)'}]}>
                    <View style={styles.miniModal}>
                        <Text style={styles.modalTitle}>Manage Grouping</Text>
                        <Text style={{color: '#64748b', fontSize: 13, marginBottom: 15}}>Define a new sub-category (like Soups). You can also tap existing ones below to purge them.</Text>
                        
                        <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                            <TextInput 
                                style={[styles.modalInput, {flex: 1, marginBottom: 0}]}
                                placeholder="New sub-category..."
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                            />
                            <TouchableOpacity style={styles.miniSaveBtn} onPress={handleAddCategory} disabled={saving || !newCategoryName.trim()}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={20} color="#fff" />}
                            </TouchableOpacity>
                        </View>

                        {/* Existing cats list */}
                        <ScrollView style={{maxHeight: 150}} showsVerticalScrollIndicator={false}>
                            {subCategories.map(sc => (
                                <View key={sc._id} style={styles.miniCatRow}>
                                    <Text style={{fontWeight: '600', color: '#1e293b'}}>{sc.name}</Text>
                                    <TouchableOpacity onPress={() => handleDeleteCategory(sc._id)} style={{padding: 5}}>
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={{alignItems: 'center', marginTop: 15, padding: 10}} onPress={() => setCategoryModalVisible(false)}>
                            <Text style={{color: '#64748b', fontWeight: 'bold'}}>Return to Form</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Search Native
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#0f172a' },
    
    // Directory Space
    directoryList: { paddingHorizontal: 16 },
    sectionBlock: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '900' },
    
    // Item Nodes
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    itemMeta: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    itemSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    itemActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    
    emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b', marginTop: 15 },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 5 },

    // Floating Button
    fab: { position: 'absolute', bottom: 30, right: 20, width: 66, height: 66, borderRadius: 33, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    
    // Bottom Sheet UX
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHandle: { width: 50, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
    
    segmentWrapper: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 20 },
    segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    segmentText: { fontWeight: 'bold', color: '#64748b' },
    segmentActiveVeg: { backgroundColor: '#10b981', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    segmentActiveNonVeg: { backgroundColor: '#ef4444', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    
    fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
    
    chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
    chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    chipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    chipTextActive: { color: '#2563eb' },
    addCatBtn: { width: 50, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
    
    saveBtn: { backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    // Mini Pop UI
    miniModal: { backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    miniSaveBtn: { backgroundColor: '#10b981', width: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    miniCatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }
});
