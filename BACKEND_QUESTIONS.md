# Вопросы и расхождения с бэкендом

Что нашли при подключении приложения. Формат: экран, что нужно, почему, что сделано на фронте временно (`// TODO(backend)` в коде).

## Открытые

### 1. `LocalTime` в схеме описан объектом, а приходит строкой
- **Где:** часы работы — `OpenStateDto.openFrom / openTo` ([07] «открыт до 17:00», [30], [11]), `CreateShop.openFrom / openTo`.
- **Факт:** API отдаёт `"openTo": "23:59:00"`, а в `/v3/api-docs` это `$ref: LocalTime` = объект `{hour, minute, second, nano}`. Сгенерированный тип не совпадает с данными.
- **Что сделано:** `formatHours` в `src/lib/format.ts` принимает и строку, и объект, помечено `TODO(backend)`.
- **Просьба:** описать `LocalTime` как `type: string, format: time, example: "17:00:00"` (например, `SpringDocUtils.getConfig().replaceWithSchema(LocalTime.class, …)`).

### 2. `carLabel` в «Моих запросах» — длиннее, чем в макете
- **Где:** [05] «Мои запросы».
- **Факт:** `GET /requests/my` → `carLabel: "Toyota Camry 50 · 2012"`. В макете — «Camry 50 · отправлен 12 мин назад» и «Колодки задние · Camry 50»: короткая подпись модели.
- **Сейчас:** показываем `carLabel` как есть; на узком экране строка длиннее макета, но не ломается.
- **Просьба:** добавить в `RequestSummaryDto` короткую подпись (`carShortLabel: "Camry 50"`) или `car {modelLabel, year}`, как в `RequestDetailDto`.

### 3. Нет распознавания техпаспорта
- **Где:** [04] кнопка «Сфотографировать техпаспорт».
- **Нужно:** `POST /ocr/registration` (multipart) → марка, модель/поколение, год, VIN — чтобы добавить машину по фото.
- **Сейчас:** кнопка ведёт на ручное добавление машины, помечено `TODO(backend)`.

### 4. Пуши на iOS: FCM-токена у приложения нет
- **Где:** регистрация устройства `POST /devices {token, platform}`.
- **Факт:** бэкенд шлёт через FCM (`FcmPushSender`). На Android `getDevicePushTokenAsync()` отдаёт FCM-токен — подходит. На iOS эта функция отдаёт **APNs-токен**, а FCM принимает только свой токен регистрации: чтобы его получить, в приложение нужно встроить Firebase SDK (`@react-native-firebase/messaging` + `GoogleService-Info.plist`).
- **Сейчас:** приложение шлёт токен как есть, `platform: IOS` — для iOS это APNs-токен.
- **Выбрать один вариант:**
  - (а) бэкенд для `platform = IOS` шлёт напрямую в APNs (ключ `.p8`, Team ID, Bundle ID `com.bekturillo.kudaibergenv2`) — в приложении ничего менять не нужно;
  - (б) добавляем Firebase в iOS-сборку — нужен Firebase-проект, `GoogleService-Info.plist` и загруженный в Firebase APNs-ключ.
- **Ещё нужно для обоих вариантов:** `google-services.json` для Android-сборки (FCM) — у фронта его нет.

### 5. Файлы для открытия ссылок `kudaibergen.kg/p/…`, `/s/…`, `/qr/…` в приложении
- **Где:** «Поделиться» [29, 30], QR-наклейки рядов и контейнеров.
- **Сделано в приложении:** маршруты `/p/{publicId}` → [29], `/s/{publicId}` → [30], `/m/{publicId}` → профиль мастера (путь `/m/` в контракте не назван — выбрала сама, подтвердите), `/qr/{token}` → маршрут к боксу [18]; в `app.json` — `associatedDomains: applinks:kudaibergen.kg` (iOS) и `intentFilters` с `autoVerify` (Android).
- **Нужно на сайте `kudaibergen.kg`:** `/.well-known/apple-app-site-association` (appID `<TeamID>.com.bekturillo.kudaibergenv2`, пути `/p/*`, `/s/*`, `/qr/*`, `/m/*`) и `/.well-known/assetlinks.json` (package `com.bekturillo.kudaibergenv2` + SHA-256 ключа подписи). Без них ссылки открываются в браузере.

