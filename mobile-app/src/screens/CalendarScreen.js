import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchApi } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen({ navigation }) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Marked dates config for the Calendar library
    const [markedDates, setMarkedDates] = useState({});
    
    // State to hold raw subEvents grouped by the date string (YYYY-MM-DD)
    const [eventsMap, setEventsMap] = useState({});
    
    // Modal state
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadCalendar();
        });
        return unsubscribe;
    }, [navigation]);

    const loadCalendar = async () => {
        try {
            const data = await fetchApi('/api/calendar', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Map data from /api/calendar natively (backend already flattens events)
            const marks = {};
            const evMap = {};

            data.forEach(ev => {
                // Extract localized YYYY-MM-DD using 'start' property which holds the date
                const d = new Date(ev.start);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // Setup visual marker for the specific date
                marks[dateStr] = { 
                    marked: true, 
                    dotColor: '#2563eb', 
                    activeOpacity: 0.7 
                };

                // Store actual data payload inside the Map for fast lookup when day is clicked
                if (!evMap[dateStr]) evMap[dateStr] = [];
                evMap[dateStr].push({
                    date: ev.start, // Map start to date for display
                    eventName: ev.title.split(' - ')[1] || 'Event',
                    orderId: ev.orderId,
                    customerName: ev.customerName,
                    guestCount: ev.guestCount,
                    location: ev.location,
                    _id: ev.id
                });
            });

            setMarkedDates(marks);
            setEventsMap(evMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayPress = (day) => {
        const dateStr = day.dateString;
        if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) {
            setSelectedDate({
                string: dateStr,
                display: new Date(day.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
                events: eventsMap[dateStr]
            });
            setModalVisible(true);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Timeline</Text>
                <Text style={styles.subtitle}>Scheduled sub-events based on confirmed orders.</Text>
            </View>

            <View style={styles.calendarWrapper}>
                <Calendar
                    style={styles.calendar}
                    theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#b6c1cd',
                        selectedDayBackgroundColor: '#2563eb',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#2563eb',
                        dayTextColor: '#2d4150',
                        textDisabledColor: '#d9e1e8',
                        dotColor: '#2563eb',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#2563eb',
                        monthTextColor: '#0f172a',
                        textDayFontWeight: '600',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: 'bold'
                    }}
                    markedDates={markedDates}
                    onDayPress={handleDayPress}
                    enableSwipeMonths={true}
                />
            </View>

            {/* Bottom Modal for Day details */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalDate}>{selectedDate?.display}</Text>
                                <Text style={styles.modalSub}>{selectedDate?.events?.length} Events Scheduled</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.eventList} showsVerticalScrollIndicator={false}>
                            {selectedDate?.events.map((ev, i) => (
                                <TouchableOpacity 
                                    key={`${ev._id}-${i}`} 
                                    style={styles.eventCard}
                                    onPress={() => {
                                        setModalVisible(false);
                                        navigation.navigate('OrderDetail', { orderId: ev.orderId });
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.eventLeft}>
                                        <View style={styles.timeBlock}>
                                            <Text style={styles.timeText}>
                                                {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <Text style={styles.guestText}>{ev.guestCount} G</Text>
                                        </View>
                                    </View>
                                    <View style={styles.eventRight}>
                                        <Text style={styles.evName}>{ev.eventName}</Text>
                                        <Text style={styles.evCustomer}>{ev.customerName}</Text>
                                        <Text style={styles.evLocation} numberOfLines={1}>📍 {ev.location}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 10, paddingBottom: 15 },
    title: { fontSize: 28, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    calendarWrapper: { 
        marginHorizontal: 15, 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        paddingVertical: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 
    },
    calendar: { borderRadius: 16 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalDate: { fontSize: 22, fontWeight: '900', color: '#111827' },
    modalSub: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginTop: 2 },
    closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
    eventList: { marginTop: 10 },
    eventCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    eventLeft: { borderRightWidth: 1, borderRightColor: '#f1f5f9', paddingRight: 15, marginRight: 15, justifyContent: 'center', alignItems: 'center', width: 80 },
    timeText: { fontSize: 14, fontWeight: '800', color: '#2563eb', textAlign: 'center' },
    guestText: { fontSize: 11, fontWeight: 'bold', color: '#f59e0b', marginTop: 4, backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    eventRight: { flex: 1, justifyContent: 'center' },
    evName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    evCustomer: { fontSize: 13, color: '#64748b', marginTop: 2 },
    evLocation: { fontSize: 12, color: '#94a3b8', marginTop: 6 }
});
