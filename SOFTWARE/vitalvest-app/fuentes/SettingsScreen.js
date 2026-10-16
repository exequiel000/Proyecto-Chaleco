import React, { useState } from 'react';
import { StyleSheet, Modal, Switch, Platform } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from './skin';
import { Feather } from './Icon';
import { useApp, C, card, notify } from './AppContext';
import { hasPassword, hasGoogle, getPhone, changePassword, startPhoneLink, confirmPhoneLink, unlinkPhone } from './db';
import { LANGS, resolveLang } from './dict';

const next = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
const ask = (m) => (Platform.OS === 'web' ? window.confirm(m) : true);

function Row({ icon, label, value, onPress, toggle, onToggle, last }) {
  const Wrap = toggle !== undefined ? View : TouchableOpacity;
  return (
    <Wrap onPress={onPress} style={[z.row, !last && z.sep]}>
      <View style={z.icon}><Feather name={icon} size={15} color={C.cyan} /></View>
      <Text style={z.label}>{label}</Text>
      {toggle !== undefined ? (
        <Switch value={toggle} onValueChange={onToggle} trackColor={{ true: '#06B6D4', false: '#2A3550' }} thumbColor="#fff" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {value != null && <Text style={z.val}>{value}</Text>}
          <Feather name="chevron-right" size={14} color={C.muted} />
        </View>
      )}
    </Wrap>
  );
}

const Section = ({ title, children }) => (
  <View>
    <Text style={z.section}>{title}</Text>
    <View style={[card, { padding: 0 }]}>{children}</View>
  </View>
);

