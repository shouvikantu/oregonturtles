import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Button, Text, TextInput, View } from 'react-native'
import { supabase } from '../../supabase'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSignup = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // If you want email deep link later, set options.emailRedirectTo here
      })
      if (error) throw error

      // If email confirmation is ON (default), session will be null here
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link to finish signing up.'
      )
      router.replace('/(auth)/login')
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>Sign up</Text>

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

      <Button title={loading ? 'Creating account…' : 'Sign up'} onPress={onSignup} disabled={loading} />

      <Text style={{ marginTop: 16 }}>
        Already have an account?{' '}
        <Link href="/(auth)/login">Log in</Link>
      </Text>
    </View>
  )
}
