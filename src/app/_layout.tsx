import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { setAudioModeAsync } from 'expo-audio'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	Inter_300Light,
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	Inter_800ExtraBold,
	useFonts,
} from '@expo-google-fonts/inter'
import { queryClient } from '@/lib/query-client'
import { RealtimeProvider } from '@/lib/realtime'
import { PushProvider } from '@/lib/push'
import { useDictionariesVersion } from '@/lib/dictionaries'
import { useSession } from '@/store/useSession'
import { lightColors } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		Inter_300Light,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
		Inter_800ExtraBold,
	})

	const booting = useSession((s) => s.status === 'booting')

	useEffect(() => {
		useSession.getState().boot()
		// Voice notes play even with the iPhone's silent switch on — otherwise they are mute until the first recording.
		setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {})
	}, [])
	useDictionariesVersion()

	const ready = fontsLoaded && !booting

	useEffect(() => {
		if (ready) SplashScreen.hideAsync()
	}, [ready])

	if (!ready) return null

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={queryClient}>
				<RealtimeProvider>
					<PushProvider>
						<SafeAreaProvider>
							<StatusBar style="dark" />
							<Stack
								screenOptions={{
									headerShown: false,
									contentStyle: { backgroundColor: lightColors.surface },
								}}
							/>
						</SafeAreaProvider>
					</PushProvider>
				</RealtimeProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	)
}
