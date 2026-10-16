import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onUser, signOutUser, updateName as dbUpdateName, removeAccount } from './db';
import { tr, resolveLang } from './dict';

// Colores tomados de las capturas. Si tu colors.js ya los tiene, reemplaza este objeto por tu import.
export const C = { bg: '#050B18', card: '#141B2D', border: '#232C42', text: '#FFFFFF', muted: '#7C8AA5',
  cyan: '#22D3EE', green: '#10E070', red: '#FF5A6A', orange: '#FF8A1F', blue: '#1E6BFF' };
export const card = { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 };

// Umbrales del firmware: <20 buena, 20-30 advertencia, >30 mala
export const stateOf = (a) => (a < 20 ? 'good' : a <= 30 ? 'warn' : 'bad');
export const stateColor = { good: C.green, warn: C.orange, bad: C.red };
export const stateLabel = { good: 'Good Posture', warn: 'Warning', bad: 'Poor Posture' };
export const notify = (m) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('VitalVest', m));

// El ESP32 debe notificar texto CSV: "angulo,pitch,roll,bpm,temp,bateria"  (ej. "16.2,12.9,-3.1,72,36.4,87")
const SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb'; // cambia por el UUID de tu firmware
const CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';
const CFG_CHAR = '0000ffe2-0000-1000-8000-00805f9b34fb'; // canal de comandos hacia el ESP32 (opcional)
const SIM_WHEN_DISCONNECTED = true; // pon false cuando uses el chaleco real

const DAY = 86400000;
const seedEvents = () => { // datos de ejemplo del diseño; borra esto cuando tengas datos reales
  const n = Date.now();
  const e = (id, type, title, desc, ago, angle, bpm, temp) => ({ id, type, title, desc, ts: n - ago, angle, bpm, temp });
  return [
    e(1, 'alert', 'Poor Posture Detected', 'Spine angle exceeded 35° for 10 minutes', 3600000, 38, 75),
    e(2, 'check', 'Health Check', 'All metrics within normal range', 7200000, 15, 72, 36.6),
    e(3, 'good', 'Posture Improved', 'Maintained good posture for 2 hours', 10800000, 12, 68),
    e(4, 'alert', 'Elevated Heart Rate', 'Heart rate reached 95 BPM', DAY + 3600000, null, 95, 36.8),
    e(5, 'check', 'Health Check', 'All vitals normal', DAY + 7200000, 18, 70, 36.5),
  ];
};

const DEFAULTS = { notifications: true, darkMode: true, fontSize: 'medium', language: 'System',
  highContrast: false, voice: false, performance: 'High', simulate: true };
