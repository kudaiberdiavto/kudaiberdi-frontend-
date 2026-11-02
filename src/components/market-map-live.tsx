import { forwardRef, type Ref } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { fontFamily, fs, raw } from '@/theme'
import type { MarketMapLiveHandle } from './market-map-maplibre'
import { t } from '@/i18n'

export type { MarketMapLiveHandle } from './market-map-maplibre'

// MapLibre is a native module that Expo Go does not ship. expo-router evaluates every
// route up front, so a top-level import would crash the whole app in Expo Go —
// load the real map lazily and only in a native (dev client / release) build.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
// eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional native import
const Real = inExpoGo ? null : (require('./market-map-maplibre') as typeof import('./market-map-maplibre')).MarketMapLive

type Props = React.ComponentProps<typeof import('./market-map-maplibre').MarketMapLive>

export const MarketMapLive = forwardRef(function MarketMapLive(props: Props, ref: Ref<MarketMapLiveHandle>) {
	if (Real) return <Real {...props} ref={ref} />
	return (
		<View style={[StyleSheet.absoluteFill, { backgroundColor: raw.mapSurface, alignItems: 'center', justifyContent: 'center' }]}>
			<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: raw.mapLabel, textAlign: 'center', paddingHorizontal: 32 }}>{t('Карта работает в сборке приложения, в Expo Go её нет')}</Text>
		</View>
	)
})
