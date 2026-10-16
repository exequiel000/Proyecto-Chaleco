import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, sendPasswordResetEmail, signOut, onAuthStateChanged, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  RecaptchaVerifier, linkWithPhoneNumber, unlink,
} from 'firebase/auth';
import { auth } from './firebase';

// Autenticacion con Firebase (correo, Google y recuperacion de contrasena).
const toUser = (u) => ({ name: u.displayName || (u.email || 'User').split('@')[0], email: u.email });
const MSG = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must have at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'No internet connection.',
  'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication > Settings > Authorized domains). Open the app from http://localhost:8081.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase (Authentication > Sign-in method).',
  'auth/invalid-api-key': 'Invalid Firebase API key. Check firebase.js.',
  'auth/api-key-not-valid': 'Invalid Firebase API key. Check firebase.js.',
  'auth/popup-blocked': 'The browser blocked the Google window. Allow pop-ups for this site and try again.',
  'auth/account-exists-with-different-credential': 'This email is registered with another sign-in method.',
  'auth/requires-recent-login': 'For security, log out, sign in again and retry.',
  'auth/invalid-phone-number': 'Enter the number with country code, e.g. +54 9 11 1234 5678.',
  'auth/missing-phone-number': 'Enter the number with country code, e.g. +54 9 11 1234 5678.',
  'auth/invalid-verification-code': 'The code is incorrect.',
  'auth/code-expired': 'The code expired. Request a new one.',
  'auth/credential-already-in-use': 'This phone number is already linked to another account.',
  'auth/provider-already-linked': 'A phone number is already linked.',
  'auth/quota-exceeded': 'SMS is not available: the region is not allowed or billing is not enabled in Firebase.',
  'auth/billing-not-enabled': 'SMS is not available: the region is not allowed or billing is not enabled in Firebase.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
};
const wrap = async (fn) => {
  try { return await fn(); } catch (e) {
    const m = MSG[e.code];
    throw new Error(m === undefined ? `${e.code || 'error'}: ${e.message}` : m);
  }
};

export const registerUser = (name, email, pass) => wrap(async () => {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  await updateProfile(user, { displayName: name.trim() });
  return toUser({ displayName: name.trim(), email: user.email });
});
export const checkUser = (email, pass) => wrap(async () => toUser((await signInWithEmailAndPassword(auth, email.trim(), pass)).user));
export const googleSignIn = () => wrap(async () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' }); // deja elegir la cuenta de Gmail
  try { return toUser((await signInWithPopup(auth, p)).user); }
  catch (e) {
    if (e.code === 'auth/popup-blocked') { await signInWithRedirect(auth, p); return null; } // plan B sin ventana emergente
    throw e;
  }
});
export const sendReset = (email) => wrap(() => sendPasswordResetEmail(auth, email.trim()));
export const signOutUser = () => signOut(auth);
export const onUser = (cb) => onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null), () => cb(null));
export const updateName = (name) => wrap(() => updateProfile(auth.currentUser, { displayName: name.trim() }));
export const removeAccount = () => wrap(() => deleteUser(auth.currentUser));
export const hasPassword = () => !!(auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'password'));
export const getPhone = () => (auth.currentUser && auth.currentUser.phoneNumber) || null;
export const changePassword = (cur, next) => wrap(async () => {
  const u = auth.currentUser; // Firebase exige confirmar la contraseña actual antes de cambiarla
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, cur));
  await updatePassword(u, next);
});
export const hasGoogle = () => !!(auth.currentUser && auth.currentUser.providerData.some((p) => p.providerId === 'google.com'));
// Vincular teléfono por SMS (Firebase usa un reCAPTCHA invisible)
let verifier = null;
const getVerifier = () => {
  if (!verifier) {
    let el = document.getElementById('vv-recaptcha');
    if (!el) { el = document.createElement('div'); el.id = 'vv-recaptcha'; document.body.appendChild(el); }
    verifier = new RecaptchaVerifier(auth, el, { size: 'invisible' });
  }
  return verifier;
};
export const startPhoneLink = (phone) => wrap(async () => {
  try { return await linkWithPhoneNumber(auth.currentUser, phone.replace(/[\s-]/g, ''), getVerifier()); }
  catch (e) { try { verifier && verifier.clear(); } catch (x) {} verifier = null; throw e; }
});
export const confirmPhoneLink = (conf, code) => wrap(async () => { await conf.confirm(code.trim()); await auth.currentUser.reload(); });
export const unlinkPhone = () => wrap(async () => { await unlink(auth.currentUser, 'phone'); await auth.currentUser.reload(); });
