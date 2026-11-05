# AIMA Admin Booking API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-booking (72 endpoints)

### GET `/by-service/fleets/{fleetId}/bookingrequests/stations/{stationId}/planning`

authFetch path: `user/by-service/fleets/{fleetId}/bookingrequests/stations/{stationId}/planning` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `stationId`: any (required) — The stationId of desired requests

**Query params:**
- `startDate`: any (required) — beginning of the range
- `endDate`: any (required) — end of the range
- `serviceTypes`: string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION`[] (optional) — List of service types
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `DboPlannerDTO`

### GET `/by-service/fleets/{fleetId}/services/{serviceId}/stations/{stationId}/models/{modelId}/bookingRequests`
Get the calendar of booking requests for a station

authFetch path: `user/by-service/fleets/{fleetId}/services/{serviceId}/stations/{stationId}/models/{modelId}/bookingRequests` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `serviceId`: string (required)
- `stationId`: string (required)
- `modelId`: integer (int64) (required)

**Query params:**
- `from`: string (date-time) (required)
- `to`: string (date-time) (required)
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestCalendarDTO[]`

### GET `/by-service/fleets/{fleetId}/stations/details`
Get List of Stations/Models by the given services

authFetch path: `user/by-service/fleets/{fleetId}/stations/details` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `serviceIds`: string[] (optional)
- `showTimetable`: any (optional) — Whether or not to show also the opening hours timetable for each station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationServiceOverviewDTO`

### GET `/fleets/{fleetId}/services/{serviceId}/stations/{stationId}/models/{modelId}/bookingRequests`
Get the calendar of booking requests for a station

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/stations/{stationId}/models/{modelId}/bookingRequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `serviceId`: string (required)
- `stationId`: string (required)
- `modelId`: integer (int64) (required)

**Query params:**
- `from`: string (date-time) (required)
- `to`: string (date-time) (required)
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestCalendarDTO[]`

### GET `/fleets/{fleetId}/stations/{stationId}/unavailability`
Get List of vehicle unavailability for a given station

authFetch path: `user/fleets/{fleetId}/stations/{stationId}/unavailability` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id
- `stationId`: string (required) — station uuid

**Query params:**
- `from`: string (required) — Beginning of the period
- `to`: string (required) — End of the period
- `serviceId`: string (required) — Service UUID

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `400` → `VehicleCalendarResponseDTO`

### GET `/scheduleATrip/fleets/{fleetId}/bookingrequests/users/{userId}/active`
Get active FF bookings for a given user

This endpoint will retrieve the active booking requests for a given user.

authFetch path: `user/scheduleATrip/fleets/{fleetId}/bookingrequests/users/{userId}/active` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### POST `/scheduledBooking/bookingrequests/paymentevent`
callback from payment gateway to complete booking request prepayment flow

authFetch path: `user/scheduledBooking/bookingrequests/paymentevent` (base path `/boapi/proxy/user`)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PaymentEvent`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `payment_intent.succeeded,payment_intent.canceled,payment_intent.processing,payment_intent.requires_action,payment_intent.amount_capturable_updated,setup_intent.succeeded,setup_intent.canceled,setup_intent.setup_failed,setup_intent.requires_action,refund.updated,customer.updated` | yes | event type |
| data | object | yes | event object, can be a Customer, a Payment Intent, a Setup Intent or a PaymentRefund |
| previousAttributes | object | no | attributes changes that trigger this event. list of (key,value) pair where key is the name of updated attribute and value its previous value (new value is alre… |

**Responses:** `200` → `string`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/status/{status}`
Get booking requests filtered by status

This endpoint will retrieve the booking request information for the given status

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/status/{status}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `status`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/status/{status}/filters`
Get all the booking requests filtered for fleet and status

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/status/{status}/filters` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `status`: BookingStatusBO (required)

**Query params:**
- `startDate`: string (date-time) (required)
- `endDate`: string (date-time) (required)
- `stationId`: string (optional)
- `modelId`: integer (int64) (optional)
- `vehicleId`: string (optional)
- `userId`: string (optional)
- `creationDate`: string (date-time) (optional)
- `serviceTypes`: string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION`[] (optional)
- `serviceIds`: string[] (optional)
- `includeProducts`: boolean (optional)
- `pageable`: Pageable (required)

**Header params:**
- `X-V-PAGETYPE`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/{id}`
Get Booking request information by id

