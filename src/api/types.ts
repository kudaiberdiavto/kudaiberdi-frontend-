// Friendly aliases over the generated OpenAPI schema. Never describe DTOs by
// hand — regenerate `schema.ts` with `npm run api:types` when the backend changes.
import type { components, paths } from './schema'

type Schemas = components['schemas']

// ─── Auth & me ───────────────────────────────────────────────────────────────
export type TokenResponse = Schemas['TokenResponse']
export type SendOtpResponse = Schemas['SendOtpResponse']
export type Me = Schemas['MeResponse']
export type UserRole = NonNullable<Me['role']>
export type Lang = NonNullable<Me['lang']>
export type Settings = Schemas['SettingsResponse']
export type UpdateMeBody = Schemas['UpdateMeRequest']
export type UpdateSettingsBody = Schemas['UpdateSettingsRequest']
export type ShopRef = Schemas['ShopRef']
export type RealtimeToken = Schemas['Token']

// ─── Directory & garage ──────────────────────────────────────────────────────
export type Brand = Schemas['BrandDto']
export type CarModel = Schemas['ModelDto']
export type ModelSearchItem = Schemas['ModelSearchItem']
export type Category = Schemas['CategoryDto']
export type Car = Schemas['CarDto']
export type CreateCarBody = Schemas['CreateCarRequest']
export type UpdateCarBody = Schemas['UpdateCarRequest']

// ─── Media ───────────────────────────────────────────────────────────────────
export type Photo = Schemas['PhotoDto']
export type Voice = Schemas['VoiceDto']
export type VoiceUpload = Schemas['VoiceUploadDto']
export type ReplyDraft = Schemas['ReplyDraftDto']
export type OfferDraft = Schemas['OfferDraftDto']
export type TechPassport = Schemas['TechPassportDto']
export type MediaPurpose = NonNullable<
	NonNullable<paths['/api/v1/media/photos']['post']['parameters']['query']>['purpose']
>

// ─── Requests (buyer) ────────────────────────────────────────────────────────
export type PartHint = Schemas['PartHintDto']
export type RecipientsEstimate = Schemas['RecipientsEstimateDto']
export type CreateRequestBody = Schemas['CreateRequest']
export type RequestTarget = NonNullable<CreateRequestBody['target']>
export type RequestDuration = NonNullable<CreateRequestBody['duration']>
export type RequestSummary = Schemas['RequestSummaryDto']
export type RequestSummaryPage = Schemas['CursorPageRequestSummaryDto']
export type RequestState = NonNullable<RequestSummary['state']>
export type RequestStatus = NonNullable<RequestSummary['status']>
export type RequestDetail = Schemas['RequestDetailDto']
export type Reply = Schemas['ReplyDto']
export type RequestStats = Schemas['RequestStatsDto']
export type RecipientCounts = Schemas['RecipientCounts']
export type RequestHave = Schemas['Have']
export type WidenResult = Schemas['WidenResultDto']
export type CloseRequestBody = Schemas['CloseRequest']
export type ReviewTag = Schemas['ReviewTagDto']

// ─── Incoming requests (seller) ──────────────────────────────────────────────
export type IncomingRequest = Schemas['IncomingRequestDto']
export type IncomingRequestPage = Schemas['CursorPageIncomingRequestDto']
export type IncomingFilter = NonNullable<
	NonNullable<paths['/api/v1/my/shop/requests']['get']['parameters']['query']>['filter']
>
export type ReplyBody = Schemas['Reply']
export type PartCondition = NonNullable<ReplyBody['condition']>

// ─── Parts: seller's catalog [24–26] and search [27–30] ────────────────────
export type MyPartItem = Schemas['MyPartItemDto']
export type MyPartsPage = Schemas['CursorPageMyPartItemDto']
export type MyPartsSummary = Schemas['MyPartsSummaryDto']
export type MyPartsFilter = NonNullable<NonNullable<paths['/api/v1/my/parts']['get']['parameters']['query']>['filter']>
export type PartDetail = Schemas['PartDetailDto']
export type PartInput = Schemas['PartInput']
export type FitmentInput = Schemas['FitmentInput']
export type Fitment = Schemas['FitmentDto']
export type OemRecognition = Schemas['OemRecognitionDto']
export type PartCard = Schemas['PartCardDto']
export type PartSearchResult = Schemas['PartSearchResultDto']
export type AppliedCar = Schemas['AppliedCarDto']

