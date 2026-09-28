// Демо-данные из макета. Значения совпадают с design/specs, чтобы вёрстка сходилась с эталоном.
// Всё, что показывают экраны, берётся отсюда — при подключении API меняется только этот слой.

export interface Car {
	id: string
	title: string
	subtitle: string
	/** Короткое имя для чипа в запросе. */
	short: string
	primary: boolean
}

export type RequestStatus = 'answered' | 'waiting' | 'closed'

export interface BuyerRequest {
	id: string
	title: string
	meta: string
	status: RequestStatus
	statusLabel: string
}

export interface SellerAnswer {
	id: string
	name: string
	rating: string
	place: string
	openLabel: string
	isOpen: boolean
	message: string | null
	primary: boolean
}

export interface ChatPreview {
	id: string
	initial: string
	name: string
	time: string
	meta: string
	last: string
	unread: number
	dimmed: boolean
}

export interface ChatMessage {
	id: string
	from: 'me' | 'them'
	text: string
}

export const currentUser = {
	name: 'Бакыт',
	phone: '+996 555 12 34 56',
	initial: 'Б',
	countryCode: '+996',
	localPhone: '555 12 34 56',
}

export const cars: Car[] = [
	{ id: 'camry', title: 'Toyota Camry 50', subtitle: '2012 · 2.5 бензин', short: 'Camry 50 · 2012', primary: true },
	{ id: 'fit', title: 'Honda Fit', subtitle: '2009 · 1.3', short: 'Fit · 2009', primary: false },
]

export const garage = {
	title: 'Мой гараж',
	hint: 'Выберете машину одним тапом при запросе',
	addLabel: 'Добавить машину',
	scanLabel: 'Сфотографировать техпаспорт',
	primaryBadge: 'Основная',
}

export const buyerRequests: BuyerRequest[] = [
	{
		id: 'struts',
		title: 'Стойки передние',
		meta: 'Camry 50 · отправлен 12 мин назад',
		status: 'answered',
		statusLabel: '3 ответили',
	},
	{
		id: 'headlight',
		title: 'Фара левая',
		meta: 'Honda Fit · отправлен 2 мин назад',
		status: 'waiting',
		statusLabel: 'Ждём ответов',
	},
	{
		id: 'pads',
		title: 'Колодки задние · Camry 50',
		meta: '',
		status: 'closed',
		statusLabel: 'Закрыт',
	},
]

/** Экран 06: форма запроса. */
export const searchForm = {
	partText: 'Стойки передние, пара',
	suggestions: ['+ Колодки', '+ Радиатор', '+ Фара'],
	audiences: ['Всему рынку', 'Ряду', 'Боксу'],
	recipientsCount: 43,
	recipientsBrand: 'Toyota',
}

/** Экран 07: запрос, по которому пришли ответы. */
export const activeRequest = {
	title: 'Стойки передние',
	car: 'Toyota Camry 50 · 2012',
	answersLabel: '3 продавца ответили «есть»',
	waitingLabel: 'ещё ждём',
}

export const sellerAnswers: SellerAnswer[] = [
	{
		id: 'azamat',
		name: 'Автодеталь Азамат',
		rating: '★ 4.8',
		place: 'Ряд 14 · Бокс 12 · ',
		openLabel: 'открыт до 17:00',
		isOpen: true,
		message: 'Есть KYB и оригинал, подходите посмотреть',
		primary: true,
	},
	{
		id: 'korea',
		name: 'Korea Plus',
		rating: '★ 4.6',
		place: 'Ряд Ж · Бокс 7 · ',
		openLabel: 'открыт до 18:00',
		isOpen: true,
		message: 'Есть дубликат, 3 200 за штуку',
		primary: false,
	},
	{
		id: 'erlan',
		name: 'Эрлан шрот',
		rating: '★ 4.3',
		place: 'Ряд Ю · Бокс 20 · ',
		openLabel: 'закрыт',
		isOpen: false,
		message: null,
		primary: false,
	},
]

export const chats: ChatPreview[] = [
	{
		id: 'azamat',
		initial: 'А',
		name: 'Автодеталь Азамат',
		time: '9:38',
		meta: 'Стойки передние · Ряд 14 · Бокс 12',
		last: 'Хорошо, отложил. Жду',
		unread: 2,
		dimmed: false,
	},
	{
		id: 'korea',
		initial: 'K',
		name: 'Korea Plus',
		time: '9:20',
		meta: 'Стойки передние · Ряд Ж · Бокс 7',
		last: 'Вы: Спасибо, пока смотрю',
		unread: 0,
		dimmed: false,
	},
	{
		id: 'remni',
		initial: 'М',
		name: 'Мир Ремней',
		time: 'вчера',
		meta: 'Колодки задние · запрос закрыт',
		last: 'Спасибо за покупку!',
		unread: 0,
		dimmed: true,
	},
]

