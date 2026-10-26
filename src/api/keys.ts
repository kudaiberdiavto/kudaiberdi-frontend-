// Query key factory for every domain in one place, so realtime handlers and
// mutations can invalidate across domains without importing each other.

export const meKeys = {
	all: ['me'] as const,
	me: ['me', 'profile'] as const,
	settings: ['me', 'settings'] as const,
	cars: ['me', 'cars'] as const,
	favoriteParts: ['me', 'favorite-parts'] as const,
	favoriteShops: ['me', 'favorite-shops'] as const,
}

export const directoryKeys = {
	brands: (params: { popular?: boolean; q?: string } = {}) => ['directory', 'brands', params] as const,
	models: (brandId: number) => ['directory', 'models', brandId] as const,
	modelSearch: (params: { brandId?: number; q?: string }) => ['directory', 'model-search', params] as const,
	categories: ['directory', 'categories'] as const,
	reviewTags: ['directory', 'review-tags'] as const,
}

export const requestKeys = {
	all: ['requests'] as const,
	myAll: ['requests', 'my'] as const,
	my: (status?: string) => ['requests', 'my', { status }] as const,
	detail: (id: number) => ['requests', 'detail', id] as const,
	replies: (id: number) => ['requests', 'detail', id, 'replies'] as const,
	stats: (id: number) => ['requests', 'detail', id, 'stats'] as const,
	hints: (carId: number | undefined) => ['requests', 'hints', carId] as const,
	estimate: (params: object) => ['requests', 'estimate', params] as const,
}

export const incomingKeys = {
	all: ['incoming'] as const,
	list: (filter: string) => ['incoming', 'list', filter] as const,
	detail: (id: number) => ['incoming', 'detail', id] as const,
	suggestedParts: (id: number) => ['incoming', 'detail', id, 'suggested-parts'] as const,
}

export const shopKeys = {
	my: ['shop', 'my'] as const,
	verification: ['shop', 'my', 'verification'] as const,
	photos: ['shop', 'my', 'photos'] as const,
	members: ['shop', 'my', 'members'] as const,
	reviews: ['shop', 'my', 'reviews'] as const,
	public: (id: number) => ['shop', 'public', id] as const,
	publicById: (publicId: string) => ['shop', 'public-id', publicId] as const,
	parts: (id: number, filters: object) => ['shop', 'public', id, 'parts', filters] as const,
	publicPhotos: (id: number) => ['shop', 'public', id, 'photos'] as const,
	publicReviews: (id: number) => ['shop', 'public', id, 'reviews'] as const,
	list: (filters: object) => ['shop', 'list', filters] as const,
}

export const partKeys = {
	my: (filter: string, q?: string) => ['parts', 'my', filter, q] as const,
	mySummary: ['parts', 'my', 'summary'] as const,
	myDetail: (id: number) => ['parts', 'my', 'detail', id] as const,
}

export const catalogKeys = {
	search: (filters: object) => ['catalog', 'search', filters] as const,
	count: (filters: object) => ['catalog', 'count', filters] as const,
	detail: (id: number, car: object) => ['catalog', 'detail', id, car] as const,
	publicDetail: (publicId: string) => ['catalog', 'public', publicId] as const,
}

export const chatKeys = {
	all: ['chats'] as const,
	list: ['chats', 'list'] as const,
	unread: ['chats', 'unread'] as const,
	detail: (id: number) => ['chats', 'detail', id] as const,
	messages: (id: number) => ['chats', 'detail', id, 'messages'] as const,
	quickReplies: (id: number) => ['chats', 'detail', id, 'quick-replies'] as const,
}

export const marketKeys = {
	map: ['market', 'map'] as const,
	rows: ['market', 'rows'] as const,
	row: (id: number) => ['market', 'rows', id] as const,
	rowContainers: (id: number, brandId?: number) => ['market', 'rows', id, 'containers', brandId] as const,
	highlight: (params: object) => ['market', 'highlight', params] as const,
	route: (params: object) => ['market', 'route', params] as const,
	search: (q: string) => ['market', 'search', q] as const,
}

export const statsKeys = {
	shop: (period: 'WEEK' | 'MONTH') => ['stats', 'shop', period] as const,
}

export const serviceKeys = {
	types: ['services', 'types'] as const,
	estimate: (params: object) => ['services', 'estimate', params] as const,
	my: ['services', 'my'] as const,
	detail: (id: number) => ['services', 'detail', id] as const,
	offers: (id: number) => ['services', 'detail', id, 'offers'] as const,
	stats: (id: number) => ['services', 'detail', id, 'stats'] as const,
}

export const masterKeys = {
	all: ['master'] as const,
	profile: ['master', 'profile'] as const,
	feedAll: ['master', 'feed'] as const,
	feed: (filter: string) => ['master', 'feed', filter] as const,
	stats: (period: string) => ['master', 'stats', period] as const,
	public: (id: number) => ['master', 'public', id] as const,
	publicByLink: (publicId: string) => ['master', 'public', 'link', publicId] as const,
	reviews: (id: number) => ['master', 'public', id, 'reviews'] as const,
}

export const videoKeys = {
	feed: (params: object) => ['videos', 'feed', params] as const,
}

export const deliveryKeys = {
	all: ['delivery'] as const,
	tariffs: ['delivery', 'tariffs'] as const,
	list: (side: 'BUYER' | 'SHOP') => ['delivery', 'orders', side] as const,
	detail: (id: number) => ['delivery', 'order', id] as const,
}
