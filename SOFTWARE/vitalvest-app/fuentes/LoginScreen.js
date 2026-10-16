import React, { useState } from 'react';
import { Text } from './skin';
import { useApp, C } from './AppContext';
import { checkUser, googleSignIn } from './db';
import { AuthCard, Field, Button, ErrorText, LinkText } from './AuthUI';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState(''), [pass, setPass] = useState('');
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [gBusy, setGBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (!email || !pass) return setErr('Enter your email and password.');
    setBusy(true);
    try { await login(await checkUser(email, pass)); } // al iniciar sesion, App.js cambia a las pestanas
    catch (e) { setErr(e.message); setBusy(false); }
  };

  const google = async () => {
    setErr(''); setGBusy(true);
    try { await login(await googleSignIn()); }
    catch (e) { setErr(e.message); setGBusy(false); }
  };

  return (
    <AuthCard subtitle="Posture">
      <Field icon="mail" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field icon="lock" placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry onSubmitEditing={submit} />
      <ErrorText>{err}</ErrorText>
      <Button label="Sign In" onPress={submit} busy={busy} />
      <LinkText onPress={() => navigation.navigate('ForgotPassword')}>Forgot password?</LinkText>
      <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12 }}>OR</Text>
      <Button ghost label="Continue with Google" onPress={google} busy={gBusy} />
      <LinkText onPress={() => navigation.navigate('Register')}>Create account</LinkText>
      <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11 }}>By signing in, you agree to our Terms & Privacy Policy</Text>
    </AuthCard>
  );
}
