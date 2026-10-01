# API для новых экранов (выдержка из BACKEND_SPEC.md)

Бэкенд уже реализован в ветке v2; пути у бэкенда `/my/...`, `/me/...`, живые события — Centrifugo, канал `inbox:{userId}#{userId}`, событие `REQUEST_STATS`. Если путь или поле здесь расходится с OpenAPI бэкенда — верен OpenAPI.

### 3.7а Адресаты, время и статистика запроса [06б, 31, 32]

**Новые поля PartRequest**
| поле | тип | правило |
| --- | --- | --- |
| target | RequestTarget | MARKET / ROWS / CONTAINERS |
| targetRowIds | uuid[] | при ROWS, 1–10 рядов |
| targetContainerIds | uuid[] | при CONTAINERS, 1–30 контейнеров |
| duration | RequestDuration | по умолчанию MIN_30 |
| expiresAt | timestamptz | createdAt + duration; END_OF_DAY = 17:00 сегодня (если уже позже — +3 часа) |
| extendedTimes | smallint | сколько раз продлён, максимум 3 |

**Кому уходит запрос**
- MARKET: все магазины ACTIVE, не закрытые, в рабочее время, у кого марка машины есть в ShopBrand.
- ROWS: то же, но только магазины в выбранных рядах.
- CONTAINERS: магазины в выбранных контейнерах, **без фильтра по марке** (покупатель выбрал сам); если марки нет у магазина — фронт показывает предупреждение при выборе. Закрытые и непроверенные исключаются всегда.
- `GET /requests/estimate?carId=&target=&rowIds=&containerIds=` → `{recipients: 18, brand: "Toyota"}` — текст «Запрос получат 18 продавцов…» обновляется при каждом изменении выбора.
- Для экрана 31: `GET /market/rows/{id}/containers?brandId=` → каждому контейнеру `state: HAS_SELLER | NO_SELLER`, `sellsBrand: bool`; счётчик «продают Toyota: 9».

**Время активности**
- До `expiresAt` продавцы видят запрос с таймером «осталось 12 мин» и могут ответить. После — ответить нельзя (409), запрос у продавцов уходит в «Истёкшие».
- Покупатель может продлить: `POST /requests/{id}/extend {minutes: 30|60|180}` — до 3 раз; или расширить адресатов: `POST /requests/{id}/widen {target: MARKET}` — новые адресаты получают пуш, срок отсчитывается заново.
- Планировщик раз в минуту переводит просроченные в EXPIRED и шлёт покупателю пуш «Время вышло: 3 ответа. Продлить?».

**RequestRecipient (статистика)**
| поле | тип |
| --- | --- |
| requestId, shopId | FK, PK пары |
| rowId, containerId | FK (денормализовано для отчёта) |
| status | RecipientStatus |
| deliveredAt | timestamptz |
| seenAt? | timestamptz — продавец открыл карточку запроса или нажал на пуш (`POST /seller/requests/{id}/seen`) |
| answeredAt? | timestamptz |

**Статистика для покупателя** `GET /requests/{id}/stats` →
```json
{ "status": "ACTIVE", "expiresAt": "…", "durationMin": 30, "remainingMin": 18, "canExtend": true,
  "counts": { "delivered": 18, "seen": 14, "have": 3, "notHave": 7, "silent": 4 },
  "have":    [{ "shop": {…name, avatarUrl}, "row": "14", "container": "12", "answeredAt": "…", "price": 3200, "chatId": "…" }],
  "notHave": [{ "row": "14", "container": "1" }, { "row": "Ц", "container": "3" }] }
```
- «Ещё не ответили» = delivered − have − notHave (включая посмотревших).
- «Есть» — сортировка по времени ответа; «Нет» — только ряд и контейнер, без названия магазина.
- Обновление в реальном времени: STOMP `/topic/requests/{id}/stats`.


## 12. Заявки на услуги и роль «Мастер» [05б, 33–39]

Отдельный поток рядом с запросами на запчасти: покупатель описывает проблему с машиной, заявку получают мастера нужной услуги, которые работают с этой маркой и страной машины; они отвечают «Могу помочь» или «Не моё». Механика времени, продления и статистики — та же, что у запросов (раздел 3.7а).

### 12.1 Енамы
```java
enum UserRole { BUYER, SELLER, MASTER, ADMIN }                       // + MASTER

enum ServiceType {                                                   // плитки [33, 38], порядок как в макете
    CAR_REPAIR,      // СТО и ремонт
    TIRE_SERVICE,    // Шиномонтаж
    LPG,             // ГБО
    TOW_TRUCK,       // Эвакуатор
    CAR_WASH,        // Автомойка
    AUTO_ELECTRIC,   // Автоэлектрик
    BODY_PAINT,      // Кузов и покраска
    DIAGNOSTICS,     // Диагностика
    OIL_CHANGE,      // Замена масла
    WHEEL_ALIGNMENT, // Развал-схождение
    TINTING,         // Тонировка
    MOBILE_MASTER    // Выездной мастер
}
enum CarOrigin      { JAPAN, USA, EUROPE, KOREA, UAE, UNKNOWN }      // «японец / американец / европеец / кореец / эмиратец / не знаю» [35]
enum FuelType       { PETROL, DIESEL, LPG_PETROL, HYBRID, ELECTRIC } // [35]
enum ServiceWhen    { NOW, TODAY, TOMORROW, AT_TIME }                // «Сейчас / Сегодня / Завтра / Время…» [36]
enum ServiceWhere   { I_COME, MASTER_COMES, PICKUP_POINT }           // поеду сам / мастер выезжает / эвакуатор забирает
enum OfferAnswer    { CAN_HELP, NOT_MINE }                           // «Могу помочь» / «Не моё» [39]
```
`ServiceType` лучше хранить справочником `service_type(code, name_ru, name_kg, icon, sort, needs_location)` — список будут расширять; `needs_location = true` для TOW_TRUCK, MOBILE_MASTER (обязательна точка на карте).

