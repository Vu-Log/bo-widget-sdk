# AIMA Admin Trip API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-trip (46 endpoints)

### POST `/billing/fleets/{fleetId}/trips/{tripId}/unlock`
Unlock a locked billing for the given fleet and trip

authFetch path: `user/billing/fleets/{fleetId}/trips/{tripId}/unlock` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: String (required) — The fleet id
- `tripId`: String (required) — The trip id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### GET `/by-service/fleets/{fleetId}/events/users/{userId}`
List all the events of a given user

authFetch path: `user/by-service/fleets/{fleetId}/events/users/{userId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `userId`: any (required) — id of the user

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — beginning of the range
- `endDate`: any (optional) — end of the range
- `type`: any (optional) — One of the event type

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### GET `/by-service/fleets/{fleetId}/trips`
List trip summaries of a fleet

it's a paginated call

authFetch path: `user/by-service/fleets/{fleetId}/trips` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — List the trips with a booking Date from this date
- `endDate`: any (optional) — The list the trips with a booking Date until this date
- `serviceId`: any (optional) — Filter by serviceId
- `suspicious`: any (optional) — return only the suspicious trips
- `isBilled`: any (required) — return only the trips where an invoice has been generated
- `ticketCategoryId`: integer (int32) (optional)
- `ticketGroupId`: integer (int32) (optional)
- `isCancelled`: any (optional) — return only the trips cancelled
- `distanceFrom`: number (optional)
- `distanceTo`: number (optional)
- `durationFrom`: number (optional)
- `durationTo`: number (optional)
- `plate`: string (optional)
- `isReleased`: any (optional) — return only the trips which have been released
- `adjusted`: any (optional) — return only the trips which have been adjusted/overridden

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/by-service/fleets/{fleetId}/trips/users/{userId}`
Get trips summaries for a given userId. It's a paginated end point.

authFetch path: `user/by-service/fleets/{fleetId}/trips/users/{userId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `userId`: any (required) — The userId

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — from this date
- `endDate`: any (optional) — to this date
- `profileType`: any (optional) — The Filter by profileType

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/by-service/fleets/{fleetId}/trips/vehicles/{vehicleId}`
Get trips summaries for a given vehicleId by service

It's a paginated end point

authFetch path: `user/by-service/fleets/{fleetId}/trips/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `vehicleId`: any (required) — The vehicleId

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — from this date
- `endDate`: any (optional) — to this date

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/by-service/fleets/{fleetId}/trips/{tripId}`
Get a trip summary by tripId

authFetch path: `user/by-service/fleets/{fleetId}/trips/{tripId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `tripId`: any (required) — The unique id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip`

### POST `/fleets/{fleetId}/events`
Insert a new event

This could be a vehicle's activity or a user's activity, if the event has a tripId it will be included in the trip's event logs too