/** Экран 08: чат покупателя с продавцом. */
export const buyerChat = {
	sellerName: 'Автодеталь Азамат',
	sellerPlace: 'Ряд 14 · Бокс 12 · ',
	sellerOnline: 'в сети',
	requestLabel: 'Запрос',
	requestTitle: 'Стойки передние · Camry 50',
	messages: [
		{ id: 'm1', from: 'them', text: 'Есть KYB и оригинал, подходите посмотреть' },
		{ id: 'm2', from: 'me', text: 'Отложите KYB, буду через час' },
		{ id: 'm3', from: 'them', text: 'Хорошо, отложил. Жду' },
	] satisfies ChatMessage[],
	note: 'Оплата в боксе при осмотре',
	quickReplies: { route: 'Как пройти к боксу', close: 'Купил — закрыть запрос' },
	composerPlaceholder: 'Сообщение',
}

/** Экран 13: тот же диалог со стороны продавца. */
export const sellerChat = {
	buyerName: 'Бакыт',
	requestTitle: 'Стойки передние · Camry 50',
	messages: [
		{ id: 'm1', from: 'me', text: 'Есть KYB и оригинал, подходите посмотреть' },
		{ id: 'm2', from: 'them', text: 'Отложите KYB, буду через час' },
	] satisfies ChatMessage[],
	quickReplies: ['Отложил для вас', 'Как пройти'],
	soldLabel: 'Продано',
	composerPlaceholder: 'Сообщение',
}

/** Экран 09: закрытие запроса и оценка. */
export const closeRequest = {
	title: 'Запрос закрыт',
	description: 'Остальные продавцы больше его не видят. Как прошло у Автодеталь Азамат?',
	rating: 4,
	tags: ['Быстро ответил', 'Деталь как надо', 'Легко найти бокс'],
	submitLabel: 'Готово',
}

/** Экран 20: ответов нет и пропала сеть. */
export const emptyState = {
	offlineBanner: 'Нет сети. Покажем ответы, когда появится',
	requestTitle: 'Балка задняя',
	requestCar: 'Honda Fit · 2009',
	title: 'Пока никто не ответил',
	description: 'Запрос видели 12 продавцов ряда 28. Отправьте всему рынку — деталь редкая.',
	primaryAction: 'Отправить всему рынку',
	secondaryAction: 'Закрыть запрос',
}

/** Экран 15: карта рынка и фильтр по марке. */
export const marketScreen = {
	searchPlaceholder: 'Ряд, бокс или магазин',
	filters: ['Ряды', 'Магазины', 'Парковка', 'Туалет'],
	modes: ['Марка', 'Запчасть'],
	brands: ['Mercedes-Benz', 'Toyota', 'Lexus', 'Honda', 'BMW'],
	/** Ряды из market-map.json, где есть выбранная марка. */
	brandRows: ['Ряд 14', 'Ряд 8', 'Ряд Ц', 'Ряд Н', 'С', 'Ш'],
	summaryTitle: 'Mercedes-Benz — в 6 рядах',
	summaryMeta: '21 бокс · ближайший ряд 14, 170 м',
	listLink: 'Списком',
	legend: [
		{ label: 'Проход', background: '#FFF7E0', border: '#E3C88A', radius: 0, width: 1 },
		{ label: 'Есть Mercedes', background: '#EDF2FF', border: '#2155E6', radius: 2, width: 1.5 },
		{ label: 'Ряд', background: '#DCE3EE', border: '#BCC6D5', radius: 2, width: 1 },
	],
	/** Позиция пользователя в координатах схемы рынка. */
	userPosition: { x: 584, y: 125 },
}

/** Экран 18: маршрут до бокса. */
export const routeToBox = {
	title: 'Ряд 14 · Бокс 12',
	subtitle: 'Автодеталь Азамат · северная сторона',
	time: '1 мин',
	distance: '· 50 м пешком',
	steps: [
		'Прямо по центральному проходу ~15 м',
		'Направо — между рядами 16 и 14',
		'Через ~35 м бокс 12 по левую руку',
	],
	actions: { message: 'Написать', arrived: 'Я на месте' },
	userPosition: { x: 584, y: 540 },
	points: [
		[584, 540],
		[584, 615],
		[470, 615],
		[470, 630],
	] as [number, number][],
	target: { x: 470, y: 652, label: '12' },
}

