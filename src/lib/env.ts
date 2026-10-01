import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Backend addresses. `EXPO_PUBLIC_*` wins when set (staging / production builds).
// In development they default to the machine that runs Metro — the simulator and
// a phone on the same Wi-Fi reach it by its current IP, so changing networks
// needs no config edits.

function devHost() {
	if (Platform.OS === 'web') return typeof location === 'undefined' ? 'localhost' : location.hostname
	const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
	return hostUri?.split(':')[0] || 'localhost'
}

const strip = (url: string) => url.replace(/\/$/, '')

export const API_URL = strip(process.env.EXPO_PUBLIC_API_URL || `http://${devHost()}:8080`)

export const CENTRIFUGO_URL =
	process.env.EXPO_PUBLIC_CENTRIFUGO_URL || `ws://${devHost()}:8000/connection/websocket`