authFetch path: `user/fleets/{fleetId}/events` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `EventDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| tripId | string | no | TripId if this event has occurred during a trip, otherwise can be null |
| fleetId | string | yes | FleetId |
| boxId | string | no | BoxId if this event is related to a vehicle's activity, otherwise can be null |
| vehicleId | string | no | VehicleId if this event is related to a vehicle's activity, otherwise can be null |
| userId | string | no | UserId if this event is related to a user's activity, otherwise can be null |
| orderId | string | no |  |
| origin | string | yes | Event's origin: * API: Activity generated from an API * BOX: Activity generated from the box inside the vehicle * INTERNAL: Activity generated from AIMA platfo… |
| type | string: `USER_ACCOUNT_UPDATE`, `USER_SUSPENDED`, `USER_REJECTED`, `USER_CREATED`, `USER_APPROVED`, `USER_INCOMPLETE`, `USER_ARCHIVED`, `USER_INACTIVE`, `USER_DELETED`, `USER_RESET_PASSWORD`, `USER_ROLE_ADD`, `USER_UNLOCK`, `USER_ROLE_DEL`, `USER_BOOKING_REQUEST`, `USER_UPDATE_BOOKING_REQUEST`, `USER_DELETE_BOOKING_REQUEST`, `USER_CANCEL_BOOKING_REQUEST`, `USER_GET_ADMIN_TK`, `USER_PROMOCODE_REDEEM`, `USER_SYSTEM_CREDIT_ADD`, `USER_SYSTEM_CREDIT_CONSUMED`, `USER_SYSTEM_CREDIT_REMOVED`, `USER_PRODUCT_CHARGED`, `USER_TRIP_INVOICE_CREATED`, `USER_TRIP_EXPENSE_CREATED`, `USER_TRIP_INVOICE_UPDATED`, `USER_PRODUCT_INVOICE_CREATED`, `USER_PRODUCT_EXPENSE_CREATED`, `USER_PRODUCT_INVOICE_UPDATED`, `VEHICLE_ADDED_TO_STATION`, `VEHICLE_REMOVED_FROM_STATION`, `VEHICLE_ALLOCATED`, `VEHICLE_TOWED`, `VEHICLE_INTEGRATE_DEL`, `VEHICLE_ARCHIVED`, `VEHICLE_DELETE`, `VEHICLE_UPDATED`, `VEHICLE_UPDATED_VUBOX`, `VEHICLE_REMOVE_VUBOX`, `VEHICLE_ASSIGN_VUBOX`, `VEHICLE_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE_CANCELED`, `VEHICLE_UNLOCK`, `VEHICLE_LOCK`, `VEHICLE_BATTERY_LOCK`, `VEHICLE_BATTERY_UNLOCK`, `VEHICLE_HELMET_LOCK`, `VEHICLE_HELMET_UNLOCK`, `VEHICLE_SPARE_LOCK`, `VEHICLE_SPARE_UNLOCK`, `VEHICLE_PILE_LOCK`, `VEHICLE_PILE_UNLOCK`, `VEHICLE_SPEED_LIMIT_CHANGED`, `VEHICLE_WAKE_UP`, `VEHICLE_WAKE_UP_ACCEL`, `VEHICLE_WAKE_UP_BLE`, `VEHICLE_CONNECTIVITY_ONLINE`, `VEHICLE_CONNECTIVITY_OFFLINE`, `VEHICLE_CONNECTIVITY_INTERRUPTED`, `VEHICLE_OUT_OF_COM`, `VEHICLE_BOOKING_STATUS_CHANGED`, `VEHICLE_GET_STATUS`, `VEHICLE_SCHEDULED_REBOOT`, `VEHICLE_WARNING`, `VEHICLE_CRUISING_RANGE_LOW`, `VEHICLE_CRUISING_RANGE_CRITICAL`, `VEHICLE_ACCEL_ALERT`, `VEHICLE_SPEED_ALERT`, `VEHICLE_CKH_UPDATE`, `VEHICLE_RECOVERY`, `VEHICLE_SYNC`, `VEHICLE_STANDBY`, `VEHICLE_AUTOCLOSE_ON`, `VEHICLE_AUTOCLOSE_OFF`, `VEHICLE_IGNITION_ON`, `VEHICLE_IGNITION_OFF`, `VEHICLE_REBOOT`, `VEHICLE_MOBILIZE`, `VEHICLE_IMMOBILIZE`, `VEHICLE_IMMOBILIZER_OOT`, `VEHICLE_ENABLE`, `VEHICLE_MAGIC_CARD`, `VEHICLE_CLEANLINESS_RESET`, `VEHICLE_ADD_ZONE`, `VEHICLE_REMOVE_ZONE`, `VEHICLE_RELEASE_TRIP`, `VEHICLE_START_TRIP`, `VEHICLE_END_TRIP`, `VEHICLE_EDIT_TRIP`, `VEHICLE_MANUAL_END_TRIP`, `VEHICLE_TRACKING_ON`, `VEHICLE_TRACKING_OFF`, `VEHICLE_TRIP_TERMINATION`, `VEHICLE_PAUSE_TRIP`, `VEHICLE_FORCED_PAUSE_TRIP`, `VEHICLE_RESUME_TRIP`, `VEHICLE_EXPERT`, `VEHICLE_PASSTHROUGH`, `VEHICLE_PING`, `VEHICLE_CANCEL_TRIP`, `VEHICLE_REMOVE_PRODUCT_TRIP`, `VEHICLE_BOOK`, `VEHICLE_ADD_PRODUCT_TRIP`, `VEHICLE_UPDATE_REASON`, `VEHICLE_RESET_CLEAN_DATE`, `VEHICLE_RESET_REDISTRIB_DATE`, `VEHICLE_RESET_MOVING_DATE`, `VEHICLE_RESET_BOOKING_CONTEXT`, `VEHICLE_ARCHIVED_FM`, `VEHICLE_ANTITHEFT_ON`, `VEHICLE_ANTITHEFT_OFF`, `VEHICLE_CHARGING_ACTIVE`, `VEHICLE_CHARGING_ENDED`, `VEHICLE_CHARGING_PLUGGED`, `VEHICLE_CHARGING_UNPLUGGED`, `VEHICLE_BATTERY_OK`, `VEHICLE_BATTERY_LOW`, `VEHICLE_BATTERY_CRITICAL`, `VEHICLE_DOORS_OPEN`, `VEHICLE_DOORS_CLOSED`, `VEHICLE_WINDOWS_OPEN`, `VEHICLE_WINDOWS_CLOSED`, `VEHICLE_ALERT`, `VEHICLE_FATAL`, `VEHICLE_PRICING_CHANGED`, `VEHICLE_GROUP_CHANGED`, `VEHICLE_UPDATE_ODOMETER`, `VEHICLE_UPDATE_STATUS`, `VEHICLE_UPDATE_GPS_MANUAL`, `VEHICLE_UPDATE_GPS_SIM`, `VEHICLE_RFID_SYNC`, `VEHICLE_PREAUTH_CONFIRMED`, `VEHICLE_PREAUTH_REJECTED`, `VEHICLE_PREAUTH_EXPIRED`, `VEHICLE_PREAUTH_CANCELLED`, `USER_PRODUCT_INVOICE_CANCELLED`, `USER_TRIP_INVOICE_CANCELLED`, `USER_PRODUCT_INVOICE_REFUSED`, `USER_TRIP_INVOICE_REFUSED`, `USER_TRIP_INVOICE_PAID`, `USER_PRODUCT_INVOICE_PAID`, `USER_TRIP_INVOICE_REFUNDED`, `USER_PRODUCT_INVOICE_REFUNDED`, `USER_PLAN_SUBSCRIBED`, `USER_PLAN_UNSUBSCRIBED`, `USER_PLAN_EXPIRED`, `USER_PLAN_RENEWED`, `USER_PLAN_RENEWAL`, `USER_PLAN_CANCELED`, `USER_PLAN_UPDATED`, `USER_PLAN_PERIODIC_TIME_WALLET_CHARGED`, `USER_PLAN_PERIODIC_TIME_WALLET_CONSUMED`, `USER_PLAN_RENEWAL_FAILED`, `USER_PLAN_CREDITS_FAILED`, `USER_UPDATE_TRIP`, `USER_REFERRAL_CREATED`, `USER_REFERRAL_CHECKED`, `USER_REPORT_CREATED`, `USER_REPORT_UPDATED`, `USER_DOC_UPDATED`, `USER_BILLING_GROUP_ADDED`, `USER_BILLING_GROUP_REMOVED`, `VEHICLE_ADDED_TO_SERVICE`, `VEHICLE_REMOVED_FROM_SERVICE`, `USER_RFIDPINCODE_REQUESTED`, `VEHICLE_REFILLED`, `VEHICLE_DIAG_GPS`, `VEHICLE_DIAG_CAN`, `VEHICLE_DIAG_MOBILIZER`, `VEHICLE_DIAG_IMMOBILIZER`, `VEHICLE_DIAG_LOCK`, `VEHICLE_DIAG_UNLOCK`, `VEHICLE_DIAG_ANALOG`, `VEHICLE_DIAG_CKH`, `VEHICLE_DIAG_RFID`, `VEHICLE_DIAG_SPEAK`, `VEHICLE_DIAG_HZ_LED`, `VEHICLE_BLE_AUTH`, `VEHICLE_BLE_START_FLOW`, `VEHICLE_BLE_START_ISSUE`, `VEHICLE_FIRMWARE_UPDATE`, `VEHICLE_FLEET_SWAP`, `USER_TRIP_EVENT_MAP_DISPLAY_GDPR`, `USER_AUTOMATICALLY_REFUNDED`, `USER_TRIP_CREDIT_REFUNDED`, `USER_PRODUCT_CREDIT_REFUNDED`, `USER_PRODUCT_TIME_WALLET_CHARGED`, `USER_PRODUCT_TIME_WALLET_CONSUMED`, `USER_CREDIT_REFUNDED`, `USER_ALL_CREDIT_REFUNDED`, `USER_PREPAYMENT_SUCCEEDED`, `USER_PREPAYMENT_FAILED`, `USER_CREATE_SUBSCRIPTION`, `USER_UPDATE_SUBSCRIPTION`, `GRACE_PERIOD_APPLIED`, `USER_LABEL_CREATED`, `USER_LABEL_DELETED`, `VEHICLE_UNAVAILABILITIES_ADD`, `VEHICLE_UNAVAILABILITIES_DELETE`, `VEHICLE_UNAVAILABILITIES_UPDATE`, `VEHICLE_ZONE_IN`, `VEHICLE_ZONE_OUT`, `USER_INSURANCE_CREATED`, `USER_INSURANCE_UPDATED`, `USER_DEPOSIT_CREATED`, `USER_DEPOSIT_CAPTURED`, `USER_DEPOSIT_CANCELLED`, `USER_INVOICE_PDF_GENERATION` | yes | Event's type |
| date | string (date-time) | yes |  |
| failed | boolean | yes |  |
| errorCode | integer (int32) | no |  |
| originId | string | yes |  |
| transactionId | string | no |  |
| insertionDate | string (date-time) | no |  |
| deletionDate | string (date-time) | no |  |
| ticketId | string | no |  |
| ticketCategoryId | integer (int32) | no |  |
| ticketGroupId | integer (int32) | no |  |
| version | string | no |  |
| doNotTrack | boolean | no |  |
| extraInfo | object | no |  |

**Responses:** `200` → `EventDTO`

### GET `/fleets/{fleetId}/events/alerts/{period}`
List the vehicle alerts

authFetch path: `user/fleets/{fleetId}/events/alerts/{period}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `period`: any (required) — period to seek

**Query params:**
- `domain`: string (optional)
- `filter`: VehicleEventFilter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `MappingJacksonValue`

### GET `/fleets/{fleetId}/events/statistics/boxActives/{period}`
Get all the boxIds active during the given period. This end point is paginated.

authFetch path: `user/fleets/{fleetId}/events/statistics/boxActives/{period}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `period`: any (required) — period to seek

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`

### GET `/fleets/{fleetId}/events/statistics/licenses/{period}`
Get number of active boxes during the given period. This end point is paginated.

authFetch path: `user/fleets/{fleetId}/events/statistics/licenses/{period}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `period`: any (required) — period to seek

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/events/trips/{tripId}`
List all the events of a given trip

