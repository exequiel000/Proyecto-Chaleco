import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { View, Text, TouchableOpacity, useSkin } from './skin';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from './Icon';
import { AppProvider, useApp, C } from './AppContext';

// Ajusta estos imports si tus archivos exportan con nombre en vez de "default"
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreens';
import HomeScreen from './HomeScreen';
import AnalysisScreen from './AnalysisScreen';
import HistoryScreen from './HistoryScreen';
import AIScreen from './AIScreen';
import SettingsScreen from './SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ICONS = { Home: 'home', Posture: 'activity', History: 'clock', AI: 'cpu', Settings: 'settings' };

const makeTheme = (map) => ({ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: map(C.bg), card: map('#0A1122'),
  text: map('#FFFFFF'), border: map(C.border), primary: C.cyan } });

const reload = () => { if (Platform.OS === 'web') window.location.reload(); };
const resetAll = () => { // borra sesión y datos locales guardados por si quedó algo corrupto
  try { localStorage.clear(); sessionStorage.clear(); indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch (e) {}
  reload();
};

// Si una pantalla falla, se muestra el motivo en vez de dejar la página en blanco
class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <View style={z.errPage}>
        <Text style={z.errTitle}>Algo salió mal</Text>
        <Text style={z.errMsg}>{String((this.state.err && this.state.err.message) || this.state.err)}</Text>
        <TouchableOpacity style={z.btn} onPress={reload}><Text style={z.btnText}>Recargar</Text></TouchableOpacity>
        <TouchableOpacity style={[z.btn, z.btn2]} onPress={resetAll}><Text style={z.btnText}>Borrar datos locales y recargar</Text></TouchableOpacity>
      </View>
    );
  }
}

function GlobalErrors() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e) => {
      const m = String((e && (e.message || (e.reason && e.reason.message) || e.reason)) || '');
      if (m && !/ResizeObserver/i.test(m)) setMsg(m);
    };
    window.addEventListener('error', h);
    window.addEventListener('unhandledrejection', h);
    return () => { window.removeEventListener('error', h); window.removeEventListener('unhandledrejection', h); };
  }, []);
  if (!msg) return null;
  return (
    <TouchableOpacity onPress={() => setMsg(null)} style={z.bar}>
      <Text style={z.barText}>{msg}   ✕</Text>
    </TouchableOpacity>
  );
}

function Banner() {
  const { banner } = useApp();
  if (!banner) return null;
  return (
    <View style={z.alert}>
      <Feather name="alert-triangle" size={16} color="#fff" />
      <Text style={z.alertText}>  {banner.msg}</Text>
    </View>
  );
}

function Tabs() {
  const { map, t } = useSkin();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarLabel: t(route.name),
      tabBarActiveTintColor: C.cyan,
      tabBarInactiveTintColor: map(C.muted),
      tabBarStyle: { backgroundColor: map('#0A1122'), borderTopColor: map(C.border) },
      tabBarIcon: ({ color, size }) => <Feather name={ICONS[route.name]} size={size} color={color} />,
    })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Posture" component={AnalysisScreen} />
      <Tab.Screen name="AI" component={AIScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, user } = useApp();
  const { map } = useSkin();
  useEffect(() => { if (Platform.OS === 'web') document.body.style.backgroundColor = map(C.bg); });
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <NavigationContainer theme={makeTheme(map)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={Tabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Boundary>
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <Root />
          <Banner />
          <GlobalErrors />
        </View>
      </AppProvider>
    </Boundary>
  );
}

const z = StyleSheet.create({
  errPage: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  errTitle: { color: C.red, fontSize: 22, fontWeight: '800' },
  errMsg: { color: '#B6C4DA', fontSize: 13, textAlign: 'center', maxWidth: 560 },
  btn: { backgroundColor: '#0AA5E8', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  btn2: { backgroundColor: '#25344A' }, btnText: { color: '#fff', fontWeight: '700' },
  alert: { position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#C0263A',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, pointerEvents: 'none' },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#C0263A', padding: 10 },
  barText: { color: '#fff', fontSize: 12, textAlign: 'center' },
});
