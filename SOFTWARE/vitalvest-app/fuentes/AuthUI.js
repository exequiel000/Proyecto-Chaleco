import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from './skin';
import { Feather } from './Icon';
import { C } from './AppContext';

export function AuthCard({ subtitle, children }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.wrap}>
      <View style={z.card}>
        <View style={z.logo}><Feather name="activity" size={34} color="#fff" /></View>
        <Text style={z.brand}>VitalVest</Text>
        <Text style={z.sub}>{subtitle}</Text>
        <View style={{ alignSelf: 'stretch', gap: 14, marginTop: 26 }}>{children}</View>
      </View>
    </ScrollView>
  );
}

export function Field({ icon, ...p }) {
  return (
    <View style={z.field}>
      <Feather name={icon} size={18} color={C.cyan} />
      <TextInput {...p} placeholderTextColor="#5F7392" autoCapitalize="none" style={z.input} />
    </View>
  );
}

export function Button({ label, onPress, busy, ghost }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={busy} style={[z.btn, ghost ? z.ghost : { backgroundColor: '#0AA5E8' }]}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={[z.btnText, ghost && { color: '#FFFFFF' }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

export const ErrorText = ({ children }) => (children ? <Text style={z.err}>{children}</Text> : null);
export const LinkText = ({ children, onPress }) => (
  <TouchableOpacity onPress={onPress}><Text style={z.link}>{children}</Text></TouchableOpacity>
);

const z = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 440, alignItems: 'center', padding: 28, borderRadius: 24,
    backgroundColor: '#111A2E', borderWidth: 1, borderColor: C.border },
  logo: { width: 76, height: 76, borderRadius: 20, backgroundColor: '#0AA5E8', alignItems: 'center', justifyContent: 'center' },
  brand: { color: C.cyan, fontSize: 30, fontWeight: '800', marginTop: 16 },
  sub: { color: C.muted, fontSize: 14, marginTop: 2, textAlign: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: '#1B2B45', borderWidth: 1, borderColor: '#2A3F5F' },
  input: { flex: 1, color: C.text, paddingVertical: 16, fontSize: 15, outlineStyle: 'none' },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ghost: { backgroundColor: '#1B2436', borderWidth: 1, borderColor: '#2A3550' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  err: { color: C.red, fontSize: 13, textAlign: 'center' },
  link: { color: C.cyan, fontSize: 13, textAlign: 'center' },
});
