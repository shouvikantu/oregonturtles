import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Button, Text, TextInput, View } from 'react-native'
import { supabase } from '../../supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Auth state changes; drawer will switch to (app) group
      router.replace('/(app)')
    } catch (err: any) {
      Alert.alert('Login failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>Log in</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />

      <Button title={loading ? 'Logging in…' : 'Log in'} onPress={onLogin} disabled={loading} />

      <Text style={{ marginTop: 16 }}>
        Don’t have an account?{' '}
        <Link href="/(auth)/signup">Sign up</Link>
      </Text>
    </View>
  )
}