This endpoint will retrieve the booking request information

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/{id}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `id`: any (required) — id of the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/{id}/preallocation`
Read the association vehicle-booking request for the given booking request id

In case no element is found, an exception is thrown

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/bookingrequests/{id}/preallocation` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `id`: any (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PreallocatedVehiclesDTO`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/stations`
List all the schedule booking stations

This endpoint will retrieve all stations.

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/stations` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `showTimetable`: any (optional) — Whether or not to show also the opening hours timetable for each station
- `showDescription`: any (optional) — Whether or not to show also the descriptions for each station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationWithTimetableDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/stations/models`
get available models grouped by station in a given time range filtered by service

This endpoint will retrieve the available model for a given station and a time range filtered by service.

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/stations/models` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `startDate`: any (required) — beginning of the date range
- `endDate`: any (required) — end of the date range
- `cityId`: string (optional)
- `userId`: string (optional)
- `profileId`: string (optional)
- `oneWayTrip`: boolean (optional)
- `showUnavailableModels`: boolean (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationDTO[]`, `400` → `StationDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}`
Get a station information by station Id

This endpoint will retrieve a station for a given station Id

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `stationId`: any (required) — id of the station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationWithTimetableDTO`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}/description`
Get the description of the station with different languages by given services

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}/description` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationDescription`, `400` → `StationDescription`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}/vehicles`
Get vehicles assigned to a station

This endpoint will retrieve all vehicles assigned to the given station

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/stations/{stationId}/vehicles` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `stationId`: any (required) — id of the station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO[]`, `400` → `VehicleDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/vehicles`
list the available vehicles (real time) for model and station filtered by service

This endpoint will retrieve available vehicles for the given model and station filtered by service

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `modelId`: any (required) — Id of the model requested
- `stationId`: string (required)
- `brId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`, `400` → `VehicleDTO[]`

### GET `/scheduledBooking/by-service/fleets/{fleetId}/vehiclesWithoutStation`
Returns the vehicles not assigned to a station.

This endpoint will retrieve the vehicles not assigned to a station.

authFetch path: `user/scheduledBooking/by-service/fleets/{fleetId}/vehiclesWithoutStation` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `serviceId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests`
Create a new booking request

This endpoint will create a new booking request.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `userStatusCheckRequired`: boolean (optional) — Allow to bypass the user status check of the user for an operator

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BookingRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | no | booking request id generated by the server |
| startDate | string (date-time) | yes | Start date of the booking |
| endDate | string (date-time) | yes | end date of the booking |
| returnedDate | string (date-time) | no | The vehicle real return date |
| profileId | string | yes | ProfilId of the user |
| vehicleId | string | no | vehicleId of the user when the booking request has a specific vehicle requested or when the vehiclehas been allocated by the server |
| modelId | integer (int64) | yes | modelId requested by the user |
| journeyId | string | no | The tripId associated with the booking request when the vehicle haas been allocated. |
| station | string | no |  |
| profileType | string | no |  |
| entityName | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | Last update date (set by the database on insert and on each row update) |
| realStartDate | string (date-time) | no | The date the booking was actually started (doors unlocked) |
| cancellationDate | string (date-time) | no | Cancellation date if the booking request has been cancelled |
| cancelledBy | string | no | id of the user who cancelled the booking |
| fleetId | string | yes | fleetId |
| userId | string | no | booking request owner |
| latitude | number (double) | no | Requested latitude of the pickup point (Radar) |
| longitude | number (double) | no | Requested longitude of the pickup point (Radar) |
| radius | integer (int32) | no | Radius of the pickup zone (Radar) |
| serviceId | string | yes | service id |
| warning | string | no | Warning attached to the booking request (if any) |
| email | string | no |  |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |
| credits | BookingRequestCreditDTO[] | no |  |
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| trip | Trip | no |  |
| failureReason | string | no |  |
| cityId | string | no |  |
| vehicleResidualValue | number | no |  |
| price | string | no |  |
| notes | string | no | Notes added to the booking request |
| plannedReturnDate | string (date-time) | no | The vehicle return date planned with the customer |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| dropOffStation | string | no |  |
| rollingContract | boolean | no |  |
| planDurationInMonths | integer (int32) | no |  |
| planName | string | no |  |
| parentId | string | no | corresponds to the BR Master Id |
| contractType | string: `SVS`, `MVS` | no |  |
| previous | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| productIds | string[] | no | IDs of the products associated with a booking at the time of booking creation. This field is optional. For multiplicity use productOccurrences. |
| preallocatedVehicleId | string | no | ID of the vehicle preallocated to the booking request. This field is optional. |
| bookingReferenceId | string | no |  |
| providedPricingId | string | no | The provided pricing ID to use for billing calculations. When provided, bypasses automatic pricing selection. |
| pricingDetails | PricingDetails[] | no | Output field containing the actual pricing details applied to the booking request |
| completed | boolean | no |  |
| earlyCancelledByUser | boolean | no |  |

**Responses:** `200` → `BookingRequestDTO`, `400` → `object`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/cancel/{id}`
Cancel booking request

