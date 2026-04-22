import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../config/api';

export default function OrderCreateScreen({ route, navigation }) {
    const { customer, editOrder } = route.params;
    const { token } = useAuth();
    
    const isEditMode = !!editOrder;

    const initialSubEvents = isEditMode 
        ? editOrder.subEvents.map((ev, index) => ({
            id: ev._id || Date.now().toString() + index,
            eventName: ev.eventName,
            date: new Date(ev.date),
            guestCount: String(ev.guestCount),
            location: ev.location,
            selectedMenuItems: ev.selectedMenuItems || []
        }))
        : [{ id: Date.now().toString(), eventName: 'Main Event', date: new Date(), guestCount: '', location: '', selectedMenuItems: [] }];

    const [subEvents, setSubEvents] = useState(initialSubEvents);
    
    // Master Menu State
    const [masterMenu, setMasterMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true);
    
    // UI states
    const [expandedEventId, setExpandedEventId] = useState(subEvents[0].id);
    const [saving, setSaving] = useState(false);
    
    // Menu Picker Modal State
    const [menuModalVisible, setMenuModalVisible] = useState(false);
    const [activeEventIndex, setActiveEventIndex] = useState(null);
    const [tempSelectedItems, setTempSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Veg, Non-Veg
    
    // DateTime Picker Modal State
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [activeDtIndex, setActiveDtIndex] = useState(0);
    const [tempHr, setTempHr] = useState('12');
    const [tempMin, setTempMin] = useState('00');
    const [tempAmPm, setTempAmPm] = useState('AM');
    useEffect(() => {
        loadMasterMenu();
    }, []);

    const loadMasterMenu = async () => {
        try {
            const data = await fetchApi('/api/menu', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMasterMenu(data);
            
            // Extract distinct categories
            const cats = [...new Set(data.map(item => item.subCategory))].filter(Boolean);
            setCategories(cats);
        } catch (err) {
            Alert.alert('Error', 'Failed to load menu templates');
        } finally {
            setLoadingMenu(false);
        }
    };

    // SubEvent Actions
    const addSubEvent = () => {
        const newId = Date.now().toString();
        setSubEvents([...subEvents, { id: newId, eventName: `Event ${subEvents.length + 1}`, date: new Date(), guestCount: '', location: '', selectedMenuItems: [] }]);
        setExpandedEventId(newId);
    };

    const removeSubEvent = (id) => {
        if (subEvents.length === 1) return Alert.alert('Warning', 'At least one event is required.');
        setSubEvents(subEvents.filter(ev => ev.id !== id));
    };

    const updateEventField = (index, field, value) => {
        const list = [...subEvents];
        list[index][field] = value;
        setSubEvents(list);
    };

    const openDatePicker = (index) => {
        setActiveDtIndex(index);
        setDateModalVisible(true);
    };

    const confirmDate = (day) => {
        const d = new Date(subEvents[activeDtIndex].date);
        d.setFullYear(day.year, day.month - 1, day.day);
        updateEventField(activeDtIndex, 'date', d);
        setDateModalVisible(false);
    };

    const openTimePicker = (index) => {
        setActiveDtIndex(index);
        const d = new Date(subEvents[index].date);
        let h = d.getHours();
        setTempAmPm(h >= 12 ? 'PM' : 'AM');
        h = h % 12 || 12;
        setTempHr(h < 10 ? '0'+h : ''+h);
        const m = d.getMinutes();
        setTempMin(m < 10 ? '0'+m : ''+m);
        setTimeModalVisible(true);
    };

    const confirmTime = () => {
        const d = new Date(subEvents[activeDtIndex].date);
        let h = parseInt(tempHr, 10);
        if (tempAmPm === 'PM' && h !== 12) h += 12;
        if (tempAmPm === 'AM' && h === 12) h = 0;
        d.setHours(h, parseInt(tempMin, 10), 0);
        updateEventField(activeDtIndex, 'date', d);
        setTimeModalVisible(false);
    };
    // Menu Picker Actions
    const openMenuPicker = (index) => {
        setActiveEventIndex(index);
        setTempSelectedItems([...subEvents[index].selectedMenuItems]); // Copy current selections to temp
        setSearchQuery('');
        setActiveFilter('All');
        setMenuModalVisible(true);
    };

    const toggleMenuItem = (item) => {
        const exists = tempSelectedItems.some(i => i._id === item._id);
        if (exists) {
            setTempSelectedItems(tempSelectedItems.filter(i => i._id !== item._id));
        } else {
            setTempSelectedItems([...tempSelectedItems, item]);
        }
    };

    const saveMenuSelections = () => {
        updateEventField(activeEventIndex, 'selectedMenuItems', tempSelectedItems);
        setMenuModalVisible(false);
    };

    const filteredMenu = masterMenu.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item.subCategory && item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = activeFilter === 'All' ? true : item.category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    // Final Submission
    const handleSaveOrder = async () => {
        // Validation
        for (let i = 0; i < subEvents.length; i++) {
            const ev = subEvents[i];
            if (!ev.eventName || !ev.guestCount || !ev.location) {
                return Alert.alert('Validation Error', `Please fill all details for ${ev.eventName || `Event ${i+1}`}`);
            }
        }

        setSaving(true);
        try {
            // Clean payload
            const payload = {
                customer: customer._id,
                subEvents: subEvents.map(ev => ({
                    eventName: ev.eventName,
                    date: ev.date instanceof Date ? ev.date.toISOString() : new Date(ev.date).toISOString(),
                    guestCount: Number(ev.guestCount),
                    location: ev.location,
                    selectedMenuItems: ev.selectedMenuItems.map(m => m._id) // Just send array of ObjectIds
                }))
            };

            const urlPath = isEditMode ? `/api/orders/${editOrder._id}` : '/api/orders';
            const data = await fetchApi(urlPath, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            Alert.alert('Success', isEditMode ? 'Order successfully updated.' : 'Order effectively booked.');
            navigation.popToTop(); // Go back to Dashboard / Tabs
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    };


    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <SafeAreaView style={{flex: 1}}>
                <View style={styles.bookingHeader}>
                    <Text style={styles.headerClient}>{isEditMode ? 'Editing Protocol for' : 'Booking for'} <Text style={{fontWeight: 'bold', color: '#111827'}}>{customer.name}</Text></Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 16, paddingBottom: 100}}>
                    
                    {subEvents.map((ev, index) => {
                        const isExpanded = expandedEventId === ev.id;
                        
                        return (
                            <View key={ev.id} style={[styles.accordionItem, isExpanded && styles.accordionExpanded]}>
                                {/* Accordion Header */}
                                <TouchableOpacity 
                                    style={styles.accordionHeader} 
                                    onPress={() => setExpandedEventId(isExpanded ? null : ev.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={styles.bullet} />
                                        <Text style={styles.accordionTitle}>{ev.eventName || `Event ${index + 1}`}</Text>
                                    </View>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={styles.summaryDate}>{ev.date instanceof Date ? ev.date.toLocaleDateString([], {month: 'short', day: 'numeric'}) : ev.date}</Text>
                                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" style={{marginLeft: 10}} />
                                    </View>
                                </TouchableOpacity>

                                {/* Accordion Content */}
                                {isExpanded && (
                                    <View style={styles.accordionBody}>
                                        <View style={styles.formRow}>
                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Event Title</Text>
                                                <TextInput style={styles.input} value={ev.eventName} onChangeText={t => updateEventField(index, 'eventName', t)} placeholder="e.g. Wedding Reception" />
                                            </View>
                                            <View style={[styles.formGroup, {marginLeft: 12, flex: 0.8}]}>
                                                <Text style={styles.label}>Expected Guests</Text>
                                                <TextInput style={styles.input} value={ev.guestCount} onChangeText={t => updateEventField(index, 'guestCount', t)} keyboardType="numeric" placeholder="e.g. 500" />
                                            </View>
                                        </View>

                                        <Text style={styles.label}>Location / Venue</Text>
                                        <TextInput style={styles.input} value={ev.location} onChangeText={t => updateEventField(index, 'location', t)} placeholder="Banquet Hall Address" />

                                        <View style={styles.formRow}>
                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Event Date</Text>
                                                <TouchableOpacity style={styles.datePickerBtn} onPress={() => openDatePicker(index)}>
                                                    <Ionicons name="calendar-outline" size={18} color="#2563eb" style={{marginRight: 8}} />
                                                    <Text style={styles.datePickerText}>{new Date(ev.date).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={[styles.formGroup, {marginLeft: 12}]}>
                                                <Text style={styles.label}>Event Time</Text>
                                                <TouchableOpacity style={styles.datePickerBtn} onPress={() => openTimePicker(index)}>
                                                    <Ionicons name="time-outline" size={18} color="#2563eb" style={{marginRight: 8}} />
                                                    <Text style={styles.datePickerText}>{new Date(ev.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {/* Menu Section */}
                                        <View style={styles.menuSectionRoot}>
                                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                                                <Text style={styles.label}>Menu Formulation</Text>
                                                <Text style={styles.menuCountBadge}>{ev.selectedMenuItems.length} items</Text>
                                            </View>
                                            
                                            <TouchableOpacity style={styles.attachMenuBtn} onPress={() => openMenuPicker(index)}>
                                                <Ionicons name="restaurant-outline" size={18} color="#2563eb" />
                                                <Text style={styles.attachMenuText}>Configure Native Master Menu</Text>
                                            </TouchableOpacity>

                                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10}}>
                                                {ev.selectedMenuItems.map(item => (
                                                    <View key={item._id} style={styles.menuChip}>
                                                        <View style={[styles.dot, { backgroundColor: item.category === 'Veg' ? '#22c55e' : '#ef4444' }]} />
                                                        <Text style={styles.menuChipText} numberOfLines={1}>{item.itemName}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Remove Event Button */}
                                        <TouchableOpacity onPress={() => removeSubEvent(ev.id)} style={{marginTop: 20, alignSelf: 'flex-start'}}>
                                            <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Remove this Event block</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <TouchableOpacity style={styles.addEventBtn} onPress={addSubEvent}>
                        <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
                        <Text style={styles.addEventText}>Append Additional Sub-Event</Text>
                    </TouchableOpacity>

                </ScrollView>

                {/* Final Submission Block */}
                <View style={styles.footerSubmit}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveOrder} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditMode ? 'Update Manifest Details' : 'Submit'}</Text>}
                    </TouchableOpacity>
                </View>

                {/* DATE Modal */}
                <Modal visible={dateModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.dtModalOverlay}>
                        <View style={styles.dtModalCard}>
                            <Calendar
                                onDayPress={day => confirmDate(day)}
                                theme={{
                                    todayTextColor: '#2563eb',
                                    selectedDayBackgroundColor: '#2563eb',
                                    arrowColor: '#2563eb',
                                }}
                            />
                            <TouchableOpacity onPress={() => setDateModalVisible(false)} style={[styles.dtModalCancelBtn, {alignSelf: 'center', marginTop: 10}]}>
                                <Text style={{color: '#64748b', fontWeight: 'bold'}}>Close Calendar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* TIME Modal */}
                <Modal visible={timeModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.dtModalOverlay}>
                        <View style={styles.dtModalCard}>
                            <Text style={styles.modalTitle}>Set Exact Timeline</Text>
                            
                            <Text style={styles.label}>Hour</Text>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16}}>
                                {['12','01','02','03','04','05','06','07','08','09','10','11'].map(h => (
                                    <TouchableOpacity key={h} style={[styles.timeChip, tempHr === h && styles.timeChipActive]} onPress={() => setTempHr(h)}>
                                        <Text style={[styles.timeChipText, tempHr === h && styles.timeChipTextActive]}>{h}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Minute</Text>
                            <View style={{flexDirection: 'row', gap: 6, marginBottom: 16}}>
                                {['00','15','30','45'].map(m => (
                                    <TouchableOpacity key={m} style={[styles.timeChip, tempMin === m && styles.timeChipActive]} onPress={() => setTempMin(m)}>
                                        <Text style={[styles.timeChipText, tempMin === m && styles.timeChipTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{flexDirection: 'row', gap: 10, alignSelf: 'center', marginBottom: 20}}>
                                <TouchableOpacity style={[styles.amPmBtn, tempAmPm === 'AM' && styles.amPmBtnActive]} onPress={() => setTempAmPm('AM')}>
                                    <Text style={[styles.amPmText, tempAmPm === 'AM' && styles.amPmTextActive]}>AM</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.amPmBtn, tempAmPm === 'PM' && styles.amPmBtnActive]} onPress={() => setTempAmPm('PM')}>
                                    <Text style={[styles.amPmText, tempAmPm === 'PM' && styles.amPmTextActive]}>PM</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dtModalActions}>
                                <TouchableOpacity onPress={() => setTimeModalVisible(false)} style={styles.dtModalCancelBtn}>
                                    <Text style={{color: '#64748b', fontWeight: 'bold'}}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={confirmTime} style={styles.dtModalConfirmBtn}>
                                    <Text style={{color: '#fff', fontWeight: 'bold'}}>Set Time</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ADVANCED MENU PICKER MODAL */}
                <Modal visible={menuModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <SafeAreaView style={styles.modalRoot}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setMenuModalVisible(false)}><Text style={{color: '#64748b', fontSize: 16}}>Cancel</Text></TouchableOpacity>
                            <Text style={styles.modalTitle}>Menu Library</Text>
                            <TouchableOpacity onPress={saveMenuSelections}><Text style={{color: '#2563eb', fontSize: 16, fontWeight: 'bold'}}>Confirm</Text></TouchableOpacity>
                        </View>

                        <View style={styles.modalSearchArea}>
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={20} color="#94a3b8" />
                                <TextInput style={styles.searchInput} placeholder="Search dishes, curries, breads..." value={searchQuery} onChangeText={setSearchQuery} />
                                {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#94a3b8" /></TouchableOpacity>}
                            </View>
                            
                            <View style={styles.filterBtns}>
                                {['All', 'Veg', 'Non-Veg'].map(f => (
                                    <TouchableOpacity key={f} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]} onPress={() => setActiveFilter(f)}>
                                        <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {loadingMenu ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 50}} />
                        ) : (
                            <ScrollView style={{flex: 1, backgroundColor: '#f8fafc', padding: 16}}>
                                {filteredMenu.map(item => {
                                    const isSelected = tempSelectedItems.some(i => i._id === item._id);
                                    return (
                                        <TouchableOpacity 
                                            key={item._id} 
                                            style={[styles.libraryItem, isSelected && styles.libraryItemSelected]}
                                            onPress={() => toggleMenuItem(item)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                 <View style={[styles.squareMark, { borderColor: item.category === 'Veg' ? '#22c55e' : '#ef4444' }]}>
                                                    <View style={[styles.squareInner, { backgroundColor: item.category === 'Veg' ? '#22c55e' : '#ef4444' }]} />
                                                 </View>
                                                 <View style={{marginLeft: 12}}>
                                                     <Text style={styles.libraryItemName}>{item.itemName}</Text>
                                                     <Text style={styles.libraryItemSub}>{item.subCategory}</Text>
                                                 </View>
                                            </View>
                                            
                                            {isSelected ? (
                                                <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                                            ) : (
                                                <Ionicons name="ellipse-outline" size={24} color="#cbd5e1" />
                                            )}
                                        </TouchableOpacity>
                                    )
                                })}
                                <View style={{height: 50}} />
                            </ScrollView>
                        )}
                        
                        <View style={{padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0'}}>
                             <Text style={{fontWeight: 'bold', color: '#1e293b'}}>{tempSelectedItems.length} specific items allocated for this event.</Text>
                        </View>
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    bookingHeader: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerClient: { fontSize: 16, color: '#64748b' },
    accordionItem: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
    accordionExpanded: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderColor: '#cbd5e1' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc' },
    bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb', marginRight: 10 },
    accordionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    summaryDate: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    accordionBody: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    formRow: { flexDirection: 'row', justifyContent: 'space-between' },
    formGroup: { flex: 1, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b', marginBottom: 16 },
    datePickerBtn: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 14, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
    datePickerText: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
    dtModalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 20 },
    dtModalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    dtModalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 },
    dtModalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
    dtModalConfirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#2563eb' },
    timeChip: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', width: 44, alignItems: 'center' },
    timeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    timeChipText: { color: '#475569', fontWeight: '600' },
    timeChipTextActive: { color: '#fff' },
    amPmBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0' },
    amPmBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    amPmText: { fontWeight: 'bold', color: '#64748b' },
    amPmTextActive: { color: '#2563eb' },
    menuSectionRoot: { marginTop: 10, padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    menuCountBadge: { backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    attachMenuBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', borderRadius: 8 },
    attachMenuText: { color: '#2563eb', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
    menuChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    menuChipText: { fontSize: 12, fontWeight: '600', color: '#334155', maxWidth: 120 },
    addEventBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', marginTop: 10 },
    addEventText: { color: '#64748b', fontWeight: 'bold', marginLeft: 8 },
    footerSubmit: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
    submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    
    // Modal Styles
    modalRoot: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    modalSearchArea: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1e293b' },
    filterBtns: { flexDirection: 'row', gap: 10 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    filterBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
    filterBtnText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
    filterBtnTextActive: { color: '#fff' },
    libraryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    libraryItemSelected: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
    squareMark: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
    squareInner: { width: 6, height: 6, borderRadius: 1 },
    libraryItemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    libraryItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 }
});
