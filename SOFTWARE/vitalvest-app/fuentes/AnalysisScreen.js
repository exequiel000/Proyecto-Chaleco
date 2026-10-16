import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ScrollView, useSkin } from './skin';
import Svg, { Polyline, Circle, Line, Text as SText } from 'react-native-svg';
import { Feather } from './Icon';
import { useApp, C, card, stateOf, stateColor, stateLabel } from './AppContext';

const MSG = { good: 'Great! Keep maintaining this posture for optimal spine health.',
  warn: 'Slight lean detected. Straighten your back.', bad: 'Poor posture. Sit up straight now.' };
const TIPS = ['Keep your back straight and shoulders relaxed', 'Position your screen at eye level',
  'Take breaks every 30 minutes to stretch', 'Ensure your feet are flat on the floor'];

function Spine({ angle, color }) {
  const pts = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 50 + (angle * 0.9 * (5 - i)) / 5, y: 12 + i * 30 }));
  return (
    <Svg width={100} height={170} viewBox="0 0 100 170">
      <Polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth="4" />
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="6" fill={color} />)}
    </Svg>
  );
}

export function LiveChart({ series }) {
  const { map } = useSkin();
  const [w, setW] = useState(300);
  const H = 140, P = 26, max = 50;
  const x = (i) => P + (i / Math.max(series.length - 1, 1)) * (w - P - 8);
  const y = (v) => H - 16 - (Math.min(v, max) / max) * (H - 28);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={H}>
        {[0, 15, 30, 50].map((v) => (
          <React.Fragment key={v}>
            <Line x1={P} x2={w - 8} y1={y(v)} y2={y(v)} stroke={v === 30 ? C.red : map(C.border)} strokeDasharray="4 4" strokeWidth="1" />
            <SText x={0} y={y(v) + 3} fill={C.muted} fontSize="9">{v}</SText>
          </React.Fragment>
        ))}
        {series.length > 1 && <Polyline points={series.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={C.cyan} strokeWidth="2" />}
      </Svg>
    </View>
  );
}

export default function AnalysisScreen() {
  const { data, series, stats } = useApp();
  const st = stateOf(data.angle), col = stateColor[st], s = stats.t0 ? Math.floor((Date.now() - stats.t0) / 1000) : 0;
  const time = s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const avg = stats.n ? Math.round(stats.sum / stats.n) : 0, good = stats.n ? Math.round((100 * stats.good) / stats.n) : 0;
  const tiles = [['activity', 'Session Time', time], ['trending-up', 'Avg Angle', `${avg}°`],
    ['check-circle', 'Good Posture', `${good}%`], ['alert-triangle', 'Alerts', String(stats.alerts)]];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={z.page}>
      <View style={z.head}>
        <View>
          <Text style={z.h1}>Posture Monitor</Text>
          <Text style={z.sub}>Real-time spine tracking</Text>
        </View>
        <Feather name={st === 'good' ? 'check-circle' : 'alert-triangle'} size={26} color={col} />
      </View>

      <View style={[card, { alignItems: 'center', borderColor: col + '55', paddingVertical: 24 }]}>
        <Text style={{ color: col, fontSize: 72, fontWeight: '800' }}>{Math.round(data.angle)}°</Text>
        <View style={[z.badge, { borderColor: col + '88', backgroundColor: col + '22' }]}>
          <Text style={{ color: col, fontWeight: '700', fontSize: 13 }}>● {stateLabel[st]}</Text>
        </View>
        <View style={{ marginVertical: 16 }}><Spine angle={data.angle} color={col} /></View>
        <Text style={z.sub}>{MSG[st]}</Text>
      </View>

      <View style={z.row}>
        {tiles.map(([icon, label, val]) => (
          <View key={label} style={[card, z.tile]}>
            <View style={z.tileHead}><Feather name={icon} size={13} color={C.cyan} /><Text style={z.sub}> {label}</Text></View>
            <Text style={z.val}>{val}</Text>
          </View>
        ))}
      </View>

      <View style={card}>
        <Text style={z.h2}>Live Posture Tracking</Text>
        <LiveChart series={series} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6 }}>
          <Text style={z.sub}><Text style={{ color: C.green }}>● </Text>Good Zone (0-30°)    <Text style={{ color: C.red }}>● </Text>Alert Zone (30°+)</Text>
        </View>
      </View>

      <View style={[card, { backgroundColor: '#0B2238', borderColor: '#164B66' }]}>
        <Text style={z.h2}><Feather name="activity" size={14} color={C.cyan} />  Posture Tips</Text>
        {TIPS.map((t) => <Text key={t} style={z.tip}>•  {t}</Text>)}
      </View>
    </ScrollView>
  );
}

const z = StyleSheet.create({
  page: { padding: 20, gap: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  h1: { color: C.text, fontSize: 22, fontWeight: '800' }, h2: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  sub: { color: C.muted, fontSize: 12 }, val: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { flexGrow: 1, flexBasis: 140, padding: 14 },
  tileHead: { flexDirection: 'row', alignItems: 'center' }, tip: { color: '#B6C4DA', fontSize: 13, marginVertical: 3 },
});
