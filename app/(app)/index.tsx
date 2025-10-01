import { Link } from 'expo-router'
import { Button, Text, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text style={{ fontSize: 20 }}>You are signed in ✅</Text>
      <Link href="/(app)/details" asChild>
        <Button title="Go to Details" />
      </Link>
    </View>
  )
}
