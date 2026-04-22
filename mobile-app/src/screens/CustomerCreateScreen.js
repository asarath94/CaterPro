import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../config/api';

export default function CustomerCreateScreen({ route, navigation }) {
    const { token } = useAuth();
    
    const customer = route.params?.customer;
    const isEditMode = !!customer;

    const [name, setName] = useState(customer?.name || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [location, setLocation] = useState(customer?.location || '');
    const [email, setEmail] = useState(customer?.email || '');
    
    // Camera state
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [photoUri, setPhotoUri] = useState(customer?.photoURL || null);
    const cameraRef = useRef(null);

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
                quality: 0.5, // Compress dynamically
                skipProcessing: true
            });
            setPhotoUri(photo.uri);
            setIsCameraActive(false);
        }
    };

    const handleUpload = async () => {
        if (!name || !phone) return Alert.alert('Error', 'Name and Phone are required.');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('phone', phone);
            formData.append('location', location);
            if (email) formData.append('email', email);

            if (photoUri && !photoUri.startsWith('http')) {
                // Formatting specific for React Native Multer processing
                let localUri = photoUri;
                let filename = localUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;
                
                formData.append('photo', { uri: localUri, name: filename, type });
            }

            const url = isEditMode
                ? `${process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000'}/api/customers/${customer._id}` 
                : `${process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000'}/api/customers`;
                
            const response = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // No Content-Type header; fetch handles boundaries automatically
            });

            if (!response.ok) throw new Error('Upload failed');
            
            Alert.alert('Success', isEditMode ? 'Customer dynamically updated!' : 'Customer created securely.');
            navigation.navigate('Customers'); // Force re-render on main view
        } catch (err) {
            Alert.alert('Error', err.message);
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
                <Text style={styles.title}>{isEditMode ? 'Edit Profile' : 'New Customer'}</Text>

                <View style={styles.photoSection}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No Photo</Text>
                        </View>
                    )}
                    <View style={styles.photoActions}>
                        <TouchableOpacity style={styles.photoButton} onPress={checkCameraPermission}>
                            <Text style={styles.photoButtonText}>Take Native Photo</Text>
                        </TouchableOpacity>
                        {photoUri && (
                            <TouchableOpacity style={[styles.photoButton, { backgroundColor: '#ef4444' }]} onPress={() => setPhotoUri(null)}>
                                <Text style={styles.photoButtonText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.form}>
                    <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                    <TextInput style={styles.input} placeholder="Email (Optional)" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder="Home Location" value={location} onChangeText={setLocation} />
                    
                    <TouchableOpacity style={styles.submitBtn} onPress={handleUpload}>
                        <Text style={styles.submitBtnText}>{isEditMode ? 'Save Changes' : 'Create Customer'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    photoSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', p: 15, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    previewImage: { width: 80, height: 80, borderRadius: 10, margin: 15 },
    placeholderContainer: { width: 80, height: 80, backgroundColor: '#f3f4f6', borderRadius: 10, margin: 15, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 12, color: '#9ca3af' },
    photoActions: { flex: 1, gap: 10, paddingRight: 15 },
    photoButton: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
    photoButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 14, marginBottom: 15, fontSize: 16 },
    submitBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
    captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
    cameraClose: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 },
    cameraCloseText: { color: '#fff', fontWeight: '600' }
});
