// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="details"
        options={{
          drawerLabel: 'Details',
          title: 'Details',
        }}
      />
    </Drawer>
  );
}
