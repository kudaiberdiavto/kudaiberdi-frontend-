// Источник: design/brands.json. Логотипы — только те 5 марок, для которых есть файл в assets/brands;
// у остальных показываем цветную букву-заглушку, как в макете (fallback, пока нет файла).
/** A bundled logo (`require`) or a remote one. */
export type LogoSource = number | { uri: string }

export interface Brand {
	name: string
	slug: string
	placeholder: string
	color: string
	logo: LogoSource | null
}

/** Bundled logos — shown instantly and offline; other brands use the server's `logoUrl`. */
export const logos: Record<string, LogoSource> = {
	toyota: require('../../assets/brands/toyota.png'),
	lexus: require('../../assets/brands/lexus.png'),
	honda: require('../../assets/brands/honda.png'),
	nissan: require('../../assets/brands/nissan.png'),
	'mercedes-benz': require('../../assets/brands/mercedes-benz.png'),
}

export const brands: Brand[] = [
	{ name: 'Toyota', slug: 'toyota', placeholder: 'T', color: '#D92D2D', logo: logos.toyota },
	{ name: 'Lexus', slug: 'lexus', placeholder: 'L', color: '#3F3F46', logo: logos.lexus },
	{ name: 'Honda', slug: 'honda', placeholder: 'H', color: '#B91C1C', logo: logos.honda },
	{ name: 'Nissan', slug: 'nissan', placeholder: 'N', color: '#6B7280', logo: logos.nissan },
	{ name: 'Mercedes-Benz', slug: 'mercedes-benz', placeholder: 'MB', color: '#1F2937', logo: logos['mercedes-benz'] },
	{ name: 'BMW', slug: 'bmw', placeholder: 'BMW', color: '#1C69D4', logo: null },
	{ name: 'Hyundai', slug: 'hyundai', placeholder: 'H', color: '#0B3D91', logo: null },
	{ name: 'Kia', slug: 'kia', placeholder: 'K', color: '#111827', logo: null },
	{ name: 'Mitsubishi', slug: 'mitsubishi', placeholder: 'M', color: '#DC2626', logo: null },
	{ name: 'Subaru', slug: 'subaru', placeholder: 'S', color: '#1E40AF', logo: null },
	{ name: 'Volkswagen', slug: 'volkswagen', placeholder: 'VW', color: '#1E3A8A', logo: null },
	{ name: 'Audi', slug: 'audi', placeholder: 'A', color: '#525252', logo: null },
	{ name: 'Mazda', slug: 'mazda', placeholder: 'M', color: '#374151', logo: null },
	{ name: 'Chevrolet', slug: 'chevrolet', placeholder: 'C', color: '#B8860B', logo: null },
	{ name: 'Daewoo', slug: 'daewoo', placeholder: 'D', color: '#2563EB', logo: null },
	{ name: 'Lada', slug: 'lada', placeholder: 'Л', color: '#4B5563', logo: null },
	{ name: 'Opel', slug: 'opel', placeholder: 'O', color: '#CA8A04', logo: null },
	{ name: 'Ford', slug: 'ford', placeholder: 'F', color: '#1D4ED8', logo: null },
]

export function brandBySlug(slug: string): Brand {
	const brand = brands.find((b) => b.slug === slug)
	if (!brand) throw new Error(`Unknown brand slug: ${slug}`)
	return brand
}
