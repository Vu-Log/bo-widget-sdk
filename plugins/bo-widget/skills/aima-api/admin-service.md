# AIMA Admin Service API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-service (23 endpoints)

### GET `/by-service/fleets/{fleetId}/services`
The list of services (the full version) including the list of zones, vehicles, pois, stations.

Beware this response can be huge, if you have a large fleet with a lot of vehicles and zones.As this call is costly, it must be put in cache instead of doing a call to this api too frequently.

authFetch path: `user/by-service/fleets/{fleetId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleet id

**Header params:**
- `x-user-id`: string (required)
- `If-None-Match`: string (optional) — Previous ETag; returns 304 when the representation is unchanged
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull[]`, `304` → `ServiceFull[]`, `404` → `ServiceFull[]`

### PUT `/by-service/fleets/{fleetId}/services/{id}/vehicles/{vehicleId}`
Assign a vehicle to a service

A vehicle must be with the status FREE and assigned to a service to appears in the list of available vehicles. Please note this won't impact the current trips but only the new booking

authFetch path: `user/by-service/fleets/{fleetId}/services/{id}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (required)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### GET `/by-service/fleets/{fleetId}/services/{serviceId}`
Get service by id

authFetch path: `user/by-service/fleets/{fleetId}/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleet id
- `serviceId`: any (required) — The serviceId