/** Экран 10а: выбор ряда и контейнера при регистрации продавца. */
export const boxSelection = {
	step: 'Шаг 1 из 2',
	title: 'Где ваш бокс?',
	rows: ['18', '16', '14', '12', '10', '8', '6', '4', '1', 'З', 'Ю', 'Я', 'С', 'Ж', 'Д', 'В', 'А', 'Ш', 'Ц', 'Л', 'Н', 'Х', 'У'],
	mapLabel: 'Карта',
	selectedRow: '14',
	selectedBox: 12,
	sides: [
		{ id: 'north', label: 'Северная сторона', boxes: [9, 10, 11, 12, 13, 14, 15] },
		{ id: 'south', label: 'Южная сторона', boxes: [9, 10, 11, 12, 13, 14, 15] },
	],
	takenBoxes: [13],
	hint: 'Серый номер — бокс уже занят другим продавцом в приложении',
}

/** Экраны 10 и 21: бокс продавца. */
export const sellerBox = {
	name: 'Автодеталь Азамат',
	place: 'Ряд 14 · Бокс 12 · северная',
	placeShort: 'Ряд 14 · Бокс 12',
	rowLabel: 'Ряд 14',
	boxNumber: 12,
	hours: '08:00–17:00',
	rating: '★ 4.8',
	reviews: 126,
	sellersInBox: 2,
	isOpen: false,
	closedHint: 'Запросы не приходят. Откроется в 08:00',
	openHint: 'Запросы приходят',
	brands: [
		{ label: 'Toyota', selected: true },
		{ label: 'Lexus', selected: true },
		{ label: 'Honda', selected: false },
		{ label: 'Nissan', selected: false },
	],
	categories: [
		{ label: 'Ходовая', selected: true },
		{ label: 'Тормоза', selected: true },
		{ label: 'Двигатель', selected: false },
		{ label: 'Оптика', selected: false },
	],
}

/** Экран 11: входящие запросы продавцу. */
export const incomingRequests = [
	{ id: 'struts', title: 'Стойки передние', meta: 'Toyota Camry 50 · 2012 · пара', ago: '2 мин', answered: false },
	{ id: 'pads', title: 'Колодки задние', meta: 'Lexus RX 350 · 2010 · есть фото', ago: '9 мин', answered: false },
	{ id: 'radiator', title: 'Радиатор · Prius 30', meta: '', ago: '', answered: true },
]

export const requestsScreen = {
	title: 'Запросы',
	openLabel: 'Бокс открыт',
	closedLabel: 'Бокс закрыт',
	yesLabel: 'Есть',
	noLabel: 'Нет',
	answeredLabel: 'Вы ответили «есть»',
}

/** Экран 12: ответ «Есть». */
export const answerForm = {
	requestTitle: 'Стойки передние',
	requestMeta: 'Camry 50 · 2012 · Бакыт',
	conditions: ['Новое', 'Б/У', 'Под заказ'],
	messageLabel: 'Сообщение покупателю',
	message: 'Есть KYB и оригинал, подходите посмотреть',
	priceLabel: 'Цена · по желанию',
	pricePlaceholder: 'сом',
	submitLabel: 'Отправить «Есть»',
}

/** Экран 17: статистика продавца. */
export const sellerStats = {
	periods: ['Неделя', 'Месяц'],
	total: 128,
	answered: 46,
	chats: 31,
	sales: 19,
	missed: 22,
	missedHint: 'бокс был открыт, но вы не ответили',
	missedAction: 'Смотреть',
	avgReplyLabel: 'Среднее время ответа',
	avgReply: '4 мин',
	topPartsLabel: 'Чаще всего спрашивают',
	topParts: [
		{ label: 'Стойки, амортизаторы', count: 24, ratio: 1 },
		{ label: 'Колодки', count: 19, ratio: 0.79 },
		{ label: 'Фары', count: 12, ratio: 0.5 },
		{ label: 'Радиаторы', count: 9, ratio: 0.38 },
	],
}

/** Экраны 19 и 21: пункты профиля. */
export const buyerProfileMenu = {
	garage: '2 машины ›',
	history: '14 ›',
	favorites: '3 ›',
	theme: 'Тёмная ›',
}

export const sellerProfileMenu = {
	box: '›',
	reviews: '126 ›',
	sellers: '2 ›',
}