### 7. Мелочи по услугам
- **В `payload` сообщения `REPLY` нет `requestId` / `serviceRequestId`** (контракт §8: «по нему подписать „по запросу …“»). Сейчас в чате 642 два отклика мастера по разным заявкам, а в `payload` только `{offerId, priceFrom, availableAt}`. Подпись «по заявке «…»» в приложении уже сделана и появится, как только поля начнут приходить.
- **Длительность видео у fragmented MP4 читается неверно.** Видео на 5 секунд, записанное браузером (`MediaRecorder`, `video/mp4;codecs=avc1`, это fragmented MP4), сохраняется с `durationSec: 1` — даже когда клиент передал `durationSec=5`. Похоже, длительность берётся из `mvhd`, а у fragmented-файла она там почти нулевая. Значит, лимит в 30 секунд таким файлом можно обойти. Телефоны пишут обычные MP4/MOV, но стоит считать длительность по фрагментам (`mehd`/`trun`) или через ffprobe.
- `GET /service-requests/estimate` → `label` «СТО и ремонт · Toyota»; в макете 36 фраза «Заявку получат **12 СТО**, которые чинят Toyota». Сейчас показываем «Заявку получат **1 мастер** · СТО и ремонт · Toyota». Если нужна фраза как в макете — пусть сервер отдаёт её целиком.
- `ServiceOfferDto.master` в ответе `POST /my/master/requests/{id}/offer` — `null` (в `/offers` заполнен). Фронту не мешает.

## Закрытые
- **Даты в событиях Centrifugo** (2baa64b) — теперь ISO, как в REST. Обход `normalizeDates` из приложения убран.
- **Видео в заявке на услугу** (0a7a02a) — `POST /media/videos`, `media[]` в заявке и ленте мастера. Подключено.
- **Услуги и роль «Мастер»** (раздел 12). Бэкенд реализовал: `/service-types`, `/service-requests/*`, `/my/master/*`, `/masters/*`, роль `MASTER`, `hasMaster`, `CarDto.engineVolume/fuel/origin`, чаты `as=MASTER`, `UNREAD.asMaster`, `SERVICE_REQUEST_STATS`, пуши `NEW_SERVICE_REQUEST`… Фронт подключён, заглушка удалена.
- **Поиск по-русски** («стойка», «стойки» → 0). Причина — база в локали C: кириллица не приводилась к нижнему регистру. Бэкенд переехал на базу в UTF-8 (9d1f93a) и предупреждает о локали при старте; «стойка» → 28, «колодки» → 16.
- **`CursorPage.nextCursor` nullable.** Исправлено: у всех `CursorPage*` `nextCursor: string | null`. Ручная обёртка `CursorPage<T>` убрана, списки типизируются сгенерированными `CursorPage*`.
- **`required` и `nullable` в OpenAPI** (бэкенд 0dec21d). Типы генерируются без `--properties-required-by-default`, ручные `Partial<>` убраны. `MeResponse.name / avatarUrl / adminRole / shop` — `T | null`, `id / phone` — нет; `ShopRef` сам не nullable. Остальные поля проверю по ходу экранов.
- **Новый пользователь.** Признак экрана 03 — `onboarded = false`, записано в контракт.
- **`ShopRef.status` / `role`** — енамы.
- **MinIO** вынесен в профиль `s3` (`docker compose --profile s3 up -d`), по умолчанию не нужен.
- **Формат ошибки.** Контракт приведён к RFC 7807 (`detail`, `errors[{field, message}]`, `retryAfter`, `attemptsLeft`, `missing[]`) — `src/lib/api.ts` разбирает именно его. Проверено: `OTP_COOLDOWN` (429, `Retry-After`), `OTP_INVALID` (`attemptsLeft`), `VALIDATION_ERROR` (`errors[]`), `REFRESH_TOKEN_INVALID` (401).
- **`hasShop` в `GET /me`.** Добавлен (и `shop {id, name, status, role}`). Продавец без бокса → [10а], с боксом → [11].
- **Коллизии имён схем.** Исправлены: `RecipientCounts` / `ShopCounts`, `Read` один.
- **Устаревший `INTEGRATION.md`.** Удалён из репозитория бэкенда.
- **`Accept-Language: ky`.** Бэкенд понимает и `ky`, и `kg`. Шлём `ru` / `ky`.