authFetch path: `user/fleets/{fleetId}/events/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `tripId`: any (required) — id of the trip

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — beginning of the range
- `endDate`: any (optional) — end of the range
- `type`: any (optional) — Event types separated by comma

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### DELETE `/fleets/{fleetId}/events/trips/{tripId}`
Delete events for a given trip

authFetch path: `user/fleets/{fleetId}/events/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### GET `/fleets/{fleetId}/events/types`
Return the catalog of all the event's type

authFetch path: `user/fleets/{fleetId}/events/types` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string: `USER_ACCOUNT_UPDATE`, `USER_SUSPENDED`, `USER_REJECTED`, `USER_CREATED`, `USER_APPROVED`, `USER_INCOMPLETE`, `USER_ARCHIVED`, `USER_INACTIVE`, `USER_DELETED`, `USER_RESET_PASSWORD`, `USER_ROLE_ADD`, `USER_UNLOCK`, `USER_ROLE_DEL`, `USER_BOOKING_REQUEST`, `USER_UPDATE_BOOKING_REQUEST`, `USER_DELETE_BOOKING_REQUEST`, `USER_CANCEL_BOOKING_REQUEST`, `USER_GET_ADMIN_TK`, `USER_PROMOCODE_REDEEM`, `USER_SYSTEM_CREDIT_ADD`, `USER_SYSTEM_CREDIT_CONSUMED`, `USER_SYSTEM_CREDIT_REMOVED`, `USER_PRODUCT_CHARGED`, `USER_TRIP_INVOICE_CREATED`, `USER_TRIP_EXPENSE_CREATED`, `USER_TRIP_INVOICE_UPDATED`, `USER_PRODUCT_INVOICE_CREATED`, `USER_PRODUCT_EXPENSE_CREATED`, `USER_PRODUCT_INVOICE_UPDATED`, `VEHICLE_ADDED_TO_STATION`, `VEHICLE_REMOVED_FROM_STATION`, `VEHICLE_ALLOCATED`, `VEHICLE_TOWED`, `VEHICLE_INTEGRATE_DEL`, `VEHICLE_ARCHIVED`, `VEHICLE_DELETE`, `VEHICLE_UPDATED`, `VEHICLE_UPDATED_VUBOX`, `VEHICLE_REMOVE_VUBOX`, `VEHICLE_ASSIGN_VUBOX`, `VEHICLE_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE_CANCELED`, `VEHICLE_UNLOCK`, `VEHICLE_LOCK`, `VEHICLE_BATTERY_LOCK`, `VEHICLE_BATTERY_UNLOCK`, `VEHICLE_HELMET_LOCK`, `VEHICLE_HELMET_UNLOCK`, `VEHICLE_SPARE_LOCK`, `VEHICLE_SPARE_UNLOCK`, `VEHICLE_PILE_LOCK`, `VEHICLE_PILE_UNLOCK`, `VEHICLE_SPEED_LIMIT_CHANGED`, `VEHICLE_WAKE_UP`, `VEHICLE_WAKE_UP_ACCEL`, `VEHICLE_WAKE_UP_BLE`, `VEHICLE_CONNECTIVITY_ONLINE`, `VEHICLE_CONNECTIVITY_OFFLINE`, `VEHICLE_CONNECTIVITY_INTERRUPTED`, `VEHICLE_OUT_OF_COM`, `VEHICLE_BOOKING_STATUS_CHANGED`, `VEHICLE_GET_STATUS`, `VEHICLE_SCHEDULED_REBOOT`, `VEHICLE_WARNING`, `VEHICLE_CRUISING_RANGE_LOW`, `VEHICLE_CRUISING_RANGE_CRITICAL`, `VEHICLE_ACCEL_ALERT`, `VEHICLE_SPEED_ALERT`, `VEHICLE_CKH_UPDATE`, `VEHICLE_RECOVERY`, `VEHICLE_SYNC`, `VEHICLE_STANDBY`, `VEHICLE_AUTOCLOSE_ON`, `VEHICLE_AUTOCLOSE_OFF`, `VEHICLE_IGNITION_ON`, `VEHICLE_IGNITION_OFF`, `VEHICLE_REBOOT`, `VEHICLE_MOBILIZE`, `VEHICLE_IMMOBILIZE`, `VEHICLE_IMMOBILIZER_OOT`, `VEHICLE_ENABLE`, `VEHICLE_MAGIC_CARD`, `VEHICLE_CLEANLINESS_RESET`, `VEHICLE_ADD_ZONE`, `VEHICLE_REMOVE_ZONE`, `VEHICLE_RELEASE_TRIP`, `VEHICLE_START_TRIP`, `VEHICLE_END_TRIP`, `VEHICLE_EDIT_TRIP`, `VEHICLE_MANUAL_END_TRIP`, `VEHICLE_TRACKING_ON`, `VEHICLE_TRACKING_OFF`, `VEHICLE_TRIP_TERMINATION`, `VEHICLE_PAUSE_TRIP`, `VEHICLE_FORCED_PAUSE_TRIP`, `VEHICLE_RESUME_TRIP`, `VEHICLE_EXPERT`, `VEHICLE_PASSTHROUGH`, `VEHICLE_PING`, `VEHICLE_CANCEL_TRIP`, `VEHICLE_REMOVE_PRODUCT_TRIP`, `VEHICLE_BOOK`, `VEHICLE_ADD_PRODUCT_TRIP`, `VEHICLE_UPDATE_REASON`, `VEHICLE_RESET_CLEAN_DATE`, `VEHICLE_RESET_REDISTRIB_DATE`, `VEHICLE_RESET_MOVING_DATE`, `VEHICLE_RESET_BOOKING_CONTEXT`, `VEHICLE_ARCHIVED_FM`, `VEHICLE_ANTITHEFT_ON`, `VEHICLE_ANTITHEFT_OFF`, `VEHICLE_CHARGING_ACTIVE`, `VEHICLE_CHARGING_ENDED`, `VEHICLE_CHARGING_PLUGGED`, `VEHICLE_CHARGING_UNPLUGGED`, `VEHICLE_BATTERY_OK`, `VEHICLE_BATTERY_LOW`, `VEHICLE_BATTERY_CRITICAL`, `VEHICLE_DOORS_OPEN`, `VEHICLE_DOORS_CLOSED`, `VEHICLE_WINDOWS_OPEN`, `VEHICLE_WINDOWS_CLOSED`, `VEHICLE_ALERT`, `VEHICLE_FATAL`, `VEHICLE_PRICING_CHANGED`, `VEHICLE_GROUP_CHANGED`, `VEHICLE_UPDATE_ODOMETER`, `VEHICLE_UPDATE_STATUS`, `VEHICLE_UPDATE_GPS_MANUAL`, `VEHICLE_UPDATE_GPS_SIM`, `VEHICLE_RFID_SYNC`, `VEHICLE_PREAUTH_CONFIRMED`, `VEHICLE_PREAUTH_REJECTED`, `VEHICLE_PREAUTH_EXPIRED`, `VEHICLE_PREAUTH_CANCELLED`, `USER_PRODUCT_INVOICE_CANCELLED`, `USER_TRIP_INVOICE_CANCELLED`, `USER_PRODUCT_INVOICE_REFUSED`, `USER_TRIP_INVOICE_REFUSED`, `USER_TRIP_INVOICE_PAID`, `USER_PRODUCT_INVOICE_PAID`, `USER_TRIP_INVOICE_REFUNDED`, `USER_PRODUCT_INVOICE_REFUNDED`, `USER_PLAN_SUBSCRIBED`, `USER_PLAN_UNSUBSCRIBED`, `USER_PLAN_EXPIRED`, `USER_PLAN_RENEWED`, `USER_PLAN_RENEWAL`, `USER_PLAN_CANCELED`, `USER_PLAN_UPDATED`, `USER_PLAN_PERIODIC_TIME_WALLET_CHARGED`, `USER_PLAN_PERIODIC_TIME_WALLET_CONSUMED`, `USER_PLAN_RENEWAL_FAILED`, `USER_PLAN_CREDITS_FAILED`, `USER_UPDATE_TRIP`, `USER_REFERRAL_CREATED`, `USER_REFERRAL_CHECKED`, `USER_REPORT_CREATED`, `USER_REPORT_UPDATED`, `USER_DOC_UPDATED`, `USER_BILLING_GROUP_ADDED`, `USER_BILLING_GROUP_REMOVED`, `VEHICLE_ADDED_TO_SERVICE`, `VEHICLE_REMOVED_FROM_SERVICE`, `USER_RFIDPINCODE_REQUESTED`, `VEHICLE_REFILLED`, `VEHICLE_DIAG_GPS`, `VEHICLE_DIAG_CAN`, `VEHICLE_DIAG_MOBILIZER`, `VEHICLE_DIAG_IMMOBILIZER`, `VEHICLE_DIAG_LOCK`, `VEHICLE_DIAG_UNLOCK`, `VEHICLE_DIAG_ANALOG`, `VEHICLE_DIAG_CKH`, `VEHICLE_DIAG_RFID`, `VEHICLE_DIAG_SPEAK`, `VEHICLE_DIAG_HZ_LED`, `VEHICLE_BLE_AUTH`, `VEHICLE_BLE_START_FLOW`, `VEHICLE_BLE_START_ISSUE`, `VEHICLE_FIRMWARE_UPDATE`, `VEHICLE_FLEET_SWAP`, `USER_TRIP_EVENT_MAP_DISPLAY_GDPR`, `USER_AUTOMATICALLY_REFUNDED`, `USER_TRIP_CREDIT_REFUNDED`, `USER_PRODUCT_CREDIT_REFUNDED`, `USER_PRODUCT_TIME_WALLET_CHARGED`, `USER_PRODUCT_TIME_WALLET_CONSUMED`, `USER_CREDIT_REFUNDED`, `USER_ALL_CREDIT_REFUNDED`, `USER_PREPAYMENT_SUCCEEDED`, `USER_PREPAYMENT_FAILED`, `USER_CREATE_SUBSCRIPTION`, `USER_UPDATE_SUBSCRIPTION`, `GRACE_PERIOD_APPLIED`, `USER_LABEL_CREATED`, `USER_LABEL_DELETED`, `VEHICLE_UNAVAILABILITIES_ADD`, `VEHICLE_UNAVAILABILITIES_DELETE`, `VEHICLE_UNAVAILABILITIES_UPDATE`, `VEHICLE_ZONE_IN`, `VEHICLE_ZONE_OUT`, `USER_INSURANCE_CREATED`, `USER_INSURANCE_UPDATED`, `USER_DEPOSIT_CREATED`, `USER_DEPOSIT_CAPTURED`, `USER_DEPOSIT_CANCELLED`, `USER_INVOICE_PDF_GENERATION`[]`

### GET `/fleets/{fleetId}/events/types/{types}`
List all the event's of a given type between a time range. This end point is paginated.

authFetch path: `user/fleets/{fleetId}/events/types/{types}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `types`: any (required) — List of event types separated by comma

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — beginning of the range
- `endDate`: any (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### GET `/fleets/{fleetId}/events/users/{userId}`
List all the events of a given user

authFetch path: `user/fleets/{fleetId}/events/users/{userId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `userId`: any (required) — id of the user

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — beginning of the range
- `endDate`: any (optional) — end of the range
- `type`: any (optional) — One of the event type

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### GET `/fleets/{fleetId}/events/v2/trips`
List all the events of given trips

authFetch path: `user/fleets/{fleetId}/events/v2/trips` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `domain`: string (optional)
- `filter`: TripEventFilter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `MappingJacksonValue`

### GET `/fleets/{fleetId}/events/v2/vehicles`
List all the events of given vehicles

authFetch path: `user/fleets/{fleetId}/events/v2/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `type`: any (optional) — event type
- `domain`: any (optional) — domain
- `filter`: VehicleEventFilter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `MappingJacksonValue`

### GET `/fleets/{fleetId}/events/vehicles/{vehicleId}`
List all the events of a given vehicle

authFetch path: `user/fleets/{fleetId}/events/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `vehicleId`: any (required) — id of the vehicle

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: any (optional) — beginning of the range
- `endDate`: any (optional) — end of the range
- `type`: any (optional) — One of the event type

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### POST `/fleets/{fleetId}/maprequests`
Insert a new map request

Log the display map request in the trip event and in the user event

authFetch path: `user/fleets/{fleetId}/maprequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `EventDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| tripId | string | no | TripId if this event has occurred during a trip, otherwise can be null |
| fleetId | string | yes | FleetId |
| boxId | string | no | BoxId if this event is related to a vehicle's activity, otherwise can be null |
| vehicleId | string | no | VehicleId if this event is related to a vehicle's activity, otherwise can be null |
| userId | string | no | UserId if this event is related to a user's activity, otherwise can be null |
| orderId | string | no |  |
| origin | string | yes | Event's origin: * API: Activity generated from an API * BOX: Activity generated from the box inside the vehicle * INTERNAL: Activity generated from AIMA platfo… |
| type | string: `USER_ACCOUNT_UPDATE`, `USER_SUSPENDED`, `USER_REJECTED`, `USER_CREATED`, `USER_APPROVED`, `USER_INCOMPLETE`, `USER_ARCHIVED`, `USER_INACTIVE`, `USER_DELETED`, `USER_RESET_PASSWORD`, `USER_ROLE_ADD`, `USER_UNLOCK`, `USER_ROLE_DEL`, `USER_BOOKING_REQUEST`, `USER_UPDATE_BOOKING_REQUEST`, `USER_DELETE_BOOKING_REQUEST`, `USER_CANCEL_BOOKING_REQUEST`, `USER_GET_ADMIN_TK`, `USER_PROMOCODE_REDEEM`, `USER_SYSTEM_CREDIT_ADD`, `USER_SYSTEM_CREDIT_CONSUMED`, `USER_SYSTEM_CREDIT_REMOVED`, `USER_PRODUCT_CHARGED`, `USER_TRIP_INVOICE_CREATED`, `USER_TRIP_EXPENSE_CREATED`, `USER_TRIP_INVOICE_UPDATED`, `USER_PRODUCT_INVOICE_CREATED`, `USER_PRODUCT_EXPENSE_CREATED`, `USER_PRODUCT_INVOICE_UPDATED`, `VEHICLE_ADDED_TO_STATION`, `VEHICLE_REMOVED_FROM_STATION`, `VEHICLE_ALLOCATED`, `VEHICLE_TOWED`, `VEHICLE_INTEGRATE_DEL`, `VEHICLE_ARCHIVED`, `VEHICLE_DELETE`, `VEHICLE_UPDATED`, `VEHICLE_UPDATED_VUBOX`, `VEHICLE_REMOVE_VUBOX`, `VEHICLE_ASSIGN_VUBOX`, `VEHICLE_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE_CANCELED`, `VEHICLE_UNLOCK`, `VEHICLE_LOCK`, `VEHICLE_BATTERY_LOCK`, `VEHICLE_BATTERY_UNLOCK`, `VEHICLE_HELMET_LOCK`, `VEHICLE_HELMET_UNLOCK`, `VEHICLE_SPARE_LOCK`, `VEHICLE_SPARE_UNLOCK`, `VEHICLE_PILE_LOCK`, `VEHICLE_PILE_UNLOCK`, `VEHICLE_SPEED_LIMIT_CHANGED`, `VEHICLE_WAKE_UP`, `VEHICLE_WAKE_UP_ACCEL`, `VEHICLE_WAKE_UP_BLE`, `VEHICLE_CONNECTIVITY_ONLINE`, `VEHICLE_CONNECTIVITY_OFFLINE`, `VEHICLE_CONNECTIVITY_INTERRUPTED`, `VEHICLE_OUT_OF_COM`, `VEHICLE_BOOKING_STATUS_CHANGED`, `VEHICLE_GET_STATUS`, `VEHICLE_SCHEDULED_REBOOT`, `VEHICLE_WARNING`, `VEHICLE_CRUISING_RANGE_LOW`, `VEHICLE_CRUISING_RANGE_CRITICAL`, `VEHICLE_ACCEL_ALERT`, `VEHICLE_SPEED_ALERT`, `VEHICLE_CKH_UPDATE`, `VEHICLE_RECOVERY`, `VEHICLE_SYNC`, `VEHICLE_STANDBY`, `VEHICLE_AUTOCLOSE_ON`, `VEHICLE_AUTOCLOSE_OFF`, `VEHICLE_IGNITION_ON`, `VEHICLE_IGNITION_OFF`, `VEHICLE_REBOOT`, `VEHICLE_MOBILIZE`, `VEHICLE_IMMOBILIZE`, `VEHICLE_IMMOBILIZER_OOT`, `VEHICLE_ENABLE`, `VEHICLE_MAGIC_CARD`, `VEHICLE_CLEANLINESS_RESET`, `VEHICLE_ADD_ZONE`, `VEHICLE_REMOVE_ZONE`, `VEHICLE_RELEASE_TRIP`, `VEHICLE_START_TRIP`, `VEHICLE_END_TRIP`, `VEHICLE_EDIT_TRIP`, `VEHICLE_MANUAL_END_TRIP`, `VEHICLE_TRACKING_ON`, `VEHICLE_TRACKING_OFF`, `VEHICLE_TRIP_TERMINATION`, `VEHICLE_PAUSE_TRIP`, `VEHICLE_FORCED_PAUSE_TRIP`, `VEHICLE_RESUME_TRIP`, `VEHICLE_EXPERT`, `VEHICLE_PASSTHROUGH`, `VEHICLE_PING`, `VEHICLE_CANCEL_TRIP`, `VEHICLE_REMOVE_PRODUCT_TRIP`, `VEHICLE_BOOK`, `VEHICLE_ADD_PRODUCT_TRIP`, `VEHICLE_UPDATE_REASON`, `VEHICLE_RESET_CLEAN_DATE`, `VEHICLE_RESET_REDISTRIB_DATE`, `VEHICLE_RESET_MOVING_DATE`, `VEHICLE_RESET_BOOKING_CONTEXT`, `VEHICLE_ARCHIVED_FM`, `VEHICLE_ANTITHEFT_ON`, `VEHICLE_ANTITHEFT_OFF`, `VEHICLE_CHARGING_ACTIVE`, `VEHICLE_CHARGING_ENDED`, `VEHICLE_CHARGING_PLUGGED`, `VEHICLE_CHARGING_UNPLUGGED`, `VEHICLE_BATTERY_OK`, `VEHICLE_BATTERY_LOW`, `VEHICLE_BATTERY_CRITICAL`, `VEHICLE_DOORS_OPEN`, `VEHICLE_DOORS_CLOSED`, `VEHICLE_WINDOWS_OPEN`, `VEHICLE_WINDOWS_CLOSED`, `VEHICLE_ALERT`, `VEHICLE_FATAL`, `VEHICLE_PRICING_CHANGED`, `VEHICLE_GROUP_CHANGED`, `VEHICLE_UPDATE_ODOMETER`, `VEHICLE_UPDATE_STATUS`, `VEHICLE_UPDATE_GPS_MANUAL`, `VEHICLE_UPDATE_GPS_SIM`, `VEHICLE_RFID_SYNC`, `VEHICLE_PREAUTH_CONFIRMED`, `VEHICLE_PREAUTH_REJECTED`, `VEHICLE_PREAUTH_EXPIRED`, `VEHICLE_PREAUTH_CANCELLED`, `USER_PRODUCT_INVOICE_CANCELLED`, `USER_TRIP_INVOICE_CANCELLED`, `USER_PRODUCT_INVOICE_REFUSED`, `USER_TRIP_INVOICE_REFUSED`, `USER_TRIP_INVOICE_PAID`, `USER_PRODUCT_INVOICE_PAID`, `USER_TRIP_INVOICE_REFUNDED`, `USER_PRODUCT_INVOICE_REFUNDED`, `USER_PLAN_SUBSCRIBED`, `USER_PLAN_UNSUBSCRIBED`, `USER_PLAN_EXPIRED`, `USER_PLAN_RENEWED`, `USER_PLAN_RENEWAL`, `USER_PLAN_CANCELED`, `USER_PLAN_UPDATED`, `USER_PLAN_PERIODIC_TIME_WALLET_CHARGED`, `USER_PLAN_PERIODIC_TIME_WALLET_CONSUMED`, `USER_PLAN_RENEWAL_FAILED`, `USER_PLAN_CREDITS_FAILED`, `USER_UPDATE_TRIP`, `USER_REFERRAL_CREATED`, `USER_REFERRAL_CHECKED`, `USER_REPORT_CREATED`, `USER_REPORT_UPDATED`, `USER_DOC_UPDATED`, `USER_BILLING_GROUP_ADDED`, `USER_BILLING_GROUP_REMOVED`, `VEHICLE_ADDED_TO_SERVICE`, `VEHICLE_REMOVED_FROM_SERVICE`, `USER_RFIDPINCODE_REQUESTED`, `VEHICLE_REFILLED`, `VEHICLE_DIAG_GPS`, `VEHICLE_DIAG_CAN`, `VEHICLE_DIAG_MOBILIZER`, `VEHICLE_DIAG_IMMOBILIZER`, `VEHICLE_DIAG_LOCK`, `VEHICLE_DIAG_UNLOCK`, `VEHICLE_DIAG_ANALOG`, `VEHICLE_DIAG_CKH`, `VEHICLE_DIAG_RFID`, `VEHICLE_DIAG_SPEAK`, `VEHICLE_DIAG_HZ_LED`, `VEHICLE_BLE_AUTH`, `VEHICLE_BLE_START_FLOW`, `VEHICLE_BLE_START_ISSUE`, `VEHICLE_FIRMWARE_UPDATE`, `VEHICLE_FLEET_SWAP`, `USER_TRIP_EVENT_MAP_DISPLAY_GDPR`, `USER_AUTOMATICALLY_REFUNDED`, `USER_TRIP_CREDIT_REFUNDED`, `USER_PRODUCT_CREDIT_REFUNDED`, `USER_PRODUCT_TIME_WALLET_CHARGED`, `USER_PRODUCT_TIME_WALLET_CONSUMED`, `USER_CREDIT_REFUNDED`, `USER_ALL_CREDIT_REFUNDED`, `USER_PREPAYMENT_SUCCEEDED`, `USER_PREPAYMENT_FAILED`, `USER_CREATE_SUBSCRIPTION`, `USER_UPDATE_SUBSCRIPTION`, `GRACE_PERIOD_APPLIED`, `USER_LABEL_CREATED`, `USER_LABEL_DELETED`, `VEHICLE_UNAVAILABILITIES_ADD`, `VEHICLE_UNAVAILABILITIES_DELETE`, `VEHICLE_UNAVAILABILITIES_UPDATE`, `VEHICLE_ZONE_IN`, `VEHICLE_ZONE_OUT`, `USER_INSURANCE_CREATED`, `USER_INSURANCE_UPDATED`, `USER_DEPOSIT_CREATED`, `USER_DEPOSIT_CAPTURED`, `USER_DEPOSIT_CANCELLED`, `USER_INVOICE_PDF_GENERATION` | yes | Event's type |
| date | string (date-time) | yes |  |
| failed | boolean | yes |  |
| errorCode | integer (int32) | no |  |
| originId | string | yes |  |
| transactionId | string | no |  |
| insertionDate | string (date-time) | no |  |
| deletionDate | string (date-time) | no |  |
| ticketId | string | no |  |
| ticketCategoryId | integer (int32) | no |  |
| ticketGroupId | integer (int32) | no |  |
| version | string | no |  |
| doNotTrack | boolean | no |  |
| extraInfo | object | no |  |

**Responses:** `201` → `EventDTO`

### GET `/fleets/{fleetId}/maprequests/trips/{tripId}`
List all map-requests of a given trip

authFetch path: `user/fleets/{fleetId}/maprequests/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — id of the trip

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: string (optional) — beginning of the range
- `endDate`: string (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### GET `/fleets/{fleetId}/maprequests/users/{userId}`
List all map-requests of a given user

authFetch path: `user/fleets/{fleetId}/maprequests/users/{userId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — id of the user

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: string (optional) — beginning of the range
- `endDate`: string (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EventDTO[]`

### GET `/fleets/{fleetId}/reports/diagnostics/vehicles/{vehicleId}`
List all the Diagnostic events

authFetch path: `user/fleets/{fleetId}/reports/diagnostics/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `vehicleId`: any (required) — The vehicleId of your account

**Query params:**
- `filter`: VehicleEventFilter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `CursorPaginationSliceEventV2OutDTO`

### POST `/fleets/{fleetId}/reports/diagnostics/vehicles/{vehicleId}`
insert new diagnostic report event

create a new diagnostic report

authFetch path: `user/fleets/{fleetId}/reports/diagnostics/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `vehicleId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `EventDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| tripId | string | no | TripId if this event has occurred during a trip, otherwise can be null |
| fleetId | string | yes | FleetId |
| boxId | string | no | BoxId if this event is related to a vehicle's activity, otherwise can be null |
| vehicleId | string | no | VehicleId if this event is related to a vehicle's activity, otherwise can be null |
| userId | string | no | UserId if this event is related to a user's activity, otherwise can be null |
| orderId | string | no |  |
| origin | string | yes | Event's origin: * API: Activity generated from an API * BOX: Activity generated from the box inside the vehicle * INTERNAL: Activity generated from AIMA platfo… |
| type | string: `USER_ACCOUNT_UPDATE`, `USER_SUSPENDED`, `USER_REJECTED`, `USER_CREATED`, `USER_APPROVED`, `USER_INCOMPLETE`, `USER_ARCHIVED`, `USER_INACTIVE`, `USER_DELETED`, `USER_RESET_PASSWORD`, `USER_ROLE_ADD`, `USER_UNLOCK`, `USER_ROLE_DEL`, `USER_BOOKING_REQUEST`, `USER_UPDATE_BOOKING_REQUEST`, `USER_DELETE_BOOKING_REQUEST`, `USER_CANCEL_BOOKING_REQUEST`, `USER_GET_ADMIN_TK`, `USER_PROMOCODE_REDEEM`, `USER_SYSTEM_CREDIT_ADD`, `USER_SYSTEM_CREDIT_CONSUMED`, `USER_SYSTEM_CREDIT_REMOVED`, `USER_PRODUCT_CHARGED`, `USER_TRIP_INVOICE_CREATED`, `USER_TRIP_EXPENSE_CREATED`, `USER_TRIP_INVOICE_UPDATED`, `USER_PRODUCT_INVOICE_CREATED`, `USER_PRODUCT_EXPENSE_CREATED`, `USER_PRODUCT_INVOICE_UPDATED`, `VEHICLE_ADDED_TO_STATION`, `VEHICLE_REMOVED_FROM_STATION`, `VEHICLE_ALLOCATED`, `VEHICLE_TOWED`, `VEHICLE_INTEGRATE_DEL`, `VEHICLE_ARCHIVED`, `VEHICLE_DELETE`, `VEHICLE_UPDATED`, `VEHICLE_UPDATED_VUBOX`, `VEHICLE_REMOVE_VUBOX`, `VEHICLE_ASSIGN_VUBOX`, `VEHICLE_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE`, `VEHICLE_SCHEDULED_OUT_OF_SERVICE_CANCELED`, `VEHICLE_UNLOCK`, `VEHICLE_LOCK`, `VEHICLE_BATTERY_LOCK`, `VEHICLE_BATTERY_UNLOCK`, `VEHICLE_HELMET_LOCK`, `VEHICLE_HELMET_UNLOCK`, `VEHICLE_SPARE_LOCK`, `VEHICLE_SPARE_UNLOCK`, `VEHICLE_PILE_LOCK`, `VEHICLE_PILE_UNLOCK`, `VEHICLE_SPEED_LIMIT_CHANGED`, `VEHICLE_WAKE_UP`, `VEHICLE_WAKE_UP_ACCEL`, `VEHICLE_WAKE_UP_BLE`, `VEHICLE_CONNECTIVITY_ONLINE`, `VEHICLE_CONNECTIVITY_OFFLINE`, `VEHICLE_CONNECTIVITY_INTERRUPTED`, `VEHICLE_OUT_OF_COM`, `VEHICLE_BOOKING_STATUS_CHANGED`, `VEHICLE_GET_STATUS`, `VEHICLE_SCHEDULED_REBOOT`, `VEHICLE_WARNING`, `VEHICLE_CRUISING_RANGE_LOW`, `VEHICLE_CRUISING_RANGE_CRITICAL`, `VEHICLE_ACCEL_ALERT`, `VEHICLE_SPEED_ALERT`, `VEHICLE_CKH_UPDATE`, `VEHICLE_RECOVERY`, `VEHICLE_SYNC`, `VEHICLE_STANDBY`, `VEHICLE_AUTOCLOSE_ON`, `VEHICLE_AUTOCLOSE_OFF`, `VEHICLE_IGNITION_ON`, `VEHICLE_IGNITION_OFF`, `VEHICLE_REBOOT`, `VEHICLE_MOBILIZE`, `VEHICLE_IMMOBILIZE`, `VEHICLE_IMMOBILIZER_OOT`, `VEHICLE_ENABLE`, `VEHICLE_MAGIC_CARD`, `VEHICLE_CLEANLINESS_RESET`, `VEHICLE_ADD_ZONE`, `VEHICLE_REMOVE_ZONE`, `VEHICLE_RELEASE_TRIP`, `VEHICLE_START_TRIP`, `VEHICLE_END_TRIP`, `VEHICLE_EDIT_TRIP`, `VEHICLE_MANUAL_END_TRIP`, `VEHICLE_TRACKING_ON`, `VEHICLE_TRACKING_OFF`, `VEHICLE_TRIP_TERMINATION`, `VEHICLE_PAUSE_TRIP`, `VEHICLE_FORCED_PAUSE_TRIP`, `VEHICLE_RESUME_TRIP`, `VEHICLE_EXPERT`, `VEHICLE_PASSTHROUGH`, `VEHICLE_PING`, `VEHICLE_CANCEL_TRIP`, `VEHICLE_REMOVE_PRODUCT_TRIP`, `VEHICLE_BOOK`, `VEHICLE_ADD_PRODUCT_TRIP`, `VEHICLE_UPDATE_REASON`, `VEHICLE_RESET_CLEAN_DATE`, `VEHICLE_RESET_REDISTRIB_DATE`, `VEHICLE_RESET_MOVING_DATE`, `VEHICLE_RESET_BOOKING_CONTEXT`, `VEHICLE_ARCHIVED_FM`, `VEHICLE_ANTITHEFT_ON`, `VEHICLE_ANTITHEFT_OFF`, `VEHICLE_CHARGING_ACTIVE`, `VEHICLE_CHARGING_ENDED`, `VEHICLE_CHARGING_PLUGGED`, `VEHICLE_CHARGING_UNPLUGGED`, `VEHICLE_BATTERY_OK`, `VEHICLE_BATTERY_LOW`, `VEHICLE_BATTERY_CRITICAL`, `VEHICLE_DOORS_OPEN`, `VEHICLE_DOORS_CLOSED`, `VEHICLE_WINDOWS_OPEN`, `VEHICLE_WINDOWS_CLOSED`, `VEHICLE_ALERT`, `VEHICLE_FATAL`, `VEHICLE_PRICING_CHANGED`, `VEHICLE_GROUP_CHANGED`, `VEHICLE_UPDATE_ODOMETER`, `VEHICLE_UPDATE_STATUS`, `VEHICLE_UPDATE_GPS_MANUAL`, `VEHICLE_UPDATE_GPS_SIM`, `VEHICLE_RFID_SYNC`, `VEHICLE_PREAUTH_CONFIRMED`, `VEHICLE_PREAUTH_REJECTED`, `VEHICLE_PREAUTH_EXPIRED`, `VEHICLE_PREAUTH_CANCELLED`, `USER_PRODUCT_INVOICE_CANCELLED`, `USER_TRIP_INVOICE_CANCELLED`, `USER_PRODUCT_INVOICE_REFUSED`, `USER_TRIP_INVOICE_REFUSED`, `USER_TRIP_INVOICE_PAID`, `USER_PRODUCT_INVOICE_PAID`, `USER_TRIP_INVOICE_REFUNDED`, `USER_PRODUCT_INVOICE_REFUNDED`, `USER_PLAN_SUBSCRIBED`, `USER_PLAN_UNSUBSCRIBED`, `USER_PLAN_EXPIRED`, `USER_PLAN_RENEWED`, `USER_PLAN_RENEWAL`, `USER_PLAN_CANCELED`, `USER_PLAN_UPDATED`, `USER_PLAN_PERIODIC_TIME_WALLET_CHARGED`, `USER_PLAN_PERIODIC_TIME_WALLET_CONSUMED`, `USER_PLAN_RENEWAL_FAILED`, `USER_PLAN_CREDITS_FAILED`, `USER_UPDATE_TRIP`, `USER_REFERRAL_CREATED`, `USER_REFERRAL_CHECKED`, `USER_REPORT_CREATED`, `USER_REPORT_UPDATED`, `USER_DOC_UPDATED`, `USER_BILLING_GROUP_ADDED`, `USER_BILLING_GROUP_REMOVED`, `VEHICLE_ADDED_TO_SERVICE`, `VEHICLE_REMOVED_FROM_SERVICE`, `USER_RFIDPINCODE_REQUESTED`, `VEHICLE_REFILLED`, `VEHICLE_DIAG_GPS`, `VEHICLE_DIAG_CAN`, `VEHICLE_DIAG_MOBILIZER`, `VEHICLE_DIAG_IMMOBILIZER`, `VEHICLE_DIAG_LOCK`, `VEHICLE_DIAG_UNLOCK`, `VEHICLE_DIAG_ANALOG`, `VEHICLE_DIAG_CKH`, `VEHICLE_DIAG_RFID`, `VEHICLE_DIAG_SPEAK`, `VEHICLE_DIAG_HZ_LED`, `VEHICLE_BLE_AUTH`, `VEHICLE_BLE_START_FLOW`, `VEHICLE_BLE_START_ISSUE`, `VEHICLE_FIRMWARE_UPDATE`, `VEHICLE_FLEET_SWAP`, `USER_TRIP_EVENT_MAP_DISPLAY_GDPR`, `USER_AUTOMATICALLY_REFUNDED`, `USER_TRIP_CREDIT_REFUNDED`, `USER_PRODUCT_CREDIT_REFUNDED`, `USER_PRODUCT_TIME_WALLET_CHARGED`, `USER_PRODUCT_TIME_WALLET_CONSUMED`, `USER_CREDIT_REFUNDED`, `USER_ALL_CREDIT_REFUNDED`, `USER_PREPAYMENT_SUCCEEDED`, `USER_PREPAYMENT_FAILED`, `USER_CREATE_SUBSCRIPTION`, `USER_UPDATE_SUBSCRIPTION`, `GRACE_PERIOD_APPLIED`, `USER_LABEL_CREATED`, `USER_LABEL_DELETED`, `VEHICLE_UNAVAILABILITIES_ADD`, `VEHICLE_UNAVAILABILITIES_DELETE`, `VEHICLE_UNAVAILABILITIES_UPDATE`, `VEHICLE_ZONE_IN`, `VEHICLE_ZONE_OUT`, `USER_INSURANCE_CREATED`, `USER_INSURANCE_UPDATED`, `USER_DEPOSIT_CREATED`, `USER_DEPOSIT_CAPTURED`, `USER_DEPOSIT_CANCELLED`, `USER_INVOICE_PDF_GENERATION` | yes | Event's type |
| date | string (date-time) | yes |  |
| failed | boolean | yes |  |
| errorCode | integer (int32) | no |  |
| originId | string | yes |  |
| transactionId | string | no |  |
| insertionDate | string (date-time) | no |  |
| deletionDate | string (date-time) | no |  |
| ticketId | string | no |  |
| ticketCategoryId | integer (int32) | no |  |
| ticketGroupId | integer (int32) | no |  |
| version | string | no |  |
| doNotTrack | boolean | no |  |
| extraInfo | object | no |  |

**Responses:** `201` → `EventDTO`

### GET `/trip/fleets/{fleetId}/customer_trips`

authFetch path: `user/trip/fleets/{fleetId}/customer_trips` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `filter`: CustomerTripFilter (required)
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/sessions`
Get sessions (for Mobility Gateway)

authFetch path: `user/trip/fleets/{fleetId}/sessions` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `filter`: TripSessionFilter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `CursorPaginationSliceTripSessionDTO`

### GET `/trip/fleets/{fleetId}/sessions/{sessionId}`
Get sessions by ID (for Mobility Gateway)

authFetch path: `user/trip/fleets/{fleetId}/sessions/{sessionId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `sessionId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TripSessionDTO`

### GET `/trip/fleets/{fleetId}/trips`
List trip summaries of a fleet

it's a paginated call

authFetch path: `user/trip/fleets/{fleetId}/trips` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: string (optional) — List the trips with a booking Date from this date
- `endDate`: string (optional) — List the trips with a booking Date until this date
- `serviceId`: string (optional) — Filter by serviceId
- `suspicious`: Boolean (optional) — return only the suspicious trips
- `isBilled`: Boolean (required) — return only the trips where an invoice has been generated
- `isBillingInterrupted`: boolean (optional)
- `ticketCategoryId`: integer (int32) (optional)
- `ticketGroupId`: integer (int32) (optional)
- `isCancelled`: Boolean (optional) — return only the trips cancelled
- `distanceFrom`: number (optional)
- `distanceTo`: number (optional)
- `durationFrom`: number (optional)
- `durationTo`: number (optional)
- `plate`: string (optional)
- `isReleased`: Boolean (optional) — return only the trips which have been released
- `adjusted`: Boolean (optional) — return only the trips which have been adjusted/overridden

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/endDate`
Get trips summaries (by trip's end date). It's a paginated end point.

authFetch path: `user/trip/fleets/{fleetId}/trips/endDate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)
- `endDateFrom`: string (required) — from end date
- `endDateTo`: string (required) — to end date

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### POST `/trip/fleets/{fleetId}/trips/handle-event`
callback from payment gateway to complete legacy preauth flow

authFetch path: `user/trip/fleets/{fleetId}/trips/handle-event` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PaymentEvent`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `payment_intent.succeeded,payment_intent.canceled,payment_intent.processing,payment_intent.requires_action,payment_intent.amount_capturable_updated,setup_intent.succeeded,setup_intent.canceled,setup_intent.setup_failed,setup_intent.requires_action,refund.updated,customer.updated` | yes | event type |
| data | object | yes | event object, can be a Customer, a Payment Intent, a Setup Intent or a PaymentRefund |
| previousAttributes | object | no | attributes changes that trigger this event. list of (key,value) pair where key is the name of updated attribute and value its previous value (new value is alre… |

**Responses:** `200`

### POST `/trip/fleets/{fleetId}/trips/ongoing`
Retrieves the ongoing trips for a given fleet based on the provided fleet ID and trip IDs. This includes non-final payment intents and payment receipts associated with the trips.

authFetch path: `user/trip/fleets/{fleetId}/trips/ongoing` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `200` → `OnGoingTripDTO[]`

### GET `/trip/fleets/{fleetId}/trips/services/{id}`
Get trips summaries for a given serviceId

authFetch path: `user/trip/fleets/{fleetId}/trips/services/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/servicetypes/{serviceType}`
Get trips summaries for a given type of service

It's a paginated end point

authFetch path: `user/trip/fleets/{fleetId}/trips/servicetypes/{serviceType}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `serviceType`: string (required) — service type

**Query params:**
- `pageable`: Pageable (required)
- `ticketCategory`: integer (int32)[] (optional)
- `plate`: string[] (optional)
- `userId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/users/{userId}`
Get trips summaries for a given userId. It's a paginated end point.

authFetch path: `user/trip/fleets/{fleetId}/trips/users/{userId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: string (optional) — from this date
- `endDate`: string (optional) — to this date
- `profileType`: string (optional) — Filter by profileType

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/users/{userId}/services/{id}`
Get trips summaries for given user on a given service

authFetch path: `user/trip/fleets/{fleetId}/trips/users/{userId}/services/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `id`: string (required) — id

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/vehicles/{vehicleId}`
Get trips summaries for a given vehicleId

It's a paginated end point

authFetch path: `user/trip/fleets/{fleetId}/trips/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `vehicleId`: string (required) — vehicleId

**Query params:**
- `pageable`: Pageable (required)
- `startDate`: string (optional) — from this date
- `endDate`: string (optional) — to this date

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip[]`

### GET `/trip/fleets/{fleetId}/trips/{tripId}`
Get a trip summary by tripId

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — unique id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip`

### POST `/trip/fleets/{fleetId}/trips/{tripId}`
Update a trip summary by tripId

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — unique id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Trip`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripId | string | yes | TripId (orderId) generated at the booking/allocation of the vehicle |
| fleetId | string | yes | fleetId |
| userId | string | yes | Id of the user who did the trip |
| profileId | string | yes | ProfileId of the user who did the trip |
| profileType | string | yes | Profile of the user who did the trip (Single or Business) |
| vehicleId | string | yes | Id of the vehicle used during the trip |
| length | number | yes | Mileage of the trip in Km or miles |
| duration | number | yes | Total duration in minutes of the trip including from the booking date to the end date |
| pauseDuration | number | yes | Total duration in minutes of all the cumulated pause periods |
| tripDuration | number | yes | Total duration - Booking Duration |
| bookingDuration | number | yes | Total duration in minutes between the booking date and the start trip date (first unlock) |
| drivingDuration | number | yes | Total duration in minutes of all the cumulated driving periods |
| date | string (date-time) | yes | Booking Date |
| endDate | string (date-time) | yes | End Date |
| additionalInfo | AdditionalInfo | no |  |
| pricingId | string | yes | pricing id |
| productIds | string[] | no |  |
| serviceId | string | yes | service id |
| serviceType | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | yes | Type of service |
| theorStartDate | string (date-time) | yes | Theoretical start date, it's start date requested by the user in schedule booking (not used in direct booking or free floating) |
| theorEndDate | string (date-time) | yes | Theoretical end date, it's end date requested by the user in schedule booking (not used in direct booking or free floating) |
| ticketInfo | TicketInfo | no |  |
| tripEvents | TripEvent[] | no | List of events recorded by the box during the trip (supported only by the vubox) |
| lastUpdateDate | string (date-time) | no | Date of the last change |

**Responses:** `200` → `Trip`, `202` → `Trip`, `400` → `Trip`, `500` → `Trip`

### POST `/trip/fleets/{fleetId}/trips/{tripId}/generate`

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}/generate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Trip`, `202` → `Trip`, `400` → `Trip`, `500` → `Trip`

### GET `/trip/fleets/{fleetId}/trips/{tripId}/history`
Get trip history

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}/history` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TripHistory`

### POST `/trip/fleets/{fleetId}/trips/{tripId}/notes`

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}/notes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `TripNoteDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | string | no |  |

**Responses:** `200` → `TripNoteDTO`

### GET `/trip/fleets/{fleetId}/trips/{tripId}/ongoing`
Retrieves an ongoing trip for a given fleet based on the provided fleet ID and trip ID. This includes non-final payment intents and payment receipts associated with the trips.

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}/ongoing` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `OnGoingTripDTO`

### POST `/trip/fleets/{fleetId}/trips/{tripId}/pay`
Manually execute a payment related to a trip

authFetch path: `user/trip/fleets/{fleetId}/trips/{tripId}/pay` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `TripManualPaymentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| online | boolean | no | true to specify that the shopper is online |
| scope | string: `DEPOSIT`, `RENTAL` | yes | return url passed to the payment provider, used at the end of a 3ds flow |
| amountType | string: `FIXED,PERCENTAGE` | no | Payment amount type, can be a fixed amount of a percentage |
| amountValue | number | no | amount that must override the payment parameter configuration (can be a percentage of a fixed value depending on installed configuration) |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |
| useSystemCredit | boolean | no | pass true to use available valid system credit to pay the requested amount |
| paymentParametersReferenceId | string | no | in case of multiple payment configuration flows, specify the one you want to execute |