This endpoint will cancel the booking request. The booking request will remain in the users's booking list as cancelled

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/cancel/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Query params:**
- `billing`: boolean (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/dateRange`
Get all the booking requests by date range

This endpoint will retrieve the booking request information for the given date range.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/dateRange` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `startDate`: string (optional) — beginning of the range
- `endDate`: string (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/dateRange/status/{status}`
Get booking requests by status in date range and status

This endpoint will retrieve the booking request information for the given date range and status.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/dateRange/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required) — Booking status

**Query params:**
- `startDate`: string (optional) — beginning of the range
- `endDate`: string (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `400` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/expired`
Get PENDING and ALERT booking requests

This endpoint will retrieve the expired booking requests that have a booking status of PENDING or ALERT. It's a paginated end point

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/expired` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)
- `maxDelayBeforeExpiring`: integer (int32) (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/references/{id}`
get booking request by it's referenceId

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/references/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/reminder`
Get all the booking request that they will start in the period of time

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/reminder` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `startInXHours`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestReminderDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/startDate`
get all booking requests by start date range

This endpoint will retrieve all the booking requests in a range of start date.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/startDate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `startDateFrom`: string (optional) — beginning of the range
- `startDateTo`: string (optional) — end of the range
- `serviceId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/startDate/status/{status}`
Get booking requests by start date range and status

This endpoint will retrieve the booking requests for a given date range and status.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/startDate/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required) — Booking status

**Query params:**
- `startDateFrom`: string (optional) — beginning of the range
- `startDateTo`: string (optional) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`, `400` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/stations/{stationId}/models/{modelId}/flexiblecalendar`
Calculate available time intervals for a given stationId and modelId

This endpoint returns available time intervals for the given station and model by start date and end date

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/stations/{stationId}/models/{modelId}/flexiblecalendar` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — ID of the station
- `modelId`: string (required) — ID of the model requested

**Query params:**
- `type`: string (optional)
- `minBookingDuration`: integer (int32) (optional)
- `startDate`: string (required) — Beginning of the range
- `endDate`: string (required) — End of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `FlexibleCalendarResponseDto`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/status/{status}`
Get booking requests filtered by status

This endpoint will retrieve the booking request information for the given status.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/status/{status}/filters`

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/status/{status}/filters` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `status`: BookingStatusBO (required)

**Query params:**
- `startDate`: string (date-time) (required)
- `endDate`: string (date-time) (required)
- `stationId`: string (optional)
- `modelId`: integer (int64) (optional)
- `vehicleId`: string (optional)
- `userId`: string (optional)
- `creationDate`: string (date-time) (optional)
- `serviceTypes`: string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION`[] (optional)
- `serviceIds`: string[] (optional)
- `includeProducts`: boolean (optional)
- `pageable`: Pageable (required)

**Header params:**
- `X-V-PAGETYPE`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/trip/{tripId}`
Get booking request associated to a tripId

This endpoint will retrieve the booking request associated to a tripId

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/trip/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — TripId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`, `400` → `BookingRequestDTO`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/users/{userId}`
get all booking requests by userID

This endpoint will retrieve all the booking request of an user.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/users/{userId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — id of the user

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/users/{userId}/bookings/active`
Get active SB bookings for a given user

This endpoint will retrieve the active booking requests for a given user.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/users/{userId}/bookings/active` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestResponseWithPricingInfoDTO[]`

### DELETE `/scheduledBooking/fleets/{fleetId}/bookingrequests/{bookingId}/journey`
Deallocate the vehicle from a scheduled booking request - remove journey from the booking

This endpoint will remove a vehicle from a booking request in scheduled booking

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{bookingId}/journey` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bookingId`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`, `400`, `404`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{bookingRequestId}/payments/{pspReference}/cancel`
Release deposit amount manually by providing fleetId, booking request and pspReference

Deposit will only be release if attached booking request is completed and all invoices are paid

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{bookingRequestId}/payments/{pspReference}/cancel` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `bookingRequestId`: string (required) — booking request Id
- `pspReference`: string (required) — Reference id from payment provider

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `400`, `404`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}`
Get Booking request information by id

This endpoint will retrieve the booking request information

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — id of the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}`
Update booking request

This endpoint will update the booking request.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional)

**Request body:** `BookingRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | no | booking request id generated by the server |
| startDate | string (date-time) | yes | Start date of the booking |
| endDate | string (date-time) | yes | end date of the booking |
| returnedDate | string (date-time) | no | The vehicle real return date |
| profileId | string | yes | ProfilId of the user |
| vehicleId | string | no | vehicleId of the user when the booking request has a specific vehicle requested or when the vehiclehas been allocated by the server |
| modelId | integer (int64) | yes | modelId requested by the user |
| journeyId | string | no | The tripId associated with the booking request when the vehicle haas been allocated. |
| station | string | no |  |
| profileType | string | no |  |
| entityName | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | Last update date (set by the database on insert and on each row update) |
| realStartDate | string (date-time) | no | The date the booking was actually started (doors unlocked) |
| cancellationDate | string (date-time) | no | Cancellation date if the booking request has been cancelled |
| cancelledBy | string | no | id of the user who cancelled the booking |
| fleetId | string | yes | fleetId |
| userId | string | no | booking request owner |
| latitude | number (double) | no | Requested latitude of the pickup point (Radar) |
| longitude | number (double) | no | Requested longitude of the pickup point (Radar) |
| radius | integer (int32) | no | Radius of the pickup zone (Radar) |
| serviceId | string | yes | service id |
| warning | string | no | Warning attached to the booking request (if any) |
| email | string | no |  |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |
| credits | BookingRequestCreditDTO[] | no |  |
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| trip | Trip | no |  |
| failureReason | string | no |  |
| cityId | string | no |  |
| vehicleResidualValue | number | no |  |
| price | string | no |  |
| notes | string | no | Notes added to the booking request |
| plannedReturnDate | string (date-time) | no | The vehicle return date planned with the customer |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| dropOffStation | string | no |  |
| rollingContract | boolean | no |  |
| planDurationInMonths | integer (int32) | no |  |
| planName | string | no |  |
| parentId | string | no | corresponds to the BR Master Id |
| contractType | string: `SVS`, `MVS` | no |  |
| previous | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| productIds | string[] | no | IDs of the products associated with a booking at the time of booking creation. This field is optional. For multiplicity use productOccurrences. |
| preallocatedVehicleId | string | no | ID of the vehicle preallocated to the booking request. This field is optional. |
| bookingReferenceId | string | no |  |
| providedPricingId | string | no | The provided pricing ID to use for billing calculations. When provided, bypasses automatic pricing selection. |
| pricingDetails | PricingDetails[] | no | Output field containing the actual pricing details applied to the booking request |
| completed | boolean | no |  |
| earlyCancelledByUser | boolean | no |  |

**Responses:** `200` → `BookingRequestDTO`, `400` → `BookingRequestDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/estimatedPrice`
Return an estimated price and a prepayment amount for a possible extended date

A valid extension Date in UTC format is required: YYYY-MM-DDTHH:MM:SSZ

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/estimatedPrice` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PrePaymentEstimationRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| extensionDate | string (date-time) | yes | Date until when the current booking might by extended |
| extensionStartDate | string (date-time) | no | Date until when the current booking might by extended from start date |

**Responses:** `200` → `PrePaymentEstimationResponseDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/payment`
Manually execute a payment related to a booking request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/payment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — id of the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BookingRequestManualPaymentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| online | boolean | no | true to specify that the shopper is online |
| scope | string: `DEPOSIT`, `RENTAL` | yes | return url passed to the payment provider, used at the end of a 3ds flow |
| amountType | string: `FIXED,PERCENTAGE` | no | Payment amount type, can be a fixed amount of a percentage |
| amountValue | number | no | amount that must override the payment parameter configuration (can be a percentage of a fixed value depending on installed configuration) |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |
| profileId | string | no | Profile id to use for the payment instead of the default one from the booking request |

**Responses:** `200` → `BookingRequestDTO`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/possibleExtensionDate`
Return a new date up to when the given booking request could be extended

This endpoint will retrieve the date when the given booking request could be extended

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/possibleExtensionDate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PossibleExtensionDateResponseDTO`

### GET `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation`
Read the association vehicle-booking request for the given booking request id

In case no element is found, an exception is thrown

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PreallocatedVehiclesDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation`
Update the pre-allocated vehicle, if present, given the booking request id and fleet id

In case no element is found or some precondition check fails, an exception is thrown

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Query params:**
- `vehicleId`: string (required) — id of the vehicle to allocate to the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PreallocatedVehiclesDTO`

### DELETE `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation`
Remove the pre-allocated vehicle, if present, given the booking request id and fleet id

In case no element is found, an exception is thrown

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation/vehicles/{vehicleId}`
Preallocate a vehicle to a booking request

This endpoint preallocates a specific vehicle to a booking request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/preallocation/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id
- `vehicleId`: string (required) — id of the vehicle to allocate to the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `201` → `PreallocatedVehiclesDTO`, `400` → `PreallocatedVehiclesDTO`, `401` → `PreallocatedVehiclesDTO`, `403` → `PreallocatedVehiclesDTO`, `404` → `PreallocatedVehiclesDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/status/allocated`

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/status/allocated` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `vehicleId`: string (required)
- `journeyId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestDTO`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/statusUpdate`
Update booking request

This endpoint will update the booking request.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/{id}/statusUpdate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BookingRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | booking request id generated by the server |
| creationDate | string (date-time) | yes | Creation date |
| updateDate | string (date-time) | no | Last update date (set by the database on insert and on each row update) |
| startDate | string (date-time) | yes | Start date of the booking |
| realStartDate | string (date-time) | no | The date the booking was actually started (doors unlocked) |
| endDate | string (date-time) | yes | end date of the booking |
| returnedDate | string (date-time) | no |  |
| profileId | string | yes | ProfilId of the user |
| cityId | string | no | city id |
| serviceId | string | yes | service id |
| vehicleId | string | no | vehicleId of the user when the booking request has a specific vehicle requested or when the vehiclehas been allocated by the server |
| modelId | integer (int64) | yes | modelId requested by the user |
| journeyId | string | no | The tripId associated with the vehicle haas been allocated. |
| station | string | no |  |
| dropOffStation | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| cancellationDate | string (date-time) | no | Cancellation date if the booking request has been cancelled |
| cancelledBy | string | no | id of the user who cancelled the booking |
| fleetId | string | yes | fleetId |
| userId | string | no | booking request owner |
| latitude | number (double) | no | Requested latitude of the pickup point (Radar) |
| longitude | number (double) | no | Requested longitude of the pickup point (Radar) |
| radius | integer (int32) | no | Radius of the pickup zone (Radar) |
| trip | Trip | no |  |
| failureReason | string | no |  |
| pricingProviders | BookingRequestPricingProvider[] | no |  |
| bookingRequestAdditionalInformation | BookingRequestAdditionalInformation | no |  |
| plannedReturnDate | string (date-time) | no | The vehicle return date planned with the customer |
| digitalContracts | DigitalContract[] | no |  |
| type | string: `SINGLE`, `MASTER`, `SLAVE` | no | the type of the BR. It can be : by default SINGLE(standard BR), MASTER(first BR crated for the flip subscription), SLAVE |
| parentId | string | no | corresponds to the BR Master id (1st BR created for the flip request) and which will be added to each BR slave to refer them to its master |
| bookingRequestContract | BookingRequestContract | no |  |
| extensions | BookingRequestExtension[] | no |  |
| preferredPaymentMethods | BookingRequestPreferredPaymentMethod[] | no | preferred payment method list to use for the payment |
| previous | string | no |  |
| completed | boolean | no |  |
| notes | string | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| products | Product[] | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryPostalCode | string | no |  |
| deliveryCity | string | no |  |
| planName | string | no |  |
| planDurationInMonths | integer (int32) | no |  |
| modelRate | number | no |  |
| modelBasePrice | number | no |  |
| vehicleResidualValue | number | no |  |
| rollingContract | boolean | no |  |
| thresholdDateLimit | string (date-time) | no |  |
| cancellationFeeAmount | number | no |  |
| deliveryAddressPresent | boolean | no |  |
| cancellationRequest | boolean | no |  |

**Responses:** `200` → `BookingRequestDTO`

### POST `/scheduledBooking/fleets/{fleetId}/schedulednotifications/nearEnd`
Notify all booking requests that are near the end

This endpoint will notify the booking requests whose elapsed time is close to the end

authFetch path: `user/scheduledBooking/fleets/{fleetId}/schedulednotifications/nearEnd` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ScheduledNotification[]`, `400` → `ScheduledNotificationDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/securitymargins`
Get all security margins

Retrieve all security margins

authFetch path: `user/scheduledBooking/fleets/{fleetId}/securitymargins` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SecurityMarginDTO[]`, `400` → `SecurityMarginDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/securitymargins`
Create a new security margin

This endpoint will create a new security margin.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/securitymargins` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SecurityMarginDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | name of the security margin |
| combinations | SecurityMarginDTO[] | no | list of combinations (service/model) |
| bookingSecurityMarginMinutes | integer (int32) | yes | value in minutes of the security margin (upper bound is configurable via the booking.securityMargin.maxMinutes property, default 10080 min = 7 days) |

**Responses:** `200` → `SecurityMarginDTO`

### GET `/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}`
Get a security margin by its id

Retrieve a security margin

authFetch path: `user/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `marginId`: string (required) — Id of the security margin

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SecurityMarginDTO`, `400` → `SecurityMarginDTO`, `404` → `SecurityMarginDTO`

### PUT `/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}`
Update a security margin

This endpoint will update a security margin.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `marginId`: string (required) — The security margin to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SecurityMarginDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | name of the security margin |
| combinations | SecurityMarginDTO[] | no | list of combinations (service/model) |
| bookingSecurityMarginMinutes | integer (int32) | yes | value in minutes of the security margin (upper bound is configurable via the booking.securityMargin.maxMinutes property, default 10080 min = 7 days) |

**Responses:** `200` → `SecurityMarginDTO`

### DELETE `/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}`
Delete a security margin

authFetch path: `user/scheduledBooking/fleets/{fleetId}/securitymargins/{marginId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `marginId`: string (required) — The security margin to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### GET `/scheduledBooking/fleets/{fleetId}/stations`
List all the schedule booking stations

This endpoint will retrieve all stations.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `showTimetable`: string (optional) — Whether or not to show also the opening hours timetable for each station
- `showDescription`: string (optional) — Whether or not to show also the descriptions for each station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationWithTimetableDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/stations`
create a station

This endpoint will create a new station.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Station`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Station Unique Id (generated by the platform at the creation) |
| zoneId | string | yes | Id of the zone linked with the station, this is zone is the area where the user is allowed to drop the vehicle. |
| taxZoneId | string | no |  |
| poiId | string | yes | It's the position of the pin on the map and the information related to the station |
| modificationDate | string (date-time) | no |  |
| fleetId | string | yes | FleetId |
| openTime | string | no |  |
| closeTime | string | no |  |
| maxAvailableSpots | integer (int32) | no | Maximum available vehicle parking spots allowed |

**Responses:** `200` → `Station`, `201` → `Station`, `400` → `Station`

### GET `/scheduledBooking/fleets/{fleetId}/stations/dropOff/available`
List all the schedule booking available stations

This endpoint returns all available stations for parking

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/dropOff/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `startDate`: string (optional) — beginning of the date range
- `endDate`: string (required) — end of the date range
- `modelId`: integer (int64) (optional)
- `profileId`: string (optional)
- `startingStationId`: string (required)
- `serviceId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationAvailabilityDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/stations/{stationId}`
Get a station information by station Id

This endpoint will retrieve a station for a given station Id

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — id of the station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationWithTimetableDTO`

### PUT `/scheduledBooking/fleets/{fleetId}/stations/{stationId}`
update a station

This endpoint will update a station for a given station Id

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — id of the station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Station`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Station Unique Id (generated by the platform at the creation) |
| zoneId | string | yes | Id of the zone linked with the station, this is zone is the area where the user is allowed to drop the vehicle. |
| taxZoneId | string | no |  |
| poiId | string | yes | It's the position of the pin on the map and the information related to the station |
| modificationDate | string (date-time) | no |  |
| fleetId | string | yes | FleetId |
| openTime | string | no |  |
| closeTime | string | no |  |
| maxAvailableSpots | integer (int32) | no | Maximum available vehicle parking spots allowed |

**Responses:** `200` → `Station`, `400` → `Station`, `404` → `Station`, `409` → `Station`

### PUT `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/taxzone/{zoneId}`
update a station by assigning a tax zone

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/taxzone/{zoneId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)
- `zoneId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationDTO`, `400` → `StationDTO`, `404` → `StationDTO`

### PUT `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/{vehicleId}`
assign vehicle to a station

This endpoint will asigne a vehicle to a station.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — id of the station
- `vehicleId`: string (required) — id of the vehicle to assign to the station

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Station`, `400` → `Station`, `404` → `Station`

### DELETE `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/{vehicleId}`
Unassign vehicle from a station

This endpoint will remove a vehicle from a station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/assign/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — id of the station
- `vehicleId`: string (required) — Id of the vehicle to remove from the booking request. It's not possible to remove a vehicle if the trip has already been started

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`, `404`

### GET `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description`
Get the description of the station with different languages

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationDescription`, `400` → `StationDescription`

### POST `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description`
Creation description of the station with different languages

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `StationDescription`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| stationId | string | no |  |
| infos | StationDescriptionInfo[] | yes |  |

**Responses:** `201` → `StationDescription`, `400` → `StationDescription`

### DELETE `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description`
remove description of station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### PUT `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description/languages/{languageTag}`
update description infos of station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description/languages/{languageTag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `stationId`: string (required) — The stationId
- `languageTag`: string (required) — the language can be use for the description

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `StationDescriptionInfo`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| language | string | yes | language |
| paragraphs | StationDescriptionParagraph[] | no |  |
| default | boolean | no |  |

**Responses:** `200` → `StationDescription`, `400` → `StationDescription`

### DELETE `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description/languages/{languageTag}`
remove one language of station description

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/description/languages/{languageTag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)
- `languageTag`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### DELETE `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/dismiss/taxzone`
update a station by deleting the associated tax zone

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/dismiss/taxzone` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StationDTO`, `400` → `StationDTO`, `404` → `StationDTO`

### GET `/scheduledBooking/fleets/{fleetId}/stations/{stationId}/models/{modelId}`
get model by station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/stations/{stationId}/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)
- `modelId`: string (required)

**Query params:**
- `startDate`: string (date-time) (required)
- `endDate`: string (date-time) (required)
- `profileId`: string (optional)
- `productIds`: string[] (optional)
- `userId`: string (optional)
- `pricingId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BookingRequestModelDTO`, `400` → `BookingRequestModelDTO`, `404` → `BookingRequestModelDTO`

### DELETE `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/journey`
Deallocate the vehicle from a subscription booking request - remove journey from subscription

This endpoint will remove a vehicle from a subscription booking request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/journey` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bookingId`: string (required) — Booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`, `400`, `404`

### GET `/scheduledBooking/fleets/{fleetId}/vehicles`
list the available vehicles (real time) for model and station

This endpoint will retrieve available vehicles for the given model and station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `modelId`: string (required) — Id of the model requested
- `stationId`: string (required)
- `brId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`, `400` → `VehicleDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/vehicles/available`
Filter and return only vehicleIds which are unavailable for Scheduled Maintenance

authFetch path: `user/scheduledBooking/fleets/{fleetId}/vehicles/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `VehicleUnavailabilityRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cronExpression | string | no |  |
| vehicleIds | string[] | no |  |
| duration | integer (int32) | no |  |
| fleetId | string | no |  |

**Responses:** `200` → `string[]`, `400` → `string[]`

### GET `/scheduledBooking/fleets/{fleetId}/vehiclesWithoutStation`
Returns the vehicles not assigned to a station.

This endpoint will retrieve the vehicles not assigned to a station.

authFetch path: `user/scheduledBooking/fleets/{fleetId}/vehiclesWithoutStation` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `serviceId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO[]`

### POST `/scheduledBooking/schedulednotifications/overdueReturn`
Notify all booking requests with overdue return

This endpoint will notify booking requests that have exceeded their end date

authFetch path: `user/scheduledBooking/schedulednotifications/overdueReturn` (base path `/boapi/proxy/user`)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ScheduledNotification[]`, `400` → `ScheduledNotificationDTO[]`
