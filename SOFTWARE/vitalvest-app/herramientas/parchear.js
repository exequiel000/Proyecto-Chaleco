// Ajusta app.json y enlaza el manifest PWA en public/index.html (se ejecuta dentro de la carpeta app)
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('app.json', 'utf8'));
j.expo = j.expo || {};
Object.assign(j.expo, { name: 'VitalVest', userInterfaceStyle: 'dark' });
j.expo.web = { ...(j.expo.web || {}), bundler: 'metro', output: 'single', name: 'VitalVest',
  shortName: 'VitalVest', themeColor: '#050B18', backgroundColor: '#050B18' };
fs.writeFileSync('app.json', JSON.stringify(j, null, 2));
console.log('app.json listo');
const p = 'public/index.html';
if (fs.existsSync(p)) {
  let h = fs.readFileSync(p, 'utf8');
  if (!h.includes('manifest.json')) {
    h = h.replace('</head>', '  <link rel="manifest" href="/manifest.json" />\n  <meta name="theme-color" content="#050B18" />\n</head>');
    fs.writeFileSync(p, h);
  }
  console.log('index.html listo');
} else {
  console.log('AVISO: no se creo public/index.html. Ejecuta dentro de app: npx expo customize public/index.html y luego: node ..\\herramientas\\parchear.js');
}
