import { getApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import './firebase'; // asegura que la app de Firebase ya esté creada
import * as cfg from './appcheck';

const APPCHECK_SITE_KEY = cfg.APPCHECK_SITE_KEY;
const KIND = cfg.APPCHECK_PROVIDER || 'enterprise'; // 'enterprise' (lo recomendado por Firebase) o 'v3'

// Modelos de Firebase AI Logic (Gemini Developer API, sin facturación). Se prueban en orden: si uno no existe pasa al siguiente.
const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

let ai = null;
try {
  const app = getApp();
  if (APPCHECK_SITE_KEY) {
    try {
      // en localhost el navegador muestra en la consola un "debug token": regístralo en Firebase -> App Check -> Apps -> Administrar tokens de depuración
      if (typeof location !== 'undefined' && location.hostname === 'localhost') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      initializeAppCheck(app, { provider: KIND === 'v3' ? new ReCaptchaV3Provider(APPCHECK_SITE_KEY) : new ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
    } catch (e) {}
  }
  ai = getAI(app, { backend: new GoogleAIBackend() });
} catch (e) {}

// Traduce el error técnico a una frase clara (queda en inglés; el aviso principal de la pantalla sí está traducido)
const explain = (e) => {
  const m = String((e && e.message) || e);
  if (/429|quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(m)) return 'Usage limit reached (too many requests). Wait a minute and try again.';
  if (/503|overloaded|high demand/i.test(m)) return 'The AI service is busy. Try again in a moment.';
  if (/firebasevertexai|firebaseml|SERVICE_DISABLED|has not been used|API.*(not|must be).*enabled/i.test(m)) return 'The Firebase AI API is not enabled yet or is still activating. Check AI Logic in the Firebase console.';
  if (/app.?check|appcheck/i.test(m)) return 'App Check rejected the request. Register the debug token again (App Check > Apps > Manage debug tokens).';
  return m;
};

export async function askAI(prompt, system) {
  if (!ai) throw new Error('Firebase AI could not start');
  let last;
  for (const name of MODELS) {
    try {
      const model = getGenerativeModel(ai, { model: name, systemInstruction: system });
      return (await model.generateContent(prompt)).response.text();
    } catch (e) {
      last = e;
      // si el modelo no existe, está saturado o llegó a su límite, se prueba el siguiente (cada modelo tiene su propio cupo)
      if (!/404|not.?found|not supported|429|quota|RESOURCE_EXHAUSTED|503|overloaded|unavailable/i.test(String((e && e.message) || e))) break;
    }
  }
  const raw = String((last && last.message) || last);
  console.error('[VitalVest AI]', last); // el detalle completo también queda en la consola del navegador (F12)
  const why = explain(last);
  throw new Error(why === raw ? raw : `${why}\n${raw.slice(0, 450)}`); // explicación clara + texto técnico original
}