### 12.2 Машина: новые поля
`Car` (гараж) и снимок машины в заявке получают: `engineVolume numeric(2,1)` (1.5, 2.5…), `fuel FuelType`, `origin CarOrigin`. Если выбрана машина из гаража — всё подставляется одним тапом [34]; иначе марка → модель → год → объём → топливо → страна [34–35], и после отправки предлагаем «Сохранить в гараж».

### 12.3 MasterProfile — мастер / СТО [38]
| поле | тип | где |
| --- | --- | --- |
| id | PK | |
| ownerId | FK User | |
| name | varchar(60) | «СТО «Ходовик»», «Мастер Эрлан» [37] |
| avatarUrl, photos[] | до 8 фото работ/места | |
| services | ServiceType[] (≥1) | «Что делаю» |
| brandIds | FK[] или `allBrands=true` | «Марки» / «Все марки» |
| origins | CarOrigin[] (пусто = все) | «Откуда машины» |
| address, lat, lng | | «ул. Садыгалиева 41, бокс 3» |
| radiusKm | smallint, 1–30, по умолч. 5 | «в радиусе 5 км» |
| isMobile | boolean | «Выезжаю к клиенту» |
| openFrom / openTo, isAccepting | | «● Принимаю» [39] |
| rating, reviewsCount | | «★ 4.9 · 212 отзывов» |
| status | ShopStatus (PENDING/ACTIVE/BLOCKED) | проверка админом |
| containerId? | FK | если мастер работает на рынке |

Один пользователь может быть и продавцом, и мастером (две сущности, переключение режима в профиле). Вкладки мастера: **Заявки · Чаты · Статистика · Профиль**.

### 12.4 ServiceRequest — заявка [33–36]
| поле | тип | правило |
| --- | --- | --- |
| id, buyerId | | |
| service | ServiceType | шаг 1 |
| carId? | FK | если из гаража |
| brandId, modelId, year, engineVolume, fuel, origin | снимок машины | шаги 2–3, копируются даже при carId |
| description | varchar(500) | «Что случилось», ≥ 10 символов |
| mediaIds | ≤ 5 фото/видео (видео ≤ 30 с) | |
| when | ServiceWhen + `atTime?` | |
| where | ServiceWhere + `lat, lng, address?` | обязательно, если `service.needs_location` |
| radiusKm | по умолч. 5 | |
| duration, expiresAt, extendedTimes, status | как у PartRequest | по умолч. 30 мин; для TOW_TRUCK — 15 мин и пометка «Срочно» |

**Кому уходит заявка:** MasterProfile ACTIVE и `isAccepting`, в рабочее время, `service ∈ services`, марка ∈ brandIds (или allBrands), `origin ∈ origins` (или origins пусто, или origin = UNKNOWN), расстояние от мастера до клиента ≤ min(radiusKm заявки, radiusKm мастера) — для `isMobile` считается до точки клиента, иначе до адреса мастера от точки клиента.
`GET /service-requests/estimate?…` → `{recipients: 12, label: "СТО, которые чинят Toyota"}` [36].

### 12.5 Отклик мастера [37, 39]
`ServiceOffer(id, requestId, masterId, answer OfferAnswer, priceFrom?, availableAt?, message?, createdAt)` + `ServiceRecipient(requestId, masterId, deliveredAt, seenAt?, status)` — как `RequestRecipient`.
- «Могу помочь» → шторка: цена «от», когда могу (сегодня 15:00 / через 1 час / выбрать), сообщение → клиенту пуш, открывается чат.
- Клиент видит отклики CAN_HELP: аватар, имя, рейтинг, расстояние / «выезд», цена от, «сегодня 15:00», текст, «Позвонить», «Написать». Сверху статистика: Получили / Посмотрели / Могут / Не их профиль + таймер.
- Закрытие заявки — «Договорились» с выбором мастера + оценка, как у запросов.

### 12.6 Эндпоинты
| метод | путь | экран |
| --- | --- | --- |
| GET | `/service-types` | 33, 38 |
| GET | `/service-requests/estimate` | 36 |
| POST | `/service-requests` | 36 |
| GET | `/service-requests/my`, `/service-requests/{id}`, `/service-requests/{id}/stats` | 05б, 37 |
| POST | `/service-requests/{id}/extend`, `/widen` (радиус +5 км), `/close` | 37 |
| POST/PATCH | `/my/master` (создать / изменить профиль мастера) | 38 |
| GET | `/my/master/requests` | 39 |
| POST | `/my/master/requests/{id}/seen`, `/my/master/requests/{id}/offer` | 39 |
| GET | `/my/master/stats?period=` | вкладка «Статистика» |
