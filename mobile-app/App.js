import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';
import { SWRConfig } from 'swr';

LogBox.ignoreLogs(['Warning: ...']); // Ignore pure noise warnings if any surface

export default function App() {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 60000 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SWRConfig>
  );
}