/** Экран 14: как выглядят пуши. */
export const pushNotifications = [
	{
		id: 'new-request',
		source: 'КУДАЙБЕРГЕН · ПРОДАВЦУ',
		time: 'сейчас',
		title: 'Новый запрос: стойки передние',
		body: 'Toyota Camry 50 · 2012 · пара',
		actions: ['Есть', 'Нет'],
	},
	{
		id: 'answer',
		source: 'КУДАЙБЕРГЕН · ПОКУПАТЕЛЮ',
		time: '2 мин',
		title: 'Автодеталь Азамат: есть',
		body: 'Ряд 14 · Бокс 12 — «Есть KYB и оригинал»',
		actions: null,
	},
	{
		id: 'chat',
		source: 'КУДАЙБЕРГЕН · ЧАТ',
		time: '5 мин',
		title: 'Бакыт',
		body: 'Отложите KYB, буду через час',
		actions: null,
	},
]

export const pushScreen = {
	time: '9:41',
	date: 'вторник, 25 августа',
}

/** Экран 22: обзор бокса — аватар, локация, фото места, марки. */
export const boxOverview = {
	name: 'Автодеталь Азамат',
	rating: '★ 4.8 · 126 отзывов',
	changeAvatar: 'Сменить аватар',
	rowLabel: sellerBox.rowLabel,
	boxNumber: String(sellerBox.boxNumber),
	side: 'Северная сторона',
	change: 'Изменить',
	photosLabel: 'Фото места',
	photosCount: '3 из 8',
	coverLabel: 'Обложка',
	photoActions: { camera: 'Сфотать', gallery: 'Из галереи' },
	brandsLabel: 'Марки, которые продаю',
	brandSlugs: ['toyota', 'lexus', 'mercedes-benz', 'bmw'],
	moreBrands: 2,
	changeBrands: 'Изменить ›',
}

/** Экран 23: марки, которые продаёт продавец. */
export const sellerBrandsScreen = {
	title: 'Марки, которые продаю',
	searchPlaceholder: 'Найти марку',
	hint: 'Запросы будут приходить только по этим маркам. Логотипы видят покупатели в вашем профиле.',
	popularLabel: 'Популярные',
	popularSlugs: ['toyota', 'lexus', 'mercedes-benz', 'bmw'],
	selectedSlugs: ['toyota', 'lexus', 'mercedes-benz', 'bmw'],
	otherSlugs: ['honda', 'nissan', 'hyundai', 'kia'],
	allLabel: 'Все марки А–Я',
	azList: ['Audi', 'Chevrolet', 'Daewoo', 'Ford'],
	submitLabel: 'Сохранить · 4 марки',
}

/** Экран 24: мои запчасти (вкладка «Товары»). */
export interface SellerPart {
	id: string
	title: string
	car: string
	brandSlug: string | null
	price: string
	available: boolean
	stock: 'in' | 'out'
}

export const sellerParts: SellerPart[] = [
	{ id: 'struts', title: 'Стойка передняя KYB, левая', car: 'Camry 50', brandSlug: null, price: '3 200 сом', available: true, stock: 'in' },
	{ id: 'disc', title: 'Тормозной диск передний', car: 'Camry 40–50', brandSlug: null, price: '2 800 сом', available: true, stock: 'in' },
	{ id: 'headlight', title: 'Фара левая, галоген', car: 'W211', brandSlug: null, price: '7 500 сом', available: true, stock: 'in' },
	{ id: 'filter', title: 'Фильтр масляный', car: 'E90', brandSlug: 'bmw', price: '650 сом', available: false, stock: 'out' },
]

export const myPartsScreen = {
	title: 'Мои запчасти',
	searchPlaceholder: 'Поиск по моим запчастям',
	filters: [
		{ label: 'Все · 38', value: 'all' },
		{ label: 'В наличии · 32', value: 'in' },
		{ label: 'Нет · 6', value: 'out' },
	],
	viewsLabel: 'Покупатели посмотрели ваши запчасти',
	viewsCount: '214 раз',
	viewsSuffix: 'за неделю',
	fabLabel: 'Выложить запчасть',
}

/** Экран 25: камера съёмки запчасти. */
export const cameraScreen = {
	title: 'Фото запчасти',
	count: '3 из 6',
	hint: 'Деталь целиком, на светлом фоне',
	modes: ['Деталь', 'Номер детали', 'Бокс'],
	activeMode: 1,
	doneLabel: 'Готово',
}