// ─── Chats ───────────────────────────────────────────────────────────────────
export type Chat = Schemas['ChatDto']
export type ChatListItem = Schemas['ChatListItemDto']
export type ChatListPage = Schemas['CursorPageChatListItemDto']
export type ChatMessage = Schemas['MessageDto']
export type MessagePage = Schemas['CursorPageMessageDto']
export type SendMessageBody = Schemas['SendMessage']
export type QuickReply = Schemas['QuickReplyDto']
export type Unread = Schemas['UnreadDto']

// ─── Market ──────────────────────────────────────────────────────────────────
export type MarketRow = Schemas['RowDto']
export type RowDetail = Schemas['RowDetailDto']
export type ContainerSlot = Schemas['ContainerSlotDto']
export type MapHighlight = Schemas['MapHighlightDto']
export type MarketRoute = Schemas['RouteDto']
export type MarketSearch = Schemas['MarketSearchDto']
export type QrResolve = Schemas['QrResolveDto']

// ─── Shops ───────────────────────────────────────────────────────────────────
export type ShopCard = Schemas['ShopCardDto']
export type ShopCardPage = Schemas['CursorPageShopCardDto']
export type MyShop = Schemas['MyShopDto']
export type ShopStats = Schemas['ShopStatsDto']
export type ShopPhoto = Schemas['ShopPhotoDto']
export type ShopPublic = Schemas['ShopPublicDto']
export type ShopReview = Schemas['ReviewDto']
export type ReviewPage = Schemas['CursorPageReviewDto']
export type Verification = Schemas['VerificationDto']

// ─── Services & masters [05б, 33–39] ─────────────────────────────────────────
export type ServiceType = Schemas['ServiceTypeDto']
export type ServiceCar = Schemas['ServiceCarDto']
export type CreateServiceRequestBody = Schemas['CreateServiceRequest']
export type ServiceRequestDetail = Schemas['ServiceRequestDetailDto']
export type ServiceRequestSummary = Schemas['ServiceRequestSummaryDto']
export type ServiceRequestSummaryPage = Schemas['CursorPageServiceRequestSummaryDto']
export type ServiceEstimate = Schemas['ServiceEstimateDto']
export type ServiceOffer = Schemas['ServiceOfferDto']
export type MasterCard = Schemas['MasterCardDto']
export type ServiceStats = Schemas['ServiceStatsDto']
export type MyMaster = Schemas['MyMasterDto']
export type CreateMasterBody = Schemas['CreateMaster']
export type UpdateMasterBody = Schemas['UpdateMaster']
export type MasterFeedItem = Schemas['MasterFeedItemDto']
export type MasterFeedPage = Schemas['CursorPageMasterFeedItemDto']
export type MasterStats = Schemas['MasterStatsDto']
export type MasterOfferBody = Schemas['Offer']
export type CarOrigin = ServiceCar['origin']
export type FuelType = NonNullable<ServiceCar['fuel']>
export type ServiceWhen = ServiceRequestDetail['when']
export type ServiceWhere = ServiceRequestDetail['where']
export type ServiceDuration = ServiceRequestDetail['duration']
export type ServiceRequestState = ServiceRequestDetail['state']
export type MasterFeedFilter = NonNullable<NonNullable<paths['/api/v1/my/master/requests']['get']['parameters']['query']>['filter']>
export type MasterPublic = Schemas['MasterPublicDto']
export type MasterReview = Schemas['MasterReviewDto']
export type CloseServiceBody = Schemas['Close']
/** A photo or a video of a service request — `media[]` [36, 39]. */
export type MediaItem = Schemas['MediaItemDto']

// ─── Complaints, disputes, dictionaries ──────────────────────────────────────
export type CreateComplaintBody = Schemas['CreateComplaintRequest']
export type ComplaintType = CreateComplaintBody['type']
export type ComplaintReason = CreateComplaintBody['reason']

// ─── Videos from the market and delivery by Ылдам Экспресс ──────────────────
export type Video = Schemas['VideoDto']
export type VideoFeedItem = Schemas['VideoFeedItemDto']
export type VideoFeedPage = Schemas['VideoFeedPageDto']
export type PartComment = Schemas['PartCommentDto']
export type PartCommentPage = Schemas['PartCommentPageDto']
export type PartVideoUpload = Schemas['PartVideoUploadDto']
export type PartVideoDraft = Schemas['PartVideoDraftDto']
export type DeliveryTariffs = Schemas['DeliveryTariffsDto']
export type DeliveryRegion = Schemas['RegionDto']
export type DeliveryRegionCode = DeliveryRegion['code']
export type DeliveryDistrict = Schemas['DistrictDto']
export type CreateDeliveryOrderBody = Schemas['CreateOrder']
export type DeliveryPackedBody = Schemas['Packed']
export type DeliveryOrder = Schemas['DeliveryOrderDto']
export type DeliveryStatus = DeliveryOrder['status']
