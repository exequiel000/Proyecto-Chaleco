import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from './skin';
import { Feather } from './Icon';
import { askAI } from './ai';
import { useApp, C, card, stateOf } from './AppContext';

const LANG_NAME = { English: 'English', 'Español': 'Spanish', 'Português': 'Portuguese', 'Français': 'French' };

export default function AIScreen() {
  const { data, stats, events, lang, t } = useApp();
  const [q, setQ] = useState(''), [out, setOut] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);

  // Solo se envía un resumen numérico de la sesión (sin nombre ni correo)
  const summary = () => ({
    sessionMinutes: stats.t0 ? Math.round((Date.now() - stats.t0) / 60000) : 0,
    averageAngleDeg: stats.n ? Math.round(stats.sum / stats.n) : null,
    goodPosturePercent: stats.n ? Math.round((100 * stats.good) / stats.n) : null,
    poorPostureAlerts: stats.alerts,
    currentAngleDeg: Math.round(data.angle), currentState: stateOf(data.angle),
    heartRateBpm: Math.round(data.bpm), temperatureC: Number(Number(data.temp).toFixed(1)),
    recentEvents: events.slice(0, 5).map((e) => e.title + (e.angle != null ? ` (${e.angle} deg)` : '')),
  });
  const SYSTEM = `You are the posture coach inside VitalVest, a smart vest that measures spine angle (under 20 deg good, 20-30 warning, over 30 poor), heart rate and temperature. Reply in ${LANG_NAME[lang] || 'English'}. Be concise: at most 5 short bullet points or 120 words, with practical and specific advice. You are not a doctor: never diagnose, and if the user mentions pain or alarming vital signs, recommend seeing a professional.`;

  const run = async (question) => {
    if (stats.n < 5) { setErr(t('Not enough data yet. Keep the vest on for a minute and try again.')); return; }
    setBusy(true); setErr(''); setOut('');
    try {
      setOut((await askAI(`Session summary (JSON): ${JSON.stringify(summary())}\n\n${question}`, SYSTEM)).replace(/\*\*/g, '').trim());
    } catch (e) {
      setErr(`${t('AI is not available right now. Check that AI Logic is enabled in Firebase and App Check is set up.')}\n${String((e && e.message) || e).slice(0, 700)}`);
    }
    setBusy(false);
  };
  const ask = () => { if (q.trim()) run(q.trim()); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.page}>
      <View>
        <Text style={z.h1}>Posture Coach</Text>
        <Text style={z.sub}>Get tips based on your current session</Text>
      </View>

      <View style={[card, z.row, { backgroundColor: '#0B2238', borderColor: '#164B66' }]}>
        <Feather name="shield" size={14} color={C.cyan} />
        <Text style={z.note}>  Only a summary of your session is sent (no name or email), and only when you tap a button.</Text>
      </View>

      <TouchableOpacity style={z.primary} onPress={() => run('Analyze my session and give me personalized tips.')} disabled={busy}>
        <Feather name="cpu" size={16} color="#fff" />
        <Text style={z.primaryText}>  Analyze my session</Text>
      </TouchableOpacity>

      <View style={card}>
        <Text style={z.h2}>Ask a question</Text>
        <View style={z.askRow}>
          <TextInput value={q} onChangeText={setQ} placeholder="Ask about posture..." placeholderTextColor="#5F7392" style={z.input} onSubmitEditing={ask} />
          <TouchableOpacity style={z.send} onPress={ask} disabled={busy}><Text style={z.primaryText}>Ask</Text></TouchableOpacity>
        </View>
      </View>

      {busy && (
        <View style={[card, z.row]}>
          <ActivityIndicator color={C.cyan} />
          <Text style={z.sub}>  Thinking...</Text>
        </View>
      )}
      {!!err && <Text style={{ color: C.red, fontSize: 12 }}>{err}</Text>}
      {!!out && <View style={[card, { borderColor: '#164B66' }]}><Text style={z.out}>{out}</Text></View>}
      <Text style={[z.sub, { textAlign: 'center' }]}>AI tips are general advice, not medical advice.</Text>
    </ScrollView>
  );
}

const z = StyleSheet.create({
  page: { padding: 20, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h1: { color: C.text, fontSize: 22, fontWeight: '800' }, h2: { color: C.text, fontSize: 15, fontWeight: '700' },
  sub: { color: C.muted, fontSize: 12 }, note: { color: '#B6C4DA', fontSize: 12, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0AA5E8', borderRadius: 14, padding: 15 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  askRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: { flex: 1, color: C.text, borderWidth: 1, borderColor: '#2A3F5F', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#1B2B45' },
  send: { backgroundColor: '#0AA5E8', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  out: { color: C.text, fontSize: 14, lineHeight: 21 },
});
