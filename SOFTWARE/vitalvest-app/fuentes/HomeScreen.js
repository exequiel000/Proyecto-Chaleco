import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ScrollView, useSkin } from './skin';
import Svg, { Circle, Line } from 'react-native-svg';
import { Feather } from './Icon';
import { useApp, C, card, stateOf, stateColor, stateLabel } from './AppContext';
import { LiveChart } from './AnalysisScreen';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 19 ? 'Good Afternoon' : 'Good Evening'; };
const LINK = { ble: 'Connected', sim: 'Simulated', off: 'Disconnected' };

function Metric({ icon, color, label, value, unit, min, max }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <View style={[card, { padding: 16 }]}>
      <View style={z.between}>
        <View style={[z.icon, { backgroundColor: color + '30' }]}><Feather name={icon} size={16} color={color} /></View>
        <Text style={[z.pct, { color, backgroundColor: color + '25' }]}>{Math.round(pct)}%</Text>
      </View>
      <Text style={[z.sub, { marginTop: 10 }]}>{label}</Text>
      <Text style={{ color, fontSize: 24, fontWeight: '800' }}>{value.toFixed(1)} <Text style={z.sub}>{unit}</Text></Text>
      <View style={z.track}><View style={{ width: `${pct}%`, height: 4, borderRadius: 2, backgroundColor: color }} /></View>
    </View>
  );
}

function Ring({ angle, color }) {
  const { map } = useSkin();
  const p = Math.min(angle, 90) / 90, R = 50, L = 2 * Math.PI * R;
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r={R} stroke={map('#25344A')} strokeWidth="9" fill="none" />
      <Circle cx="60" cy="60" r={R} stroke={color} strokeWidth="9" fill="none" strokeLinecap="round"
        strokeDasharray={`${p * L} ${L}`} rotation="-90" origin="60,60" />
      <Line x1="60" y1="44" x2="60" y2="76" stroke={color} strokeWidth="6" strokeLinecap="round" rotation={angle} origin="60,60" />
    </Svg>
  );
}

export default function HomeScreen() {
  const { user, data, series, mode, device } = useApp();
  const st = stateOf(data.angle), col = stateColor[st];
  const first = (user?.name || 'there').split(' ')[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.page}>
      <View style={z.between}>
        <View style={{ flex: 1 }}>
          <Text style={z.h1}>{greet()}, {first}</Text>
          <Text style={z.sub}>{st === 'good' ? 'Your posture looks great right now' : 'Straighten up: your posture needs attention'}</Text>
        </View>
        <View style={z.link}>
          <Feather name="bluetooth" size={12} color={C.cyan} />
          <Text style={{ color: C.text, fontSize: 11 }}> {mode === 'ble' ? device || 'Connected' : LINK[mode]}</Text>
        </View>
      </View>

      <View style={z.grid}>
        <View style={[card, z.main, { borderColor: col + '55' }]}>
          <View style={z.between}>
            <View>
              <Text style={z.h2}>Posture Monitor</Text>
              <Text style={z.sub}>Real-time body inclination</Text>
            </View>
            <Feather name={st === 'good' ? 'check-circle' : 'alert-triangle'} size={22} color={col} />
          </View>
          <View style={[z.between, { marginVertical: 18 }]}>
            <View>
              <Text style={{ color: col, fontSize: 64, fontWeight: '800' }}>{Math.round(data.angle)}°</Text>
              <View style={[z.badge, { backgroundColor: col + '25' }]}><Text style={{ color: col, fontSize: 12, fontWeight: '600' }}>● {stateLabel[st]}</Text></View>
            </View>
            <Ring angle={data.angle} color={col} />
          </View>
          <View style={z.track}><View style={{ width: `${Math.min(data.angle, 90) / 0.9}%`, height: 4, borderRadius: 2, backgroundColor: col }} /></View>
          <View style={[z.between, { marginTop: 6 }]}>
            <Text style={z.tiny}>Perfect (0°)</Text><Text style={z.tiny}>Current ({Math.round(data.angle)}°)</Text><Text style={z.tiny}>Critical (90°)</Text>
          </View>
        </View>

        <View style={z.side}>
          <Metric icon="heart" color={C.red} label="Heart Rate" value={data.bpm} unit="BPM" min={40} max={140} />
          <Metric icon="thermometer" color={C.orange} label="Temperature" value={data.temp} unit="°C" min={34} max={40} />
          <Metric icon="battery" color={C.green} label="Battery" value={data.battery} unit="%" min={0} max={100} />
        </View>
      </View>

      <View style={card}>
        <Text style={z.h2}>Recent Activity</Text>
        <Text style={[z.sub, { marginBottom: 8 }]}>Posture angle, last 60 seconds</Text>
        <LiveChart series={series} />
      </View>
    </ScrollView>
  );
}

const z = StyleSheet.create({
  page: { padding: 20, gap: 16, maxWidth: 980, width: '100%', alignSelf: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: C.text, fontSize: 24, fontWeight: '800' }, h2: { color: C.text, fontSize: 15, fontWeight: '700' },
  sub: { color: C.muted, fontSize: 12 }, tiny: { color: C.muted, fontSize: 10 },
  link: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.card },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  main: { flexGrow: 2, flexBasis: 320, backgroundColor: '#0E2A2A' }, side: { flexGrow: 1, flexBasis: 240, gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pct: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: '#25344A', marginTop: 8 },
});