function Sheet({ title, onClose, children }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={z.overlay}>
        <View style={[card, z.sheet]}>
          <View style={z.between}>
            <Text style={z.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={C.muted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12, paddingTop: 14 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const Btn = ({ label, onPress, danger }) => (
  <TouchableOpacity onPress={onPress} style={[z.btn, danger && z.danger]}>
    <Text style={{ color: danger ? C.red : C.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
  </TouchableOpacity>
);

// Edit -> cambiar el nombre de usuario
function NameSheet({ onClose }) {
  const { user, updateName, t } = useApp();
  const [name, setName] = useState(user?.name || ''), [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) return notify(t('Enter a name.'));
    setBusy(true);
    try { await updateName(name); onClose(); } catch (e) { notify(t(e.message)); setBusy(false); }
  };
  return (
    <Sheet title="Edit username" onClose={onClose}>
      <Text style={z.sub}>Username</Text>
      <TextInput value={name} onChangeText={setName} style={z.input} onSubmitEditing={save} />
      <Btn label={busy ? 'Saving...' : 'Save'} onPress={save} />
    </Sheet>
  );
}

const Info = ({ label, value, onCopy }) => (
  <View style={z.info}>
    <View style={{ flex: 1 }}>
      <Text style={z.sub}>{label}</Text>
      <Text style={z.infoVal}>{value}</Text>
    </View>
    {onCopy && (
      <TouchableOpacity style={z.copy} onPress={onCopy}>
        <Feather name="copy" size={13} color={C.cyan} />
        <Text style={{ color: C.cyan, fontSize: 12 }}>  Copy</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Profile -> correo, teléfono (ver, copiar, vincular por SMS) y contraseña (en Google o en la app)
function ProfileSheet({ onClose }) {
  const { user, t } = useApp();
  const [cur, setCur] = useState(''), [nw, setNw] = useState('');
  const [num, setNum] = useState(''), [code, setCode] = useState('');
  const [step, setStep] = useState('view'), [conf, setConf] = useState(null); // view | enter | code
  const [busy, setBusy] = useState(false), [note, setNote] = useState(null);
  const [, bump] = useState(0);
  const phone = getPhone(), pw = hasPassword(), g = hasGoogle();
  const ok = (text) => setNote({ ok: true, text }), bad = (text) => setNote({ ok: false, text });
  const work = async (fn) => { setBusy(true); setNote(null); try { await fn(); } catch (e) { bad(e.message); } setBusy(false); };

  const copy = async (v) => {
    try { await navigator.clipboard.writeText(v); }
    catch (e) {
      try { const a = document.createElement('textarea'); a.value = v; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); }
      catch (e2) { return; }
    }
    ok('Copied.');
  };
  const change = () => {
    if (nw.length < 6) return bad('Password must have at least 6 characters.');
    work(async () => { await changePassword(cur, nw); setCur(''); setNw(''); ok('Password updated.'); });
  };
  const sendCode = () => {
    if (num.replace(/\D/g, '').length < 8) return bad('Enter the number with country code, e.g. +54 9 11 1234 5678.');
    work(async () => { setConf(await startPhoneLink(num)); setStep('code'); });
  };
  const verify = () => work(async () => { await confirmPhoneLink(conf, code); setStep('view'); setNum(''); setCode(''); ok('Phone linked.'); bump((n) => n + 1); });
  const removePhone = () => work(async () => { await unlinkPhone(); ok('Phone removed.'); bump((n) => n + 1); });

  return (
    <Sheet title="Profile" onClose={onClose}>
      <Info label="Email" value={user?.email} onCopy={() => copy(user?.email)} />
      <Info label="Phone number" value={phone || t('Not linked')} onCopy={phone ? () => copy(phone) : null} />

      {phone && step === 'view' && <Btn danger label="Remove phone number" onPress={removePhone} />}
      {!phone && step === 'view' && <Btn label="Add phone number" onPress={() => { setNote(null); setStep('enter'); }} />}
      {!phone && step === 'enter' && (
        <>
          <TextInput value={num} onChangeText={setNum} keyboardType="phone-pad" placeholder="+54 9 11 1234 5678" placeholderTextColor="#5F7392" style={z.input} />
          <Text style={z.policy}>Google may store this number to prevent abuse. Message and data rates may apply.</Text>
          <Btn label={busy ? 'Saving...' : 'Send code'} onPress={sendCode} />
        </>
      )}
      {!phone && step === 'code' && (
        <>
          <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="SMS code" placeholderTextColor="#5F7392" style={z.input} onSubmitEditing={verify} />
          <Btn label={busy ? 'Saving...' : 'Verify'} onPress={verify} />
        </>
      )}

      <Text style={[z.section, { marginTop: 6, marginBottom: 0 }]}>{t('Change password').toUpperCase()}</Text>
      {g && (
        <>
          <Text style={z.policy}>Your Google password is managed by Google.</Text>
          <Btn label="Change password in Google" onPress={() => window.open('https://myaccount.google.com/signinoptions/password', '_blank', 'noopener')} />
        </>
      )}
      {pw && (
        <>
          <TextInput value={cur} onChangeText={setCur} secureTextEntry placeholder="Current password" placeholderTextColor="#5F7392" style={z.input} />
          <TextInput value={nw} onChangeText={setNw} secureTextEntry placeholder="New password" placeholderTextColor="#5F7392" style={z.input} onSubmitEditing={change} />
          <Btn label={busy ? 'Saving...' : 'Update password'} onPress={change} />
        </>
      )}
      {note && <Text style={{ color: note.ok ? C.green : C.red, fontSize: 13 }}>{note.text}</Text>}
    </Sheet>
  );
}

const POLICY = [
  'VitalVest measures your posture angle, heart rate, temperature and battery level using your vest.',
  'Your account (name and email) is managed by Firebase Authentication, a Google service.',
  'Your readings and event history are stored only on this device. They are not sent to any server.',
  'You can export or delete your data at any time from Data & Permissions.',
  'VitalVest is not a medical device and does not replace professional advice.',
];

function DataSheet({ onClose }) {
  const { askNotif, exportData, clearHistory, deleteAccount, t } = useApp();
  const [, bump] = useState(0);
  const nS = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  const bS = typeof navigator !== 'undefined' && navigator.bluetooth ? 'available' : 'unsupported';
  const vS = typeof speechSynthesis !== 'undefined' ? 'available' : 'unsupported';
  const line = (k, v) => (<View key={k} style={z.between}><Text style={z.label}>{k}</Text><Text style={z.val}>{v}</Text></View>);
  const del = async () => {
    if (!ask(t('Delete your account permanently? This cannot be undone.'))) return;
    try { await deleteAccount(); } catch (e) { notify(t(e.message)); }
  };
  return (
    <Sheet title="Data & Permissions" onClose={onClose}>
      {line('Notifications', nS)}
      {line('Bluetooth', bS)}
      {line('Voice', vS)}
      <Btn label="Allow notifications" onPress={async () => { await askNotif(); bump((n) => n + 1); }} />
      <Btn label="Export my data" onPress={exportData} />
      <Btn label="Clear history" onPress={() => { if (ask(t('Clear your event history?'))) { clearHistory(); notify(t('History cleared.')); } }} />
      <Btn danger label="Delete account" onPress={del} />
    </Sheet>
  );
}

// Dispositivos: estado de la conexión Bluetooth con el chaleco, conectar / desconectar y datos simulados
function DeviceSheet({ onClose }) {
  const { mode, device, connect, disconnect, sendCmd, t, settings: s, setSetting } = useApp();
  const [busy, setBusy] = useState(false), [note, setNote] = useState(null);
  const supported = typeof navigator !== 'undefined' && !!navigator.bluetooth;
  const status = mode === 'ble' ? 'Connected' : mode === 'sim' ? 'Simulated' : 'Disconnected';
  const col = mode === 'ble' ? C.green : mode === 'sim' ? C.orange : C.muted;
  const go = async () => {
    setBusy(true); setNote(null);
    try { await connect(); } catch (e) { if (e && e.name !== 'NotFoundError') setNote({ ok: false, text: e.message }); }
    setBusy(false);
  };
  const cmd = async (c) => {
    const ok = await sendCmd(c);
    setNote({ ok, text: t(ok ? 'Command sent.' : 'This vest does not accept commands yet. Update the firmware with the example sketch.') });
  };
  return (
    <Sheet title="Devices" onClose={onClose}>
      <View style={[z.info, { borderColor: col }]}>
        <View style={{ flex: 1 }}>
          <Text style={z.sub}>Status</Text>
          <Text style={[z.infoVal, { color: col }]}>{status}</Text>
          {!!device && <Text style={z.sub}>{device}</Text>}
        </View>
        <Feather name="bluetooth" size={20} color={col} />
      </View>
      {mode === 'ble'
        ? <Btn danger label="Disconnect" onPress={disconnect} />
        : <Btn label={busy ? 'Looking for "VitalVest"...' : 'Connect device'} onPress={go} />}
      {!supported && <Text style={{ color: C.red, fontSize: 12 }}>Bluetooth is not available in this browser. Use Chrome or Edge over HTTPS.</Text>}
      {!!note && <Text style={{ color: note.ok ? C.green : C.red, fontSize: 12 }}>{note.text}</Text>}
      <Text style={z.policy}>Make sure the vest is on and visible as "VitalVest".</Text>
      <Text style={[z.section, { marginTop: 6, marginBottom: 0 }]}>{t('Performance').toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['Low', 'Medium', 'High'].map((p) => (
          <TouchableOpacity key={p} style={[z.chip, s.performance === p && z.chipOn]} onPress={() => setSetting('performance', p)}>
            <Text style={{ color: s.performance === p ? C.cyan : C.text, fontWeight: '700', fontSize: 13 }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={z.sub}>Controls how often the vest sends data and the screen updates. Low saves battery.</Text>
      {mode === 'ble' && (
        <>
          <Btn label="Recalibrate posture" onPress={() => cmd('CAL')} />
          <Btn label="Test alert" onPress={() => cmd('TEST')} />
        </>
      )}
      <View style={z.info}>
        <View style={{ flex: 1 }}>
          <Text style={z.label}>Simulated data</Text>
          <Text style={z.sub}>Use simulated data when no vest is connected</Text>
        </View>
        <Switch value={s.simulate} onValueChange={(v) => setSetting('simulate', v)} trackColor={{ true: '#06B6D4', false: '#2A3550' }} thumbColor="#fff" />
      </View>
    </Sheet>
  );
}

export default function SettingsScreen() {
  const { user, logout, settings: s, setSetting, device, mode, fire, askNotif, t } = useApp();
  const [sheet, setSheet] = useState(null);
  const name = user?.name || 'User';
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const close = () => setSheet(null);

  const onConnect = async () => { try { await connect(); } catch (e) { if (e?.name !== 'NotFoundError') notify(e.message); } };
  const onNotif = async (v) => {
    setSetting('notifications', v);
    if (!v) return;
    const p = await askNotif();
    fire('test', { notifications: true });
    if (p === 'denied') notify(t('Browser notifications are blocked. The in-app alert still works.'));
  };
  const onVoice = () => { const v = !s.voice; setSetting('voice', v); if (v) fire('test', { voice: true }); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.page}>
      <View>
        <Text style={z.h1}>Settings</Text>
        <Text style={z.sub}>Manage your app preferences</Text>
      </View>

      <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0B2238', borderColor: '#164B66' }]}>
        <View style={z.avatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '700' }}>{name}</Text>
          <Text style={{ color: C.cyan, fontSize: 12 }}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={z.edit} onPress={() => setSheet('name')}>
          <Text style={{ color: C.text, fontSize: 12 }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Section title="ACCOUNT">
        <Row icon="user" label="Profile" value={user?.email} onPress={() => setSheet('profile')} />
        <Row icon="bell" label="Notifications" toggle={s.notifications} onToggle={onNotif} last />
      </Section>

      <Section title="APPEARANCE">
        <Row icon="moon" label="Dark Mode" toggle={s.darkMode} onToggle={(v) => setSetting('darkMode', v)} />
        <Row icon="type" label="Font Size" value={s.fontSize} onPress={() => setSetting('fontSize', next(['small', 'medium', 'large'], s.fontSize))} />
        <Row icon="globe" label="Language" value={s.language === 'System' ? 'System default' : s.language} onPress={() => setSheet('lang')} last />
      </Section>

      <Section title="ACCESSIBILITY">
        <Row icon="eye" label="High Contrast" value={s.highContrast ? 'On' : 'Off'} onPress={() => setSetting('highContrast', !s.highContrast)} />
        <Row icon="volume-2" label="Voice Feedback" value={s.voice ? 'On' : 'Off'} onPress={onVoice} last />
      </Section>

      <Section title="DEVICE">
        <Row icon="smartphone" label="Connected Device" value={device || (mode === 'sim' ? 'Simulated' : 'Tap to connect')} onPress={() => setSheet('device')} />
        <Row icon="zap" label="Performance" value={s.performance} onPress={() => setSetting('performance', next(['Low', 'Medium', 'High'], s.performance))} last />
      </Section>

      <Section title="PRIVACY & SECURITY">
        <Row icon="shield" label="Privacy Policy" onPress={() => setSheet('privacy')} />
        <Row icon="shield" label="Data & Permissions" onPress={() => setSheet('data')} last />
      </Section>

      <TouchableOpacity onPress={logout} style={z.logout}>
        <Feather name="log-out" size={15} color={C.red} />
        <Text style={{ color: C.red, fontWeight: '700' }}>  Log Out</Text>
      </TouchableOpacity>
      <Text style={[z.sub, { textAlign: 'center' }]}>VitalVest Posture v1.0.0</Text>

      {sheet === 'name' && <NameSheet onClose={close} />}
      {sheet === 'profile' && <ProfileSheet onClose={close} />}
      {sheet === 'lang' && (
        <Sheet title="Choose language" onClose={close}>
          {['System', ...LANGS].map((L) => (
            <TouchableOpacity key={L} style={[z.langRow, L === s.language && z.langOn]} onPress={() => { setSetting('language', L); close(); }}>
              <View>
                <Text style={{ color: C.text, fontWeight: '600' }}>{L === 'System' ? 'System default' : L}</Text>
                {L === 'System' && <Text style={z.sub}>{resolveLang('System')}</Text>}
              </View>
              {L === s.language && <Feather name="check" size={16} color={C.cyan} />}
            </TouchableOpacity>
          ))}
        </Sheet>
      )}
      {sheet === 'privacy' && (
        <Sheet title="Privacy Policy" onClose={close}>
          {POLICY.map((p) => <Text key={p} style={z.policy}>{p}</Text>)}
        </Sheet>
      )}
      {sheet === 'data' && <DataSheet onClose={close} />}
      {sheet === 'device' && <DeviceSheet onClose={close} />}
    </ScrollView>
  );
}

const z = StyleSheet.create({
  page: { padding: 20, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h1: { color: C.text, fontSize: 22, fontWeight: '800' }, h2: { color: C.text, fontSize: 17, fontWeight: '800' },
  sub: { color: C.muted, fontSize: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { color: '#6F86B0', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  sep: { borderBottomWidth: 1, borderBottomColor: C.border },
  icon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#0E2A3D', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: C.text, fontWeight: '600', fontSize: 13 }, val: { color: C.muted, fontSize: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' },
  edit: { backgroundColor: '#1E2A44', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#5B1F2E', backgroundColor: '#25111C' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 460, maxHeight: '85%' },
  input: { color: C.text, borderWidth: 1, borderColor: '#2A3F5F', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#1B2B45' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#2A3F5F', borderRadius: 12, padding: 12, backgroundColor: '#1B2B45' },
  infoVal: { color: C.text, fontSize: 14, fontWeight: '600', marginTop: 2 },
  copy: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#164B66', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btn: { alignItems: 'center', padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#2A3550', backgroundColor: '#1B2436' },
  danger: { borderColor: '#5B1F2E', backgroundColor: '#25111C' },
  policy: { color: '#B6C4DA', fontSize: 13, lineHeight: 19 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A3550', backgroundColor: '#1B2436' },
  langOn: { borderColor: '#22D3EE' },
  chip: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A3550', backgroundColor: '#1B2436' },
  chipOn: { borderColor: '#22D3EE' },
});
