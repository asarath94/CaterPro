import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Warning: ...']); // Ignore pure noise warnings if any surface 

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
