import React, { useState } from 'react';
import { useApp } from './AppContext';
import { registerUser } from './db';
import { AuthCard, Field, Button, ErrorText, LinkText } from './AuthUI';

export default function RegisterScreen({ navigation }) {
  const { login } = useApp();
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [pass, setPass] = useState(''), [pass2, setPass2] = useState('');
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (!name.trim() || !email.includes('@')) return setErr('Enter your name and a valid email.');
    if (pass.length < 6) return setErr('Password must have at least 6 characters.');
    if (pass !== pass2) return setErr('Passwords do not match.');
    setBusy(true);
    try { await login(await registerUser(name, email, pass)); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <AuthCard subtitle="Create your account">
      <Field icon="user" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field icon="mail" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field icon="lock" placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry />
      <Field icon="lock" placeholder="Confirm password" value={pass2} onChangeText={setPass2} secureTextEntry onSubmitEditing={submit} />
      <ErrorText>{err}</ErrorText>
      <Button label="Create account" onPress={submit} busy={busy} />
      <LinkText onPress={() => navigation.goBack()}>Back to sign in</LinkText>
    </AuthCard>
  );
}
