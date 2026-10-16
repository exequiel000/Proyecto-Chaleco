import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuracion de la app web de Firebase (proyecto VitalVest).
// Estos valores no son secretos: la seguridad la dan los "Dominios autorizados" de Authentication.
const firebaseConfig = {
  apiKey: 'AIzaSyARXArcxe_cN1m-D-RAdX3b3UQtid12wMQ',
  authDomain: 'vitalvest-0000.firebaseapp.com',
  projectId: 'vitalvest-0000',
  appId: '1:458431446513:web:24f662dedeaac296079850',
};

export const auth = getAuth(initializeApp(firebaseConfig));
