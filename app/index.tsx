// app/index.tsx
import { Link } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ marginBottom: 16 }}>
        This is the Home screen inside Drawer Navigation.
      </Text>
      <Link href="/details" asChild>
        <Button title="Go to Details" />
      </Link>
    </View>
  );
}