/** Экран 26: новая запчасть. */
export const newPartForm = {
	title: 'Новая запчасть',
	draftLabel: 'Черновик',
	nameLabel: 'Название',
	name: 'Стойка передняя KYB, левая',
	fitLabel: 'Подходит к машинам',
	fits: ['Camry 40–50', 'ES 2007–12'],
	addCar: 'Машина',
	categoryLabel: 'Категория',
	category: 'Ходовая',
	conditionLabel: 'Состояние',
	conditions: ['Новое', 'Б/У', 'Под заказ'],
	condition: 0,
	priceLabel: 'Цена',
	price: '3 200',
	priceSuffix: 'сом',
	qtyLabel: 'Сколько штук',
	qty: 2,
	submitLabel: 'Опубликовать',
}

/** Экран 27: каталог запчастей покупателя. */
export const catalogScreen = {
	title: 'Поиск запчастей',
	searchValue: 'стойки',
	carsLabel: 'Ищу для машины',
	categories: ['Все', 'Ходовая', 'Тормоза', 'Оптика', 'Двигатель'],
	activeCategory: 0,
	resultsCount: '24 запчасти',
	forCar: 'для Camry 50',
	sort: 'Дешевле ▾',
	items: [
		{ id: 'struts-kyb', price: '3 200 сом', title: 'Стойка передняя KYB, левая', fits: true, location: 'Ряд 14 · Бокс 12' },
		{ id: 'struts-analog', price: '2 900 сом', title: 'Стойка передняя, правая, аналог', fits: true, location: 'Ряд Ц · Бокс 4' },
		{ id: 'struts-rear', price: '5 800 сом', title: 'Стойки задние, пара, оригинал', fits: true, location: 'Ряд 8 · Бокс 21' },
		{ id: 'strut-bearing', price: '1 400 сом', title: 'Опорный подшипник стойки', fits: true, location: 'Ряд 14 · Бокс 3' },
	],
	notFoundText: 'Не нашли? Спросите весь рынок',
	notFoundAction: 'Спросить →',
}

/** Экран 28: выбор марки для каталога. */
export const pickBrandScreen = {
	title: 'Марка авто',
	searchPlaceholder: 'Марка или модель',
	popularLabel: 'Популярные',
	popularSlugs: ['toyota', 'lexus', 'mercedes-benz', 'bmw', 'honda', 'nissan', 'hyundai', 'kia'],
	selectedSlug: 'mercedes-benz',
	allLabel: 'Все марки А–Я',
	sheet: {
		title: 'Mercedes-Benz',
		subtitle: 'Выберите модель или пропустите',
		models: ['C-класс W204', 'E-класс W211', 'E-класс W212', 'S-класс W221', 'ML W164', 'Sprinter', 'Vito'],
		activeModel: 1,
		allModels: 'Все модели',
		showLabel: 'Показать 86',
	},
	addToGarage: 'Добавить эту машину в',
	addToGarageStrong: 'Мой гараж',
}

/** Экран 29: карточка запчасти. */
export const partCard = {
	photosCount: '1 / 4',
	price: '3 200 сом',
	title: 'Стойка передняя KYB, левая',
	fitsCar: 'к вашей Camry 50 · 2012',
	condition: { label: 'Состояние', value: 'Новое' },
	stock: { label: 'В наличии', value: '2 шт' },
	seller: {
		name: 'Автодеталь Азамат',
		meta: '★ 4.8 · Ряд 14 · Бокс 12 · ',
		openLabel: 'открыт',
	},
	actions: { route: 'Как пройти', message: 'Написать' },
}

/** Экран 30: профиль продавца для покупателя. */
export const sellerProfileForBuyer = {
	photosCount: '1 / 5',
	openLabel: '● Открыто до 17:00',
	name: 'Автодеталь Азамат',
	rating: '★ 4.8 · 126 отзывов',
	rowLabel: sellerBox.rowLabel,
	boxNumber: String(sellerBox.boxNumber),
	side: 'Северная сторона',
	onMap: 'На карте',
	brandsLabel: 'Продаёт для марок',
	brandSlugs: ['toyota', 'lexus', 'mercedes-benz', 'bmw'],
	moreBrands: 1,
	actions: { message: 'Написать', route: 'Маршрут' },
	tabs: { parts: 'Запчасти 38', photos: 'Фото 5', reviews: 'Отзывы 126' },
	items: [
		{ id: 'struts-kyb', price: '3 200 сом', title: 'Стойка передняя KYB, левая', fits: true, location: 'Ряд 14 · Бокс 12' },
		{ id: 'disc', price: '2 800 сом', title: 'Тормозной диск передний', fits: true, location: 'Ряд 14 · Бокс 12' },
	],
}
