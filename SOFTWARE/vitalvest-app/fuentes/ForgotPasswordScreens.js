import React, { useState } from 'react';
import { Text } from './skin';
import { C } from './AppContext';
import { sendReset } from './db';
import { AuthCard, Field, Button, ErrorText, LinkText } from './AuthUI';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState(''), [err, setErr] = useState('');
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false);

  const submit = async () => {
    setErr('');
    if (!email.includes('@')) return setErr('Enter a valid email.');
    setBusy(true);
    try { await sendReset(email); setSent(true); } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <AuthCard subtitle="Reset your password">
      <Field icon="mail" placeholder="Account email" value={email} onChangeText={setEmail} keyboardType="email-address" onSubmitEditing={submit} />
      <ErrorText>{err}</ErrorText>
      {sent && <Text style={{ color: C.green, fontSize: 13, textAlign: 'center' }}>If an account exists for that email, we sent a reset link. Check your inbox and spam folder.</Text>}
      <Button label="Send reset link" onPress={submit} busy={busy} />
      <LinkText onPress={() => navigation.goBack()}>Back to sign in</LinkText>
    </AuthCard>
  );
}
