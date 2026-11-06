import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface PermissionDeniedProps {
  onOpenSettings: () => void;
}

/** Shown when camera permission is denied: explains why access is needed and offers an "Open Settings" button. */
export function PermissionDenied({ onOpenSettings }: PermissionDeniedProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Camera access is required to track your pose.</Text>
      <Pressable
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel="Open Settings"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
