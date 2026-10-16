import React from 'react';
import { StyleSheet, View as RNView, Text as RNText, ScrollView as RNScroll, TouchableOpacity as RNTouch, TextInput as RNInput } from 'react-native';
import { useApp } from './AppContext';
import { tr } from './dict';

// Cada color original (tema oscuro) tiene un "rol". Según el tema (claro / alto contraste) se cambia por el color del rol,
// así no hace falta tocar cada pantalla. Los colores de acento (verde, rojo, cian, naranja) no cambian.
const ROLE = {};
const add = (role, list) => list.forEach((c) => { ROLE[c.toLowerCase()] = role; });
add('bg', ['#050B18']);
add('card', ['#141B2D', '#111A2E', '#0A1122', '#1B2B45', '#1B2436', '#1E2A44', '#0E2A3D', '#0B2238', '#0E2A2A', '#0B3A4A', '#25111C']);
add('track', ['#25344A']);
add('border', ['#232C42', '#2A3F5F', '#2A3550', '#164B66', '#5B1F2E']);
add('soft', ['#B6C4DA', '#6F86B0', '#5F7392']);
add('muted', ['#7C8AA5']);

const MODES = {
  dark: null,
  light: { bg: '#F1F5FB', card: '#FFFFFF', track: '#D9E2F0', border: '#D3DCEA', text: '#0B1220', soft: '#3B4A63', muted: '#5B6B85' },
  darkHC: { bg: '#000000', card: '#000000', track: '#555555', border: '#FFFFFF', text: '#FFFFFF', soft: '#FFFFFF', muted: '#E6E6E6' },
  lightHC: { bg: '#FFFFFF', card: '#FFFFFF', track: '#BBBBBB', border: '#000000', text: '#000000', soft: '#000000', muted: '#222222' },
};
const FONT = { small: 0.9, medium: 1, large: 1.15 };
const DEFAULT = { darkMode: true, highContrast: false, fontSize: 'medium', language: 'English' };
const KEYS = ['backgroundColor', 'color', 'borderColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'borderBottomColor'];

export function useSkin() {
  const app = useApp();
  const s = app ? app.settings : DEFAULT;
  const P = MODES[s.darkMode ? (s.highContrast ? 'darkHC' : 'dark') : s.highContrast ? 'lightHC' : 'light'];
  const map = (c) => {
    if (!P || typeof c !== 'string') return c;
    if (c === '#FFFFFF') return P.text; // el texto principal es #FFFFFF (el blanco sobre botones de color es #fff)
    const r = ROLE[c.toLowerCase()];
    return r ? P[r] : c;
  };
  return { map, F: FONT[s.fontSize] || 1, t: (x) => tr(app ? app.lang : 'English', x) };
}

const skinStyle = (style, map, F) => {
  const o = StyleSheet.flatten(style);
  if (!o) return o;
  const r = { ...o };
  KEYS.forEach((k) => { if (r[k]) r[k] = map(r[k]); });
  if (F !== 1 && typeof r.fontSize === 'number') r.fontSize = Math.round(r.fontSize * F * 10) / 10;
  return r;
};

const Plain = (Comp) => React.forwardRef(({ style, ...p }, ref) => {
  const { map } = useSkin();
  return <Comp ref={ref} {...p} style={skinStyle(style, map, 1)} />;
});
export const View = Plain(RNView);
export const ScrollView = Plain(RNScroll);
export const TouchableOpacity = Plain(RNTouch);

// Text: traduce, cambia colores y escala el tamaño de letra
export const Text = React.forwardRef(({ style, children, ...p }, ref) => {
  const { map, F, t } = useSkin();
  return (
    <RNText ref={ref} {...p} style={skinStyle(style, map, F)}>
      {React.Children.map(children, (c) => (typeof c === 'string' ? t(c) : c))}
    </RNText>
  );
});

export const TextInput = React.forwardRef(({ style, placeholder, placeholderTextColor, ...p }, ref) => {
  const { map, F, t } = useSkin();
  return (
    <RNInput ref={ref} {...p} placeholder={placeholder ? t(placeholder) : placeholder}
      placeholderTextColor={map(placeholderTextColor)} style={skinStyle(style, map, F)} />
  );
});
