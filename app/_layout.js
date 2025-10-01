// app/_layout.js
import { Drawer } from 'expo-router/drawer'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../supabase'

const AuthContext = createContext({ session: null, isLoggedIn: false })
export const useAuth = () => useContext(AuthContext)

export default function RootLayout() {
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let mounted = true

    // Load any existing session on startup
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setBooting(false)
    })

    // Subscribe to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      sub.subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ session, isLoggedIn: !!session }), [session])

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      <Drawer>
        {/* When logged OUT: ONLY show auth screens */}
        <Drawer.Protected guard={!value.isLoggedIn}>
          <Drawer.Screen
            name="(auth)/login"
            options={{ title: 'Log in', drawerLabel: 'Log in' }}
          />
          <Drawer.Screen
            name="(auth)/signup"
            options={{ title: 'Sign up', drawerLabel: 'Sign up' }}
          />
        </Drawer.Protected>

        {/* When logged IN: show app screens + Sign Out */}
        <Drawer.Protected guard={value.isLoggedIn}>
          <Drawer.Screen
            name="(app)/index"
            options={{ title: 'Home', drawerLabel: 'Home' }}
          />
          <Drawer.Screen
            name="(app)/details"
            options={{ title: 'Details', drawerLabel: 'Details' }}
          />
          <Drawer.Screen
            name="(app)/signout"
            options={{ title: 'Sign out', drawerLabel: 'Sign out' }}
          />
        </Drawer.Protected>
      </Drawer>
    </AuthContext.Provider>
  )
}