**Responses:** `200` → `OnGoingTripDTO`

### POST `/trip/fleets/{fleetId}/users/{userId}/vehicles/{vehicleId}/trips/{tripId}/end`
end trip for a vehicle (this endpoint replace the existing one in Fleet Manager)

authFetch path: `user/trip/fleets/{fleetId}/users/{userId}/vehicles/{vehicleId}/trips/{tripId}/end` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `vehicleId`: string (required) — vehicleId
- `tripId`: string (required) — unique id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`, `400` → `string`, `403` → `string`, `404` → `string`, `409` → `string`, `410` → `string`, `424` → `string`, `500` → `string`

### POST `/trip/fleets/{fleetId}/vehicles/{vehicleId}/trips/{tripId}/force-end`
end trip for a vehicle from expert Mode (this endpoint replace the existing one in Fleet Manager)

authFetch path: `user/trip/fleets/{fleetId}/vehicles/{vehicleId}/trips/{tripId}/force-end` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `vehicleId`: string (required) — vehicleId
- `tripId`: string (required) — unique id of the trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`, `400` → `string`, `404` → `string`, `409` → `string`, `410` → `string`, `500` → `string`

### GET `/trip/v2/fleets/{fleetId}/trips`
Get trips v2

authFetch path: `user/trip/v2/fleets/{fleetId}/trips` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `filter`: TripV2Filter (required)
- `pageable`: CursorPageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `CursorPaginationSliceTripV2DTO`

### GET `/trip/v2/fleets/{fleetId}/trips/count`
Get trip v2 count

authFetch path: `user/trip/v2/fleets/{fleetId}/trips/count` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `filter`: TripV2Filter (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `JSONObject`
