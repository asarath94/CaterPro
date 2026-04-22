import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../config/api';

export default function ProfileScreen({ navigation }) {
    const { token, admin, hydrateAdminProfile } = useAuth();
    
    // Map existing properties safely
    const [businessName, setBusinessName] = useState(admin?.businessName || '');
    const [proprietorName, setProprietorName] = useState(admin?.proprietorName || '');
    const [address, setAddress] = useState(admin?.address || '');
    const [email, setEmail] = useState(admin?.email || '');
    
    // Convert arrays into comma-separated strings for simplified mobile editing
    const [phones, setPhones] = useState((admin?.phones || []).join(', '));
    const [contactEmails, setContactEmails] = useState((admin?.contactEmails || []).join(', '));
    
    // Camera state for Business Logo
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [photoUri, setPhotoUri] = useState(admin?.businessLogo || null);
    const cameraRef = useRef(null);

    const [saving, setSaving] = useState(false);

    const checkCameraPermission = async () => {
        let perm = permission;
        if (!perm || !perm.granted) {
            perm = await requestPermission();
        }
        if (perm && perm.granted) {
            setIsCameraActive(true);
        } else {
            Alert.alert('Permission needed', 'Camera access is required to take photos');
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.5,
                skipProcessing: true
            });
            setPhotoUri(photo.uri);
            setIsCameraActive(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('businessName', businessName);
            formData.append('proprietorName', proprietorName);
            formData.append('address', address);
            formData.append('email', email);
            
            // Re-convert comma strings back to array payload
            formData.append('phones', JSON.stringify(phones.split(',').map(p => p.trim()).filter(Boolean)));
            formData.append('contactEmails', JSON.stringify(contactEmails.split(',').map(e => e.trim()).filter(Boolean)));

            if (photoUri && !photoUri.startsWith('http')) {
                let localUri = photoUri;
                let filename = localUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;
                formData.append('businessLogo', { uri: localUri, name: filename, type });
            }

            const url = `${process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000'}/api/auth/profile`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to update profile');
            
            await hydrateAdminProfile(token); // Update memory
            Alert.alert('Success', 'Business Profile updated natively.');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    if (isCameraActive) {
        return (
            <View style={{ flex: 1 }}>
                <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
                    <View style={styles.cameraOverlay}>
                        <TouchableOpacity style={styles.cameraClose} onPress={() => setIsCameraActive(false)}>
                            <Text style={styles.cameraCloseText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                
                <View style={styles.photoSection}>
                    <Text style={styles.sectionHeader}>Business Brand</Text>
                    <View style={styles.photoRow}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri.replace('http:', 'https:') }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Text style={styles.placeholderText}>No Logo</Text>
                            </View>
                        )}
                        <View style={styles.photoActions}>
                            <TouchableOpacity style={styles.photoButton} onPress={checkCameraPermission}>
                                <Text style={styles.photoButtonText}>{photoUri ? 'Retake Logo' : 'Capture Logo Native'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>Business Details</Text>
                    <TextInput style={styles.input} placeholder="Business Name" value={businessName} onChangeText={setBusinessName} />
                    <TextInput style={styles.input} placeholder="Proprietor / Owner Name" value={proprietorName} onChangeText={setProprietorName} />
                    <TextInput style={styles.input} placeholder="Business Physical Address" value={address} onChangeText={setAddress} multiline />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>Contact Information</Text>
                    <Text style={styles.subLabel}>Mobile Numbers (comma separated)</Text>
                    <TextInput style={styles.input} placeholder="e.g. 555-1234, 555-5678" keyboardType="numbers-and-punctuation" value={phones} onChangeText={setPhones} />
                    
                    <Text style={styles.subLabel}>Contact Emails (comma separated)</Text>
                    <TextInput style={styles.input} placeholder="e.g. hello@business.com" keyboardType="email-address" value={contactEmails} onChangeText={setContactEmails} autoCapitalize="none" />
                    
                    <Text style={styles.subLabel}>Admin Login Email (Used for login)</Text>
                    <TextInput style={styles.input} placeholder="Admin Account Email" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
                    <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Save Profile Dynamics'}</Text>
                </TouchableOpacity>

                <View style={{height: 60}} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
    sectionHeader: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    photoSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 20 },
    photoRow: { flexDirection: 'row', alignItems: 'center' },
    previewImage: { width: 80, height: 80, borderRadius: 10, marginRight: 20 },
    placeholderContainer: { width: 80, height: 80, backgroundColor: '#f1f5f9', borderRadius: 10, marginRight: 20, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 12, color: '#9ca3af' },
    photoActions: { flex: 1 },
    photoButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
    photoButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 20 },
    subLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15, color: '#1e293b' },
    submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
    captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
    cameraClose: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 },
    cameraCloseText: { color: '#fff', fontWeight: '600' }
});
