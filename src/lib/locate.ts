import * as Location from 'expo-location'

/** A fix from the last few minutes is good enough: «где я сейчас» for a service request or the master's address. */
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000
const LAST_KNOWN_ACCURACY_M = 300
/** A fresh fix waits for satellites — give up after this and take a rough one. */
const FRESH_TIMEOUT_MS = 6_000

function withTimeout<T>(promise: Promise<T>, ms: number) {
	return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))])
}

/**
 * Where the phone is — fast: the last known position (instant) if recent, else a fresh Balanced fix
 * within 6 s, else a rough Lowest one. Ask for the permission before calling.
 */
export async function currentCoords(): Promise<Location.LocationObjectCoords> {
	const last = await Location.getLastKnownPositionAsync({
		maxAge: LAST_KNOWN_MAX_AGE_MS,
		requiredAccuracy: LAST_KNOWN_ACCURACY_M,
	}).catch(() => null)
	if (last) return last.coords
	const fresh = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), FRESH_TIMEOUT_MS)
	if (fresh) return fresh.coords
	return (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest })).coords
}

/**
 * The address of a point for a person: «ул. Ахунбаева 98, Бишкек». In Kyrgyzstan the geocoder often leaves
 * streetNumber empty and puts the house into `name` — take whichever has the number, then add the city.
 */
export async function addressAt(coords: { latitude: number; longitude: number }): Promise<string | null> {
	const [place] = await Location.reverseGeocodeAsync(coords).catch(() => [] as Location.LocationGeocodedAddress[])
	if (!place) return null
	const withNumber = place.streetNumber ? [place.street, place.streetNumber].filter(Boolean).join(' ') : null
	const named = place.name && /\d/.test(place.name) ? place.name : null
	const line = withNumber ?? named ?? place.street ?? place.name ?? place.district ?? null
	const city = place.city ?? place.subregion ?? null
	if (!line) return city
	return city && !line.includes(city) ? `${line}, ${city}` : line
}