const PERF = { Low: 2000, Medium: 1000, High: 500 }; // ms entre actualizaciones de pantalla
const ALERT_MSG = {
  English: { bad: 'Poor posture detected. Sit up straight.', test: 'Alerts are on.' },
  'Español': { bad: 'Mala postura detectada. Endereza la espalda.', test: 'Las alertas están activadas.' },
  'Português': { bad: 'Má postura detectada. Endireite as costas.', test: 'Os alertas estão ativados.' },
  'Français': { bad: 'Mauvaise posture détectée. Redressez le dos.', test: 'Les alertes sont activées.' },
};
const VOICE = { English: 'en-US', 'Español': 'es-AR', 'Português': 'pt-BR', 'Français': 'fr-FR' };
const ZERO = { n: 0, sum: 0, good: 0, alerts: 0, t0: null };
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULTS);
  const [data, setData] = useState({ angle: 0, pitch: 0, roll: 0, bpm: 0, temp: 0, battery: 100 });
  const [series, setSeries] = useState([]);
  const [events, setEvents] = useState(seedEvents);
  const [stats, setStats] = useState(ZERO);
  const [mode, setMode] = useState('sim'); // sim | ble | off
  const [device, setDevice] = useState(null);
  const last = useRef('good');
  const [banner, setBanner] = useState(null);
  const sref = useRef(DEFAULTS), lastBle = useRef(0), devRef = useRef(null), cfgRef = useRef(null);
  sref.current = settings;

  useEffect(() => {
    AsyncStorage.getItem('vv_settings').then((v) => {
      if (!v) return;
      const p = JSON.parse(v);
      if (!p.langSet) delete p.language; // si nunca eligió idioma, se usa el del sistema
      setSettings((x) => ({ ...x, ...p }));
    }).catch(() => {});
    AsyncStorage.getItem('vv_events').then((v) => v && setEvents(JSON.parse(v))).catch(() => {});
    const unsub = onUser((u) => { setUser(u); setReady(true); }); // Firebase mantiene la sesion iniciada
    const tm = setTimeout(() => setReady(true), 3000); // si Firebase tarda, igual mostramos la app
    return () => { unsub(); clearTimeout(tm); };
  }, []);

  useEffect(() => { AsyncStorage.setItem('vv_events', JSON.stringify(events.slice(0, 200))).catch(() => {}); }, [events]);
  useEffect(() => { if (!banner) return; const id = setTimeout(() => setBanner(null), 5000); return () => clearTimeout(id); }, [banner]);

  // La sesion la gestiona Firebase (onUser); login() solo adelanta el estado en pantalla
  const login = async (u) => { if (u) setUser(u); };
  const logout = () => signOutUser();
  const setSetting = (k, v) => setSettings((s) => {
    const n = { ...s, [k]: v, ...(k === 'language' ? { langSet: true } : {}) };
    AsyncStorage.setItem('vv_settings', JSON.stringify(n)).catch(() => {});
    return n;
  });

  // Avisos al usuario: banner en pantalla + vibración + notificación del navegador + voz
  const fire = useCallback((kind, over = {}) => {
    const s = { ...sref.current, ...over }, m = (ALERT_MSG[resolveLang(s.language)] || ALERT_MSG.English)[kind];
    if (s.notifications) {
      setBanner({ msg: m, id: Date.now() });
      try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
      try { if (Notification.permission === 'granted') new Notification('VitalVest', { body: m }); } catch (e) {}
    }
    try {
      if (s.voice) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(m);
        u.lang = VOICE[resolveLang(s.language)] || 'en-US';
        speechSynthesis.speak(u);
      }
    } catch (e) {}
  }, []);

  // Entrada única de datos: la usan el simulador y el BLE
  const push = useCallback((d) => {
    const st = stateOf(d.angle), prev = last.current;
    last.current = st;
    setData(d);
    setSeries((s) => [...s.slice(-59), d.angle]);
    setStats((s) => ({ t0: s.t0 || Date.now(), n: s.n + 1, sum: s.sum + d.angle, good: s.good + (st === 'good' ? 1 : 0),
      alerts: s.alerts + (st === 'bad' && prev !== 'bad' ? 1 : 0) }));
    const ev = (type, title, desc) => setEvents((e) => [{ id: Date.now(), type, title, desc, ts: Date.now(),
      angle: Math.round(d.angle), bpm: Math.round(d.bpm), temp: d.temp }, ...e]);
    if (st === 'bad' && prev !== 'bad') { ev('alert', 'Poor Posture Detected', 'Spine angle exceeded 30°'); fire('bad'); }
    if (st === 'good' && prev === 'bad') ev('good', 'Posture Improved', 'Back to a good posture');
  }, []);

  useEffect(() => {
    if (mode !== 'sim') return;
    let a = 12, b = 100;
    const id = setInterval(() => {
      a = Math.min(40, Math.max(3, a + (Math.random() - 0.5) * 7));
      b = Math.max(5, b - 0.01);
      push({ angle: a, pitch: a * 0.8, roll: (Math.random() - 0.5) * 8, bpm: 72 + (Math.random() - 0.5) * 6,
        temp: 36.4 + (Math.random() - 0.5) * 0.2, battery: b });
    }, PERF[settings.performance] || 1000);
    return () => clearInterval(id);
  }, [mode, push, settings.performance]);

  // Web Bluetooth: solo Chrome/Edge, https o localhost, y llamado desde un clic
  const connect = async () => {
    if (Platform.OS !== 'web' || !navigator.bluetooth)
      throw new Error('Bluetooth is not available in this browser. Use Chrome or Edge over HTTPS.');
    const dev = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'VitalVest' }], optionalServices: [SERVICE] });
    dev.addEventListener('gattserverdisconnected', () => { setDevice(null); setMode(sref.current.simulate ? 'sim' : 'off'); devRef.current = null; cfgRef.current = null; });
    const srv = await dev.gatt.connect();
    devRef.current = dev;
    const service = await srv.getPrimaryService(SERVICE);
    const ch = await service.getCharacteristic(CHAR);
    try { cfgRef.current = await service.getCharacteristic(CFG_CHAR); } catch (e) { cfgRef.current = null; } // si el firmware no lo tiene, sigue funcionando
    await ch.startNotifications();
    ch.addEventListener('characteristicvaluechanged', (e) => {
      const [angle, pitch, roll, bpm, temp, battery] = new TextDecoder().decode(e.target.value).split(',').map(Number);
      const now = Date.now();
      if (now - lastBle.current < (PERF[sref.current.performance] || 1000)) return; // respeta el ajuste Performance
      lastBle.current = now;
      if ([angle, pitch, roll, bpm, temp, battery].every(Number.isFinite)) push({ angle, pitch, roll, bpm, temp, battery });
    });
    setMode('ble');
    setDevice(dev.name || 'VitalVest');
  };

  useEffect(() => { if (mode !== 'ble') setMode(settings.simulate ? 'sim' : 'off'); }, [settings.simulate]);
  // Comandos al ESP32 por BLE: RATE,<ms> (velocidad de envío)  CAL (recalibrar)  TEST (probar alerta)
  const sendCmd = async (text) => {
    if (!cfgRef.current) return false;
    try { await cfgRef.current.writeValue(new TextEncoder().encode(text)); return true; } catch (e) { return false; }
  };
  useEffect(() => { if (mode === 'ble') sendCmd('RATE,' + (PERF[settings.performance] || 1000)); }, [mode, settings.performance]);
  const disconnect = () => { try { devRef.current && devRef.current.gatt.disconnect(); } catch (e) {} };
  const lang = resolveLang(settings.language); // idioma en uso (elegido o del sistema)
  const askNotif = async () => { try { return await Notification.requestPermission(); } catch (e) { return 'unsupported'; } };
  const updateName = async (n) => { await dbUpdateName(n); setUser((u) => ({ ...u, name: n.trim() })); };
  const clearHistory = () => { setEvents([]); setStats(ZERO); setSeries([]); };
  const deleteAccount = async () => { await removeAccount(); setUser(null); };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ user, settings, events, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vitalvest-data.json'; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <Ctx.Provider value={{ ready, user, login, logout, settings, setSetting, data, series, events, stats,
      mode, device, connect, banner, fire, disconnect, sendCmd, askNotif, updateName, clearHistory, deleteAccount, exportData, lang, t: (s) => tr(lang, s) }}>
      {children}
    </Ctx.Provider>
  );
}
