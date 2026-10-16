import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from './skin';
import { Feather } from './Icon';
import { useApp, C, card } from './AppContext';

const FILTERS = ['All', 'Today', 'Yesterday', 'Week'];
const META = { alert: { c: C.red, icon: 'alert-circle' }, check: { c: C.cyan, icon: 'activity' }, good: { c: C.green, icon: 'trending-up' } };
const DAY = 86400000;
const LOCALES = { English: 'en-US', 'Español': 'es-AR', 'Português': 'pt-BR', 'Français': 'fr-FR' };
const day0 = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmtDay = (t, l) => new Date(t).toLocaleDateString(l, { weekday: 'long', month: 'long', day: 'numeric' });
const fmtTime = (t, l) => new Date(t).toLocaleTimeString(l, { hour: 'numeric', minute: '2-digit' });

export default function HistoryScreen() {
  const { events, lang } = useApp();
  const loc = LOCALES[lang] || 'en-US';
  const [q, setQ] = useState(''), [f, setF] = useState('All');
  const today = day0(Date.now());

  const list = events.filter((e) => {
    const d = day0(e.ts);
    const okF = f === 'All' || (f === 'Today' && d === today) || (f === 'Yesterday' && d === today - DAY) || (f === 'Week' && d > today - 7 * DAY);
    return okF && `${e.title} ${e.desc}`.toLowerCase().includes(q.toLowerCase());
  });
  const count = (t) => list.filter((e) => e.type === t).length;
  const groups = list.reduce((g, e) => { const k = day0(e.ts); (g[k] = g[k] || []).push(e); return g; }, {});
  const days = Object.keys(groups).map(Number).sort((a, b) => b - a);
  const stats = [['alert', 'Alerts', C.red], ['check', 'Check-ins', C.cyan], ['good', 'Improvements', C.green]];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.page}>
      <View>
        <Text style={z.h1}>Health History</Text>
        <Text style={z.sub}>Track your health events and improvements</Text>
      </View>

      <View style={[card, z.search]}>
        <Feather name="search" size={16} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search events..." placeholderTextColor={C.muted}
          style={z.input} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {FILTERS.map((x) => (
          <TouchableOpacity key={x} onPress={() => setF(x)}
            style={[z.chip, f === x && { borderColor: C.cyan, backgroundColor: '#0B3A4A' }]}>
            <Text style={{ color: f === x ? C.cyan : C.muted, fontSize: 12 }}>{x}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {stats.map(([t, label, c]) => (
          <View key={t} style={[card, { flex: 1, padding: 14 }]}>
            <Text style={{ color: c, fontSize: 24, fontWeight: '800' }}>{count(t)}</Text>
            <Text style={z.sub}>{label}</Text>
          </View>
        ))}
      </View>

      {days.length === 0 && <Text style={[z.sub, { textAlign: 'center', marginTop: 20 }]}>No events match. Try another filter.</Text>}

      {days.map((d) => (
        <View key={d}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Feather name="calendar" size={14} color={C.cyan} />
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{fmtDay(d, loc)}</Text>
          </View>
          <View style={z.line}>
            {groups[d].map((e) => {
              const m = META[e.type];
              return (
                <View key={e.id} style={{ marginBottom: 10 }}>
                  <View style={[z.dot, { backgroundColor: m.c }]} />
                  <View style={[card, { padding: 14, borderColor: m.c + '66', backgroundColor: m.c + '12' }]}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={[z.icon, { backgroundColor: m.c + '30' }]}><Feather name={m.icon} size={16} color={m.c} /></View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{e.title}</Text>
                          <Text style={z.sub}>{fmtTime(e.ts, loc)}</Text>
                        </View>
                        <Text style={[z.sub, { marginTop: 3 }]}>{e.desc}</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          {e.angle != null && <Text style={z.met}><Feather name="activity" size={11} color={C.cyan} /> {e.angle}°</Text>}
                          {e.bpm != null && <Text style={z.met}><Feather name="heart" size={11} color={C.red} /> {e.bpm} BPM</Text>}
                          {e.temp != null && <Text style={z.met}><Feather name="thermometer" size={11} color={C.orange} /> {Number(e.temp).toFixed(1)}°C</Text>}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const z = StyleSheet.create({
  page: { padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
  h1: { color: C.text, fontSize: 22, fontWeight: '800' }, sub: { color: C.muted, fontSize: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  input: { flex: 1, color: C.text, paddingVertical: 10, fontSize: 13, outlineStyle: 'none' },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.card },
  line: { marginLeft: 6, paddingLeft: 18, borderLeftWidth: 1, borderLeftColor: C.border },
  dot: { position: 'absolute', left: -25, top: 22, width: 12, height: 12, borderRadius: 6 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  met: { color: '#B6C4DA', fontSize: 11 },
});
