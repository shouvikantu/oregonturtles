import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../../supabase'

export default function SignOutScreen() {
  const router = useRouter()

  useEffect(() => {
    const doSignOut = async () => {
      try {
        await supabase.auth.signOut()
      } finally {
        // After sign out, drawer guard flips to auth group
        router.replace('/(auth)/login')
      }
    }
    doSignOut()
  }, [router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