**Header params:**
- `x-user-id`: string (required)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull`

### GET `/fleets/{fleetId}/services`
The list of services (the full version) including the list of zones, vehicles, pois, stations.

Beware this response can be huge, if you have a large fleet with a lot of vehicles and zones.As this call is costly, it must be put in cache instead of doing a call to this api too frequently.

authFetch path: `user/fleets/{fleetId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `If-None-Match`: string (optional) — Previous ETag; returns 304 when the representation is unchanged
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull[]`, `304` → `ServiceFull[]`, `404` → `ServiceFull[]`

### POST `/fleets/{fleetId}/services`
Create a Service

NOTE that you can put a cityId in request body to associate it to a city. The vehicles, pois, zones, stations must be linked to the service after its creation. Please contact us if you plan to create more than 50 services for a fleet.

authFetch path: `user/fleets/{fleetId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `forceGracePeriod`: boolean (optional) — if true, skip proximity-check validation for grace period during service creation

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ServiceDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Service UID |
| name | string | yes | Service name (public name) |
| status | string: `ACTIVE`, `DISABLED` | yes | status (active or disabled) |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | yes | The service type will define the business rules applicable during the booking process: * Free Floating: the user can book any available vehicles even those whi… |
| fleetId | string | yes | FleetId |
| cityId | string | no | City UUID |
| bookingValidity | integer (int32) | yes | Booking Validity in seconds. Only applicable for Free Floating. The duration allowed before the automatic expiration of a booking. for round trip booking, the… |
| visibility | string: `PUBLIC`, `PRIVATE` | yes | Service visibility: * Public: every users registered can subscribe to those services * Private: accessible only if the user's profile is linked to an entity wh… |
| autoApprovalStrategy | string: `MANUAL`, `CITY_SCOPED_STRICT`, `CITY_SCOPED`, `FRANCHISE_SCOPED_STRICT`, `FRANCHISE_SCOPED` | no | AutoApproval strategy (MANUAL by default |
| zoneFillColor | string | no | Color code of graphic area used to represent the service's zones in the backoffice and the application |
| zoneOutlineColor | string | no | Color code of outline used to represent the service's zones in the backoffice and the application |
| maxConcurrentTrips | integer (int32) | no |  |
| highestRangeEnabled | boolean | no | Enables the sorting of vehicles by range (autonomy1) |
| scheduleAtripEnabled | boolean | no | true if this is a schedule a trip |
| zoneCheckEnabled | boolean | no | Default value TRUE, unless user changes it to false at service level |
| isCustomPricingEnabled | boolean | no |  |
| maxAdditionalDrivers | integer (int32) | no | Default value 0, means Additional Driver feature is disabled for adding any new driver |
| nearEndThreshold | integer (int32) | no | Default value NULL. It is the percentage of the trip after which the user should be notified |
| nextOverdueReturnNotification | integer (int32) | no | Delay in minutes between recurring overdue return notifications. Default value 0 (feature disabled). Must be 0 if maxOverdueReturnNotifications <= 1, must be >… |
| maxOverdueReturnNotifications | integer (int32) | no | Maximum number of overdue return notifications to send. Default value 0 (feature disabled). If 1, only one notification is sent (nextOverdueReturnNotification… |
| maxOccurrencesBookingExtension | integer (int32) | no | Maximum number of booking extension occurrences allowed for this service. 0 uses product default behavior. |
| tripPrivacyStrategy | string: `TRACKING`, `TRACKING_PAUSE`, `NO_TRACKING` | no | Trip privacy strategy (TRACKING by default if serviceType is SERVICE_TRIP otherwise TRACKING_PAUSE) |
| tripDurationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | yes | it set the strategy used to calculate the trip duration |
| handDeliveryEnabled | boolean | no | Hand delivery enabled (false by default) the lock/unlock will be done with the physical key |
| serviceAdditionalInfo | ServiceAdditionalInfoDTO | no | Service Additional Information |
| stationAvailableSpotCheckingEnabled | boolean | no |  |
| requiredManualApproval | boolean | no | Will enable disable manual approval based on the value set, default it is false |
| extensionsBillingMode | string: `ON_TRIP`, `ON_EXTENSION` | no | Setting the billing mode on extensions |
| dstManagement | boolean | no | DST Management flag. false (default): User pays the real duration (DST excluded). true: User pays the calculated duration (DST included) |
| excludeFromBilling | string: `Business`, `Single`, `ALL`, `NONE` | no | Setting the profile types excluded from internal billing / reserved for external billing |
| separateInvoice | boolean | no | Invoices for business profile products should be cumulative if false or separate if true |
| uxMode | string | no | UX mode such as Okai. |
| gracePeriodInMinutes | integer (int32) | no | grace period in Minutes. Default value is 0 (disabled). If greater than 0, service type must be FREE_FLOATING. |
| bleStartFlow | boolean | no | BLE start flow enabled (false by default) |
| insuranceMandatory | boolean | no | Whether insurance is mandatory for this service (false by default). |
| depositRequired | boolean | no | Whether a deposit is required for this service (false by default). |
| endDuringPause | boolean | no | End during pause enabled (false by default) |
| userStatusCheckAtBookingCreationAlsoRequiredForOperator | boolean | no | Indicates whether user status validation should be enabled during booking creation. When set to false, the service will bypass the default checks on the user's… |
| billingGroupOverrideEnabled | boolean | no | Billing Group Override Enabled (false by default): overriding billing group at ALLOCATION time |
| customPricingEnabled | boolean | no |  |

**Responses:** `201` → `ServiceDTO`, `400` → `ServiceFull`

### GET `/fleets/{fleetId}/services/overview`
Get services overview. Return a summarized view of the services grouped by visibility.

The response doesn't include the list of zones, vehicles, pois, stations ...

authFetch path: `user/fleets/{fleetId}/services/overview` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServicesOverviewResponse`

### GET `/fleets/{fleetId}/services/pois`
Get serviceId and linked pois

This endpoint retrieves the service as key and list of pois attached to service

authFetch path: `user/fleets/{fleetId}/services/pois` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### GET `/fleets/{fleetId}/services/zones`
Get serviceId and linked zones

This endpoint retrieves the service as key and list of zones attached to service

authFetch path: `user/fleets/{fleetId}/services/zones` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### GET `/fleets/{fleetId}/services/{id}`
Get service by id

authFetch path: `user/fleets/{fleetId}/services/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull`

### POST `/fleets/{fleetId}/services/{id}`
Update a Service

NOTE that if cityId is empty in request body, the city settings will be unassociated! The vehicles, pois, zones, stations must be unlinked to the service with a dedicated api call

authFetch path: `user/fleets/{fleetId}/services/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `forceGracePeriod`: boolean (optional) — if true, skip proximity-check validation for grace period during service update

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `UpdateServiceDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| status | string: `ACTIVE`, `DISABLED` | no |  |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | no |  |
| bookingValidity | integer (int32) | no |  |
| cityId | string | no |  |
| visibility | string: `PUBLIC`, `PRIVATE` | no |  |
| zoneFillColor | string | no |  |
| zoneOutlineColor | string | no |  |
| maxConcurrentTrips | integer (int32) | no |  |
| highestRangeEnabled | boolean | no | Enables the sorting of vehicles by range (autonomy1) |
| scheduleAtripEnabled | boolean | no | true if this is a schedule a trip |
| zoneCheckEnabled | boolean | no | Default value TRUE, unless user changes it to false at service level |
| isCustomPricingEnabled | boolean | no |  |
| autoApprovalStrategy | string: `MANUAL`, `CITY_SCOPED_STRICT`, `CITY_SCOPED`, `FRANCHISE_SCOPED_STRICT`, `FRANCHISE_SCOPED` | no | AutoApproval strategy (MANUAL by default |
| maxAdditionalDrivers | integer (int32) | no | Default value 0, means Additional Driver feature is disabled for adding any new driver |
| nearEndThreshold | integer (int32) | no | Default value NULL. It is the percentage of the trip after which the user should be notified |
| nextOverdueReturnNotification | integer (int32) | no | Delay in minutes between recurring overdue return notifications. Default value 0 (feature disabled). Must be 0 if maxOverdueReturnNotifications <= 1, must be >… |
| maxOverdueReturnNotifications | integer (int32) | no | Maximum number of overdue return notifications to send. Default value 0 (feature disabled). If 1, only one notification is sent (nextOverdueReturnNotification… |
| maxOccurrencesBookingExtension | integer (int32) | no | Maximum number of booking extension occurrences allowed for this service. Omit to leave unchanged; 0 uses product default behavior. |
| tripPrivacyStrategy | string: `TRACKING`, `TRACKING_PAUSE`, `NO_TRACKING` | no | Trip privacy strategy (TRACKING by default if serviceType is SERVICE_TRIP otherwise TRACKING_PAUSE) |
| tripDurationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | no | it set the strategy used to calculate the trip duration |
| handDeliveryEnabled | boolean | no |  |
| stationAvailableSpotCheckingEnabled | boolean | no |  |
| requiredManualApproval | boolean | no | Will enable disable manual approval based on the value set, default it is false |
| extensionsBillingMode | string: `ON_TRIP`, `ON_EXTENSION` | no | Setting the billing mode on extensions |
| dstManagement | boolean | no | DST Management flag. null: keep existing value. false: User pays the real duration (DST excluded). true: User pays the calculated duration (DST included) |
| excludeFromBilling | string: `Business`, `Single`, `ALL`, `NONE` | no | Setting the profile types excluded from internal billing / reserved for external billing |
| separateInvoice | boolean | no | Invoices for business profile products should be cumulative if false or separate if true |
| gracePeriodInMinutes | integer (int32) | no | grace period in Minutes. Default value is 0 (disabled). If greater than 0, service type must be FREE_FLOATING. |
| bleStartFlow | boolean | no | BLE start flow enabled (false by default) |
| insuranceMandatory | boolean | no | Whether insurance is mandatory for this service. |
| depositRequired | boolean | no | Whether a deposit is required for this service. |
| userStatusCheckAtBookingCreationAlsoRequiredForOperator | boolean | no | Indicates whether user status validation should be enabled during booking creation. When set to false, the service will bypass the default checks on the user's… |
| endDuringPause | boolean | no | End during pause enabled |
| billingGroupOverrideEnabled | boolean | no | Update Billing Group Override Enabled attribute: overriding billing group at ALLOCATION time. It can be null -> this means that no change should be performed |
| uxMode | string | no | UX mode such as Okai. |
| customPricingEnabled | boolean | no |  |

**Responses:** `200` → `Service`, `400` → `ServiceFull`

### PUT `/fleets/{fleetId}/services/{id}/pois/{poiId}`
Assign a Point of interest (parking ...) to a service

see the end point in admin-zone to get the list of available poiId. A service must not contains more than 100 pois.Please contact us if you need to manage more point of interests

authFetch path: `user/fleets/{fleetId}/services/{id}/pois/{poiId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `poiId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### DELETE `/fleets/{fleetId}/services/{id}/pois/{poiId}`
Remove a point of interest from a service

please note this won't impact the current trips but only the new booking

authFetch path: `user/fleets/{fleetId}/services/{id}/pois/{poiId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `poiId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### PUT `/fleets/{fleetId}/services/{id}/stations/{stationId}`
Assign a station to a service

Only needed for the service of type schedulebooking Please note this won't impact the current trips but only the new booking

authFetch path: `user/fleets/{fleetId}/services/{id}/stations/{stationId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### DELETE `/fleets/{fleetId}/services/{id}/stations/{stationId}`
Remove a station from a service

This station and the associated vehicles will disappear from the vehicle list Please note this won't impact the current trips but only the new booking

authFetch path: `user/fleets/{fleetId}/services/{id}/stations/{stationId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `stationId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### PUT `/fleets/{fleetId}/services/{id}/vehicles/{vehicleId}`
Assign a vehicle to a service

A vehicle must be with the status FREE and assigned to a service to appears in the list of available vehicles. Please note this won't impact the current trips but only the new booking

authFetch path: `user/fleets/{fleetId}/services/{id}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### PUT `/fleets/{fleetId}/services/{id}/zones/{zoneId}`
Assign a zone to a service

see the end point in admin-zone to get the list of available zoneIds.A service must not include more than 60 zones. Please contact us if you need to add more zones to a service.

authFetch path: `user/fleets/{fleetId}/services/{id}/zones/{zoneId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `zoneId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### DELETE `/fleets/{fleetId}/services/{id}/zones/{zoneId}`
Remove a zone from a service

Use this end point to unlink a zone to a service. please note this won't impact the current trips but only the new booking

authFetch path: `user/fleets/{fleetId}/services/{id}/zones/{zoneId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `zoneId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### POST `/fleets/{fleetId}/services/{serviceId}/energies`
Create the list of energy additional information for the service

This endpoint creates the list of energies related to the given service, with related information about price and type

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/energies` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `serviceId`: string (required) — The serviceId

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `EnergyServiceAdditionalInfoRequestDTO[]`

**Responses:** `201` → `EnergyServiceAdditionalInfoDTO[]`

### PUT `/fleets/{fleetId}/services/{serviceId}/energies/{energyType}`
Modify energy information by its type (key serviceId-energyType)

This endpoint modifies information about energy by its service and energy type

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/energies/{energyType}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `serviceId`: string (required) — The serviceId
- `energyType`: string (required) — The energy type

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `EnergyServiceAdditionalInfoUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| unitPrice | number | yes |  |
| measureUnit | string: `LITER`, `KWH` | yes |  |

**Responses:** `200` → `EnergyServiceAdditionalInfoDTO`

### DELETE `/fleets/{fleetId}/services/{serviceId}/energies/{energyType}`
Delete energy information by its type (key serviceId-energyType)

This endpoint deletes information about energy by its service and energy type

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/energies/{energyType}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `serviceId`: string (required) — The serviceId
- `energyType`: string (required) — The energy type

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### GET `/fleets/{fleetId}/services/{serviceId}/products`
Get ProductIds associated to the service and included in the product list given in parameters

Get ProductIds which are associated to the service given in path-parameter and included in the productIds list given in request-parameter

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `serviceId`: string (required)

**Query params:**
- `productIds`: string[] (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`

### DELETE `/fleets/{fleetId}/services/{serviceId}/vehicles/{vehicleId}`
Remove vehicle from a service

The vehicle won't be in the available vehicles list anymore

authFetch path: `user/fleets/{fleetId}/services/{serviceId}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `serviceId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `object`

### GET `/fleets/{fleetId}/users/{userId}/services/scheduleatripservice`
Get the list of services SaT for a fleet together with its models

This endpoint retrieves the service SaT for a fleet together with its models.

authFetch path: `user/fleets/{fleetId}/users/{userId}/services/scheduleatripservice` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `userId`: string (required)

**Query params:**
- `cityId`: string (optional)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull[]`
