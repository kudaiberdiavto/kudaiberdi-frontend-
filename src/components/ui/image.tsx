import { Image as ExpoImage, type ImageProps } from 'expo-image'

/**
 * expo-image with the app's defaults: a short fade-in instead of a pop, memory + disk cache
 * (scrolling back through the catalog doesn't reload), and the photo is recycled per `recyclingKey`
 * so a reused list cell never flashes the previous row's picture.
 */
export function Image({ transition = 180, cachePolicy = 'memory-disk', contentFit = 'cover', ...props }: ImageProps) {
	const uri = typeof props.source === 'object' && props.source && 'uri' in props.source ? props.source.uri : undefined
	return <ExpoImage transition={transition} cachePolicy={cachePolicy} contentFit={contentFit} recyclingKey={uri} {...props} />
}
