# AIMA Other Admin API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-additional-driver (6 endpoints)

### DELETE `/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/expired`
Delete expired additional driver invitations

Called by the scheduler every 2 Hours to periodically delete the expired Additional Driver Invitations. An invitation is considered expired if the BR for which it is sent is COMPLETED

authFetch path: `user/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/expired` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### GET `/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/{id}`
get an invitation by id

This endpoint will return invitation by it's id

authFetch path: `user/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId
- `id`: string (required) — invitation id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AdditionalDriverOutputDTO`

### POST `/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/{invitationId}/profiles/{profileId}`
confirm the invitation of the additional driver

This endpoint will link additional driver to a booking request + remove invitation

authFetch path: `user/fleets/{fleetId}/bookingrequests/additionalDrivers/invitations/{invitationId}/profiles/{profileId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId
- `invitationId`: string (required) — invitation id
- `profileId`: string (required) — profile id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AdditionalDriverOutputDTO`, `400` → `AdditionalDriverOutputDTO[]`

### GET `/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers`
Get additional drivers

This endpoint will get additional drivers linked to booking request

authFetch path: `user/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId
- `bookingRequestId`: string (required) — Booking Request Id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AdditionalDriverOutputDTO[]`

### POST `/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers`
Add additional driver to booking request

This endpoint will add additional driver to booking request.

authFetch path: `user/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId
- `bookingRequestId`: string (required) — Booking Request Id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200` → `AdditionalDriverOutputDTO`

### DELETE `/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers`
Delete additional driver from booking request

This endpoint will delete additional driver from booking request.

authFetch path: `user/fleets/{fleetId}/bookingrequests/{bookingRequestId}/additionalDrivers` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — FleetId
- `bookingRequestId`: string (required) — Booking Request Id

**Query params:**
- `email`: string (optional) — Email

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`, `404`

## admin-charge-product-request (8 endpoints)

### GET `/fleets/{fleetId}/chargeRequests`
Get all Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `status`: string: `PENDING`, `ACCEPTED`, `REJECTED`, `ARCHIVED` (optional) — The status of the Request
- `productId`: string (optional) — The productId of your request
- `userId`: string (optional) — The userId of your request
- `entityId`: string (optional) — The entityId of your request
- `dealershipId`: string (optional) — The dealershipId of your request
- `agentId`: string (optional) — The agentId of your request
- `subscriptionId`: string (optional) — The subscriptionId to be associated to the request
- `creationDate`: string (optional) — The date for filtering the requests created during the day
- `creationDateFrom`: string (optional) — The reference date start for filtering the requests
- `creationDateTo`: string (optional) — The reference date end for filtering the requests
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ChargeProductRequestDTO[]`, `400` → `ChargeProductRequestDTO[]`

### POST `/fleets/{fleetId}/chargeRequests`
create a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ChargeProductRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string: `PENDING`, `ACCEPTED`, `REJECTED`, `ARCHIVED` | no |  |
| userId | string | yes | The userId to be charged |
| entityId | string | yes | The entityId to be charged |
| productId | string | yes | The productId to be charged |
| notes | string | no |  |
| price | number | no | The price of the product, if null the one of the product will be taken in consideration |
| dealershipAgentId | string | no |  |
| dealershipId | string | yes | Id of the dealer |
| attachmentUrls | AttachmentDTO[] | no |  |
| invoiceId | string | no | The generated invoice for this charge product request |
| subscriptionBookingRequestId | string | no | The booking request id linked to the charge product request |
| creationDate | string (date-time) | no |  |

**Responses:** `201` → `ChargeProductRequestDTO`, `400` → `ChargeProductRequestDTO`

### DELETE `/fleets/{fleetId}/chargeRequests/{chargeRequestId}/attachments/{attachmentId}`
Delete an attachment from a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests/{chargeRequestId}/attachments/{attachmentId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `chargeRequestId`: string (required) — The parent charge request
- `attachmentId`: string (required) — The attachmentId to be deleted

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`, `400`

### GET `/fleets/{fleetId}/chargeRequests/{id}`
Get a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of the charge request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ChargeProductRequestDTO`, `400` → `ChargeProductRequestDTO`

### PATCH `/fleets/{fleetId}/chargeRequests/{id}`
update a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of the charge request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ChargeProductRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string: `PENDING`, `ACCEPTED`, `REJECTED`, `ARCHIVED` | no |  |
| userId | string | yes | The userId to be charged |
| entityId | string | yes | The entityId to be charged |
| productId | string | yes | The productId to be charged |
| notes | string | no |  |
| price | number | no | The price of the product, if null the one of the product will be taken in consideration |
| dealershipAgentId | string | no |  |
| dealershipId | string | yes | Id of the dealer |
| attachmentUrls | AttachmentDTO[] | no |  |
| invoiceId | string | no | The generated invoice for this charge product request |
| subscriptionBookingRequestId | string | no | The booking request id linked to the charge product request |
| creationDate | string (date-time) | no |  |

**Responses:** `200` → `ChargeProductRequestDTO`, `400` → `ChargeProductRequestDTO`

### PUT `/fleets/{fleetId}/chargeRequests/{id}/attachments`
Add an empty attachment to a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests/{id}/attachments` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of the charge request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ChargeProductRequestDTO`, `400` → `ChargeProductRequestDTO`

### POST `/fleets/{fleetId}/chargeRequests/{id}/status/{status}`
Update the status of a Charge Product Request for a given fleet

authFetch path: `user/fleets/{fleetId}/chargeRequests/{id}/status/{status}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of the charge request
- `status`: string (required) — The new status of the request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### POST `/fleets/{fleetId}/chargerequests/webhook`
Update the attachmentURL coming from the backend

authFetch path: `user/fleets/{fleetId}/chargerequests/webhook` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `UploadWsDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| attachmentId | string | yes | The ID of the attachment that need to be updated |
| url | string | yes | URL of the resource |
| s3FileName | string | yes | The name of the resource |
| filename | string | yes | The original name of the file |

**Responses:** `200`, `400`

## admin-mobility-plan (13 endpoints)

### GET `/fleets/{fleetId}/plans`
Get all plans for a given fleet

authFetch path: `user/fleets/{fleetId}/plans` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `status`: string (optional) — The status of the plans to retrieve
- `page`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PlanResponseDTO[]`, `400` → `PlanResponseDTO[]`

### POST `/fleets/{fleetId}/plans`
create a new plan

authFetch path: `user/fleets/{fleetId}/plans` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PlanRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| period | string: `WEEK`, `MONTH`, `ANNUAL` | no |  |
| productId | string | no |  |
| systemCreditIncluded | number | no |  |
| systemCreditFrequencyMonthlyRenewal | boolean | no |  |
| billingGroupId | string | no |  |
| milesIncluded | integer (int32) | no |  |
| services | string[] | no |  |
| periodicTimeWallet | FreeTimeDTO | no |  |

**Responses:** `201` → `PlanResponseDTO`, `400` → `PlanResponseDTO`

### GET `/fleets/{fleetId}/plans/{planId}`
Get a plan by its id

authFetch path: `user/fleets/{fleetId}/plans/{planId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `planId`: string (required) — The planId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PlanResponseDTO`, `400` → `PlanResponseDTO`

### PUT `/fleets/{fleetId}/plans/{planId}`
Update a plan

authFetch path: `user/fleets/{fleetId}/plans/{planId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `planId`: string (required) — The planId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PlanRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| period | string: `WEEK`, `MONTH`, `ANNUAL` | no |  |
| productId | string | no |  |
| systemCreditIncluded | number | no |  |
| systemCreditFrequencyMonthlyRenewal | boolean | no |  |
| billingGroupId | string | no |  |
| milesIncluded | integer (int32) | no |  |
| services | string[] | no |  |
| periodicTimeWallet | FreeTimeDTO | no |  |

**Responses:** `200` → `PlanResponseDTO`, `201` → `PlanResponseDTO`, `400` → `PlanResponseDTO`

### PUT `/fleets/{fleetId}/plans/{planId}/deactivate`
Deactivate a plan

authFetch path: `user/fleets/{fleetId}/plans/{planId}/deactivate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `planId`: string (required) — The planId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `201`, `400`, `404`

### GET `/fleets/{fleetId}/plans/{planId}/subscriptions`
Get all subscriptions for a given plan

authFetch path: `user/fleets/{fleetId}/plans/{planId}/subscriptions` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `planId`: string (required) — The planId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SubscriptionDTO[]`, `400` → `SubscriptionDTO[]`

### GET `/fleets/{fleetId}/subscriptions`
Get all subscriptions for a given fleet with filters

authFetch path: `user/fleets/{fleetId}/subscriptions` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `entityId`: string (optional)
- `status`: string: `ACTIVE`, `PAYMENT_PENDING`, `EXPIRED`, `ACTIVATION_PENDING`, `RENEWAL_ERROR`[] (optional)
- `profileId`: string (optional)
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SubscriptionDTO[]`, `400` → `SubscriptionDTO[]`

### POST `/fleets/{fleetId}/subscriptions`
create a new subscription for a given fleet

authFetch path: `user/fleets/{fleetId}/subscriptions` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `CreateSubscriptionDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profileId | string | yes |  |
| planId | string | yes |  |

**Responses:** `201` → `SubscriptionDTO`, `400` → `SubscriptionDTO`, `404` → `SubscriptionDTO`

### GET `/fleets/{fleetId}/subscriptions/{id}`
Get a subscription for a given fleet by id

authFetch path: `user/fleets/{fleetId}/subscriptions/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `id`: string (required)
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SubscriptionDTO`, `400` → `SubscriptionDTO`, `404` → `SubscriptionDTO`

### PUT `/fleets/{fleetId}/subscriptions/{id}`
Update a subscription for a given fleet (It's a partial update)

authFetch path: `user/fleets/{fleetId}/subscriptions/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `JSONObject`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| empty | boolean | no |  |

**Responses:** `200` → `SubscriptionDTO`, `400` → `SubscriptionDTO`

### POST `/fleets/{fleetId}/subscriptions/{id}/unsubscribe`
Unsubscribe for a Mobility Plan

authFetch path: `user/fleets/{fleetId}/subscriptions/{id}/unsubscribe` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id of the user
- `id`: string (required) — The subscription id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `JSONObject`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| empty | boolean | no |  |

**Responses:** `200` → `SubscriptionDTO`, `400` → `SubscriptionDTO`, `404` → `SubscriptionDTO`

### POST `/server/subscriptions/renew`
Renew those subscriptions that expired and user didn't opt out

authFetch path: `user/server/subscriptions/renew` (base path `/boapi/proxy/user`)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `integer (int32)`, `400` → `integer (int32)`, `404` → `integer (int32)`

### POST `/server/subscriptions/system-credits`
Add monthly credits for annual subscriptions with monthly credits creation

authFetch path: `user/server/subscriptions/system-credits` (base path `/boapi/proxy/user`)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `integer (int32)`

## admin-notifier-simulator (2 endpoints)

### POST `/fleets/{fleetId}/notifications/simulate`
Send email with dynamic data provided and not hard coded

authFetch path: `notifier/fleets/{fleetId}/notifications/simulate` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes | The event to simulate |
| sendTo | string | yes | The email address (or phone number) used to send the email (or SMS) |
| subject | string | yes | The email subject |
| template | string (binary) | yes | The template to use to sent the email (or SMS) |
| data | string (binary) | yes | The data to merge with the template |

**Responses:** `202` → `string`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/simulatebasic`
basic email notification simulation for the given event: data are hard coded

authFetch path: `notifier/fleets/{fleetId}/notifications/simulatebasic` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes | The event to simulate |
| sendTo | string | yes | The email address (or phone number) used to send the email (or SMS) |
| subject | string | yes | The email subject |
| template | string (binary) | yes | The template to use to sent the email (or SMS) |

**Responses:** `202` → `string`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

## admin-notifier-templates (15 endpoints)

### GET `/fleets/{fleetId}/notifications/rules`
Retrieve the notification rules of the given fleet

authFetch path: `notifier/fleets/{fleetId}/notifications/rules` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Responses:** `200` → `NotifierBusinessRule[]`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/rules`
Create a notification rule

authFetch path: `notifier/fleets/{fleetId}/notifications/rules` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Request body:** `NotifierBusinessRuleAddUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| bearerType | string: `EMAIL`, `PUSH_NOTIFICATION`, `SMS`, `EMAIL_AND_SMS`, `FIREBASE`, `EMAIL_AND_SMS_AND_PUSH_NOTIFICATION`, `EMAIL_PUSH_NOTIFICATION`, `SMS_PUSH_NOTIFICATION` | yes |  |
| dispatchType | string: `USER`, `GROUP`, `USER_AND_GROUP` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| dispatchToId | NotifierDispatchToId[] | yes |  |
| dispatchBccId | NotifierDispatchToId[] | yes |  |
| b2bSkip | boolean | no |  |

**Responses:** `200` → `NotifierBusinessRuleDTO`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### GET `/fleets/{fleetId}/notifications/rules/{ruleId}`
Retrieve the notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Responses:** `200` → `NotifierBusinessRule`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/rules/{ruleId}`
Update the notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Request body:** `NotifierBusinessRuleAddUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| bearerType | string: `EMAIL`, `PUSH_NOTIFICATION`, `SMS`, `EMAIL_AND_SMS`, `FIREBASE`, `EMAIL_AND_SMS_AND_PUSH_NOTIFICATION`, `EMAIL_PUSH_NOTIFICATION`, `SMS_PUSH_NOTIFICATION` | yes |  |
| dispatchType | string: `USER`, `GROUP`, `USER_AND_GROUP` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| dispatchToId | NotifierDispatchToId[] | yes |  |
| dispatchBccId | NotifierDispatchToId[] | yes |  |
| b2bSkip | boolean | no |  |

**Responses:** `200` → `NotifierBusinessRuleDTO`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### DELETE `/fleets/{fleetId}/notifications/rules/{ruleId}`
Delete the notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Responses:** `200`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/rules/{ruleId}/addbcc`
Add BCC emails to a notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}/addbcc` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Request body:** `NotifierDispatchToId[]`

**Responses:** `200` → `NotifierBusinessRule`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/rules/{ruleId}/adduserid`
Add a user as recipient of the notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}/adduserid` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Request body:** `NotifierDispatchToId[]`

**Responses:** `200` → `NotifierBusinessRule`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### DELETE `/fleets/{fleetId}/notifications/rules/{ruleId}/removebcc`
Remove BCC emails from the notification rule

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}/removebcc` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Request body:** `NotifierDispatchToId[]`

**Responses:** `200` → `NotifierBusinessRule`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### DELETE `/fleets/{fleetId}/notifications/rules/{ruleId}/removeuserid`
Remove a recipient user from a notification rule with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/rules/{ruleId}/removeuserid` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `ruleId`: string (required)

**Request body:** `NotifierDispatchToId[]`

**Responses:** `200` → `NotifierBusinessRule`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### GET `/fleets/{fleetId}/notifications/templates`
Retrieve all notification templates for the given fleet

authFetch path: `notifier/fleets/{fleetId}/notifications/templates` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Responses:** `200` → `NotifierTemplate[]`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/templates`
Create a notification template

authFetch path: `notifier/fleets/{fleetId}/notifications/templates` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Request body:** `NotifierTemplateAddUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| templateType | string: `HTML`, `TEXT`, `JSON` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| language | string | yes |  |
| subject | string | yes |  |
| eventType | string | yes |  |

**Responses:** `200` → `NotifierTemplateDTO`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### GET `/fleets/{fleetId}/notifications/templates/{templateId}`
Retrieve the notification template with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/templates/{templateId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `templateId`: string (required)

**Responses:** `200` → `NotifierTemplate`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/templates/{templateId}`
Full update of the existing notification template with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/templates/{templateId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `templateId`: string (required)

**Request body:** `NotifierTemplateAddUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| templateType | string: `HTML`, `TEXT`, `JSON` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| language | string | yes |  |
| subject | string | yes |  |
| eventType | string | yes |  |

**Responses:** `200` → `NotifierTemplateDTO`, `400` → `NotifierResponseMsg`, `404` → `NotifierTemplateDTO`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### DELETE `/fleets/{fleetId}/notifications/templates/{templateId}`
Delete the notification template with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/templates/{templateId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `templateId`: string (required)

**Responses:** `200`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### GET `/fleets/{fleetId}/notifications/templates/{templateId}/body`
Retrieve the body of the notification template with the gien ID

authFetch path: `notifier/fleets/{fleetId}/notifications/templates/{templateId}/body` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `templateId`: string (required)

**Responses:** `200`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

## admin-notifier-tickets (4 endpoints)

### GET `/fleets/{fleetId}/notifications/conf`
Retrieve all the utomatic tickets configurations for the given fleet

authFetch path: `notifier/fleets/{fleetId}/notifications/conf` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Responses:** `200` → `NotifierConfigurationOptionDTO[]`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/conf`
Create (or update) a configuration for an automatic ticket

authFetch path: `notifier/fleets/{fleetId}/notifications/conf` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)

**Request body:** `NotifierConfigurationOption`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int32) | yes |  |
| eventType | string | no |  |
| fleetId | string | no |  |
| defaultCategory | string | no |  |
| defaultPriority | string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | no |  |
| defaultSubject | string | no |  |
| defaultTicketingGroup | integer (int32) | no |  |
| defaultAssignees | string[] | no | *(deprecated)* |

**Responses:** `200` → `NotifierConfigurationOptionDTO`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### POST `/fleets/{fleetId}/notifications/conf/{confId}`
Update the automatic ticket configuration with the givent ID

authFetch path: `notifier/fleets/{fleetId}/notifications/conf/{confId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `confId`: integer (int32) (required)

**Request body:** `NotifierConfigurationOptionAddDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| defaultCategory | string | yes |  |
| defaultPriority | string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | yes |  |
| defaultSubject | string | yes |  |
| defaultTicketingGroup | integer (int32) | yes |  |

**Responses:** `200` → `NotifierConfigurationOptionDTO`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

### DELETE `/fleets/{fleetId}/notifications/conf/{confId}`
Delete the automatic ticket configuration with the given ID

authFetch path: `notifier/fleets/{fleetId}/notifications/conf/{confId}` (base path `/boapi/proxy/notifier`)

**Path params:**
- `fleetId`: string (required)
- `confId`: integer (int32) (required)

**Responses:** `200`, `400` → `NotifierResponseMsg`, `409` → `NotifierResponseMsg`, `422` → `NotifierResponseMsg`

## admin-pdf-simulator (6 endpoints)

### POST `/fleets/types/{type}/simulate`

Generate all pdfs (in a zip) for a given template type and a given payload

authFetch path: `pdf/fleets/types/{type}/simulate` (base path `/boapi/proxy/pdf`)

**Path params:**
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Request body:** `string`

**Responses:** `200` → `PdfStreamingResponseBody`, `500` → `PdfStreamingResponseBody`

### POST `/fleets/{fleetId}/type/{type}/simulate`
Return dynamic PDF with data not hard coded

authFetch path: `pdf/fleets/{fleetId}/type/{type}/simulate` (base path `/boapi/proxy/pdf`)

**Path params:**
- `fleetId`: string (required)
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| data | string (binary) | yes |  |
| file | string (binary) | yes |  |

**Responses:** `200` → `string (binary)`, `500` → `string (binary)`

### POST `/fleets/{fleetId}/type/{type}/simulateBasic`

Return dynamic PDF with data hard coded

authFetch path: `pdf/fleets/{fleetId}/type/{type}/simulateBasic` (base path `/boapi/proxy/pdf`)

**Path params:**
- `fleetId`: string (required)
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | string (binary) | yes |  |

**Responses:** `200` → `string (binary)`, `500` → `string (binary)`

### POST `/fleets/{fleetId}/type/{type}/simulateContextMap`

Return dynamic context map with data hard coded

authFetch path: `pdf/fleets/{fleetId}/type/{type}/simulateContextMap` (base path `/boapi/proxy/pdf`)

**Path params:**
- `fleetId`: string (required)
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Responses:** `200` → `object`, `500` → `object`

### POST `/fleets/{fleetId}/type/{type}/simulateContextMapOnData`

Return dynamic context map with provided data

authFetch path: `pdf/fleets/{fleetId}/type/{type}/simulateContextMapOnData` (base path `/boapi/proxy/pdf`)

**Path params:**
- `fleetId`: string (required)
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Request body:** `string`

**Responses:** `200` → `object`, `500` → `object`

### GET `/fleets/{fleetId}/type/{type}/simulateParams`
Return the hardcoded dataJson sample used by simulateBasic for the given type

authFetch path: `pdf/fleets/{fleetId}/type/{type}/simulateParams` (base path `/boapi/proxy/pdf`)

**Path params:**
- `fleetId`: string (required)
- `type`: string: `INVOICE_TRIP_FF`, `INVOICE_TRIP_SB`, `INVOICE_TRIP_SUBSCRIPTION`, `INVOICE_PRODUCT`, `INVOICE_BUSINESS_TRIP`, `INVOICE_BUSINESS_SUBSCRIPTION`, `INVOICE_BUSINESS_PRODUCT`, `REFUND`, `RECEIPT`, `RECEIPT_SC`, `GIFT_CARD` (required)

**Responses:** `200` → `string`, `404` → `string`, `500` → `string`

## admin-pricing (14 endpoints)

### GET `/fleets/{fleetId}/pricing/vehicles`
Return the most specific pricing of the vehicles, grouped by serviceId

authFetch path: `user/fleets/{fleetId}/pricing/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PricingVehicleInfoDTO[]`

### GET `/fleets/{fleetId}/pricing/{pricingId}`
Get a pricing policy by id

authFetch path: `user/fleets/{fleetId}/pricing/{pricingId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `pricingId`: string (required) — The ID of wanted pricing policy

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `JsonSegmentDTO`, `404` → `JsonSegmentDTO`

### GET `/fleets/{fleetId}/pricingCatalogue`
Get all Pricing catalogs of the given fleet

authFetch path: `user/fleets/{fleetId}/pricingCatalogue` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `isArchived`: Boolean (optional) — If archived pricing catalog must be returned

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PricingCatalogueResponseDTO[]`, `400` → `PricingCatalogueResponseDTO[]`

### POST `/fleets/{fleetId}/pricingCatalogue`
Create a new Pricing catalog with given values (this endpoint does not archive the previous pricing)

authFetch path: `user/fleets/{fleetId}/pricingCatalogue` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PricingCatalogueRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | The pricing catalog name |
| operatorId | string | no | ID of user who is performing the action |
| taxRates | TaxRatesDTO[] | no | List of all tax rates used (basic or interval) |
| stopOver | UnitPrice[] | no | The stopover part of the basic pricing (with booking / driving) |
| overMileage | OverMileageDTO | no | The over mileage part (basic or interval) |
| booking | UnitPrice[] | no | The booking part of the basic pricing (with stopOver / driving) |
| bookingFee | BookingFeeDTO | no | The booking fee |
| driving | UnitPrice[] | no | The driving part of the basic pricing (with stopOver / booking) |
| stopoverDrivingCap | UnitPrice[] | no |  |
| unlockFee | UnlockFeeDTO | no | The unlock fee pricing part (basic or interval) |
| pricingPackage | PricingPackageElementDTO[] | no | The pricing interval configuration (this one or basic pricing with stopOver / booking / driving) |
| pricingPackageWithDrivingStopover | PricingIntervalsElementDTO[] | no |  |
| plans | SubscriptionPlanDTO[] | no |  |
| taxIncluded | boolean | no |  |

**Responses:** `201` → `PricingCatalogueResponseDTO`, `400` → `PricingCatalogueResponseDTO`

### GET `/fleets/{fleetId}/pricingCatalogue/{id}`
Get the Pricing catalog for the given ID

authFetch path: `user/fleets/{fleetId}/pricingCatalogue/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of wanted Pricing catalog

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PricingCatalogueResponseDTO`, `400` → `PricingCatalogueResponseDTO`, `404` → `PricingCatalogueResponseDTO`

### POST `/fleets/{fleetId}/pricingCatalogue/{id}`
Create a new Pricing catalog and archived the given ID and update the linked pricingParameter

authFetch path: `user/fleets/{fleetId}/pricingCatalogue/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of wanted Pricing catalog

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PricingCatalogueRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | The pricing catalog name |
| operatorId | string | no | ID of user who is performing the action |
| taxRates | TaxRatesDTO[] | no | List of all tax rates used (basic or interval) |
| stopOver | UnitPrice[] | no | The stopover part of the basic pricing (with booking / driving) |
| overMileage | OverMileageDTO | no | The over mileage part (basic or interval) |
| booking | UnitPrice[] | no | The booking part of the basic pricing (with stopOver / driving) |
| bookingFee | BookingFeeDTO | no | The booking fee |
| driving | UnitPrice[] | no | The driving part of the basic pricing (with stopOver / booking) |
| stopoverDrivingCap | UnitPrice[] | no |  |
| unlockFee | UnlockFeeDTO | no | The unlock fee pricing part (basic or interval) |
| pricingPackage | PricingPackageElementDTO[] | no | The pricing interval configuration (this one or basic pricing with stopOver / booking / driving) |
| pricingPackageWithDrivingStopover | PricingIntervalsElementDTO[] | no |  |
| plans | SubscriptionPlanDTO[] | no |  |
| taxIncluded | boolean | no |  |

**Responses:** `201` → `PricingCatalogueResponseDTO`, `400` → `PricingCatalogueResponseDTO`, `404` → `PricingCatalogueResponseDTO`

### PUT `/fleets/{fleetId}/pricingCatalogue/{id}`
Disable or enable the Pricing catalog with the given ID

authFetch path: `user/fleets/{fleetId}/pricingCatalogue/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of wanted Pricing catalog

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PricingCatalogueArchiveDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | no | ID of user who is performing the action |
| archived | boolean | yes | true if the pricing catalog must be archived |

**Responses:** `200` → `PricingCatalogueResponseDTO`, `400` → `PricingCatalogueResponseDTO`, `404` → `PricingCatalogueResponseDTO`

### GET `/fleets/{fleetId}/pricingParameters`
Get the Pricing parameters for given criteria

authFetch path: `user/fleets/{fleetId}/pricingParameters` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pricingId`: string (optional) — The ID of the pricing policy we want the pricing parameter for
- `modelId`: string (optional) — The ID of the vehicle model we want the pricing parameter for
- `serviceId`: string (optional) — The ID of the service we want the pricing parameter for
- `planId`: string (optional) — The ID of the subscription plan we want the pricing parameter for
- `groupId`: string (optional) — The ID of the vehicle group we want the pricing parameter for
- `entityId`: string (optional) — The ID of the entity we want the pricing parameter for
- `operatorId`: string (optional) — The ID of the user who updated wanted pricing parameter
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PricingParameterResponseDTO[]`, `400` → `PricingParameterResponseDTO[]`

### POST `/fleets/{fleetId}/pricingParameters`
Create a new Pricing parameter

authFetch path: `user/fleets/{fleetId}/pricingParameters` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PricingParameterRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pricingId | string | yes | The ID of the pricing policy referenced by this Pricing parameter |
| modelId | integer (int64) | no | The ID of the vehicle model linked to this Pricing parameter |
| serviceId | string | no | The ID of the service linked to this Pricing parameter |
| planId | string | no | The ID of the subscription plan linked to this Pricing parameter |
| groupId | string | no | The ID of the vehicle group linked to this Pricing parameter |
| entityId | string | no | The ID of the entity linked to this Pricing parameter |
| operatorId | string | no | The ID of the user who made the last update of this Pricing parameter |
| vehicleIds | string[] | no | The list of vehicles ID linked to this Pricing parameter |

**Responses:** `201` → `PricingParameterResponseDTO`, `400` → `PricingParameterResponseDTO`, `404` → `PricingParameterResponseDTO`

### GET `/fleets/{fleetId}/pricingParameters/{id}`
Get the Pricing parameter with the given ID

authFetch path: `user/fleets/{fleetId}/pricingParameters/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of wanted Pricing parameter

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PricingParameterResponseDTO`, `400` → `PricingParameterResponseDTO`, `404` → `PricingParameterResponseDTO`

### PUT `/fleets/{fleetId}/pricingParameters/{id}`
Update the Pricing parameter with given ID

authFetch path: `user/fleets/{fleetId}/pricingParameters/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of Pricing parameter we want to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PricingParameterRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pricingId | string | yes | The ID of the pricing policy referenced by this Pricing parameter |
| modelId | integer (int64) | no | The ID of the vehicle model linked to this Pricing parameter |
| serviceId | string | no | The ID of the service linked to this Pricing parameter |
| planId | string | no | The ID of the subscription plan linked to this Pricing parameter |
| groupId | string | no | The ID of the vehicle group linked to this Pricing parameter |
| entityId | string | no | The ID of the entity linked to this Pricing parameter |
| operatorId | string | no | The ID of the user who made the last update of this Pricing parameter |
| vehicleIds | string[] | no | The list of vehicles ID linked to this Pricing parameter |

**Responses:** `200` → `PricingParameterResponseDTO`, `400` → `PricingParameterResponseDTO`, `404` → `PricingParameterResponseDTO`

### DELETE `/fleets/{fleetId}/pricingParameters/{id}`
Delete the Pricing parameter with the given ID

authFetch path: `user/fleets/{fleetId}/pricingParameters/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The ID of Pricing parameter we want to delete

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`, `400`, `404`

### GET `/fleets/{fleetId}/subscription/pricing`
Get the list of the active pricing policies in subscription context

authFetch path: `user/fleets/{fleetId}/subscription/pricing` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceVehiclePricingSubscriptionDTO[]`, `404` → `ServiceVehiclePricingSubscriptionDTO[]`

### GET `/fleets/{fleetId}/subscription/vehicles/{vehicleId}/pricing`

authFetch path: `user/fleets/{fleetId}/subscription/vehicles/{vehicleId}/pricing` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleSubscriptionInfoDTO`

## admin-product (25 endpoints)

### GET `/by-service/fleets/{fleetId}/products`
List products

authFetch path: `user/by-service/fleets/{fleetId}/products` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`

### GET `/by-service/fleets/{fleetId}/products/{productId}`
Get a product by Id

authFetch path: `user/by-service/fleets/{fleetId}/products/{productId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `productId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`

### GET `/fleets/{fleetId}/products`
List products

authFetch path: `user/fleets/{fleetId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of the product to find

**Query params:**
- `services`: string (optional) — TheserviceId of the product to find
- `models`: Long (optional) — ThemodelId of the product to find

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`, `404` → `ProductDTO | CancellationPolicyResponseDTO[]`

### POST `/fleets/{fleetId}/products`

authFetch path: `user/fleets/{fleetId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ProductRequestDTO | CancellationPolicyRequestDTO`

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`

### GET `/fleets/{fleetId}/products/groups`
Finds all product groups for a given fleet

authFetch path: `user/fleets/{fleetId}/products/groups` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductGroupDTO[]`

### POST `/fleets/{fleetId}/products/groups`
Create a product group

authFetch path: `user/fleets/{fleetId}/products/groups` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ProductGroupDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Id of the group of produts |
| name | string | yes | Name of the group of products |
| productIds | string[] | yes | list of product ids |
| status | string | no | Status of the group of product |

**Responses:** `201` → `ProductGroupDTO`

### GET `/fleets/{fleetId}/products/groups/{id}`
Finds a product group by Id

authFetch path: `user/fleets/{fleetId}/products/groups/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The id of the product group

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductGroupDTO`, `400` → `ProductGroupDTO`

### PUT `/fleets/{fleetId}/products/groups/{id}`
Update a product group

authFetch path: `user/fleets/{fleetId}/products/groups/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The id of the product group

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ProductGroupDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Id of the group of produts |
| name | string | yes | Name of the group of products |
| productIds | string[] | yes | list of product ids |
| status | string | no | Status of the group of product |

**Responses:** `200` → `ProductGroupDTO`, `400` → `ProductGroupDTO`

### GET `/fleets/{fleetId}/products/groups/{id}/isused`
Is product group in use

authFetch path: `user/fleets/{fleetId}/products/groups/{id}/isused` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The id of the product group

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `boolean`

### GET `/fleets/{fleetId}/products/services/{serviceId}`
Get product associated to a service

authFetch path: `user/fleets/{fleetId}/products/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `serviceId`: string (required) — TheserviceId where to search products

**Query params:**
- `models`: integer (int64) (optional) — Themodel id to filter

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`

### GET `/fleets/{fleetId}/products/type/{type}`
List products by type

authFetch path: `user/fleets/{fleetId}/products/type/{type}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `type`: string (required) — Thetype of the product

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`

### GET `/fleets/{fleetId}/products/{productId}`
Get a product by Id

authFetch path: `user/fleets/{fleetId}/products/{productId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `productId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`

### PUT `/fleets/{fleetId}/products/{productId}`
update product by id

authFetch path: `user/fleets/{fleetId}/products/{productId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `productId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ProductUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| price | number | no |  |
| name | string | no |  |
| taxName | string | no |  |
| taxRate | number | no |  |
| taxIncluded | boolean | no |  |
| priceRate | number | no |  |
| pricePerUnitExceedingAllowance | number | no |  |
| distanceIncluded | number | no |  |
| active | boolean | no |  |
| systemCreditsAvailable | number | no |  |
| validityDays | integer (int32) | no |  |
| getxMinutesBefore | integer (int32) | no |  |
| expirationDate | string (date-time) | no |  |
| zones | string[] | no |  |
| percentage | number | no |  |
| walletPayable | boolean | no |  |
| pricePerHour | number | no |  |
| pricePerDay | number | no |  |
| pricePerTrip | number | no |  |
| isGlobalWallet | boolean | no |  |
| freeMinutes | integer (int32) | no |  |
| extensionTime | integer (int32) | no |  |

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`

### PATCH `/fleets/{fleetId}/products/{productId}`
Update a product by patch

authFetch path: `user/fleets/{fleetId}/products/{productId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — Theproduct id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `JsonPatch`

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`, `400` → `ProductDTO | CancellationPolicyResponseDTO`, `404` → `ProductDTO | CancellationPolicyResponseDTO`

### DELETE `/fleets/{fleetId}/products/{productId}`
Delete a product

authFetch path: `user/fleets/{fleetId}/products/{productId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `productId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### GET `/fleets/{fleetId}/products/{productId}/scope`
Get all services and models associated to a product

authFetch path: `user/fleets/{fleetId}/products/{productId}/scope` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId where we look for services and models associated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductScopeDTO[]`

### GET `/fleets/{fleetId}/products/{productId}/services`
Get all services associated to a product

authFetch path: `user/fleets/{fleetId}/products/{productId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId where we look for services associated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull[]`

### POST `/fleets/{fleetId}/products/{productId}/services/{serviceId}`
Link a product to a service

authFetch path: `user/fleets/{fleetId}/products/{productId}/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId to be associated with the service
- `serviceId`: string (required) — TheserviceId to be associated with the product

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ModelScopeDTO[]`

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`, `404` → `ProductDTO | CancellationPolicyResponseDTO`, `409` → `ProductDTO | CancellationPolicyResponseDTO`

### DELETE `/fleets/{fleetId}/products/{productId}/services/{serviceId}`
Remove a service and all its models from a product

authFetch path: `user/fleets/{fleetId}/products/{productId}/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId to be removed from the service
- `serviceId`: string (required) — TheserviceId to be removed from the product

**Query params:**
- `models`: Long (optional) — The model id to associate

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO`, `404` → `ProductDTO | CancellationPolicyResponseDTO`

### GET `/fleets/{fleetId}/products/{productId}/taxes`
List taxes linked to a product

authFetch path: `user/fleets/{fleetId}/products/{productId}/taxes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `productId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TaxDTO[]`

### POST `/fleets/{fleetId}/products/{productId}/taxes`
Create a Tax and associate to a Product

This endpoint create a tax and directly associates it with an existing product

authFetch path: `user/fleets/{fleetId}/products/{productId}/taxes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId to be associated with the tax

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `TaxCreateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | yes | The name of the tax |
| taxRate | number | yes | The rate of the tax |
| zones | string[] | no |  |

**Responses:** `201` → `TaxDTO`, `403` → `TaxDTO`, `404` → `TaxDTO`, `409` → `TaxDTO`

### PUT `/fleets/{fleetId}/products/{productId}/taxes/{taxId}`
Associate a tax to a product

This endpoint allows you to associate a created tax to a product

authFetch path: `user/fleets/{fleetId}/products/{productId}/taxes/{taxId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — ThefleetId of your account
- `productId`: string (required) — TheproductId to be associated with the tax
- `taxId`: string (required) — ThetaxId to be associated with the product

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`, `404` → `string`, `409` → `string`

### GET `/fleets/{fleetId}/subscription/fees`
get the products for subscription

authFetch path: `user/fleets/{fleetId}/subscription/fees` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceVehiclePricingSubscriptionDTO[]`, `400` → `ServiceVehiclePricingSubscriptionDTO[]`

### GET `/fleets/{fleetId}/subscription/systemCreditsPackages`
get the products of type system credits packages

authFetch path: `user/fleets/{fleetId}/subscription/systemCreditsPackages` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`, `400` → `ProductDTO | CancellationPolicyResponseDTO[]`

### GET `/fleets/{fleetId}/subscription/vehicles/{vehicleId}/products`

authFetch path: `user/fleets/{fleetId}/subscription/vehicles/{vehicleId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`

## admin-promocode (13 endpoints)

### GET `/billing/fleets/{fleetId}/campaigns`
return campaigns by reference

authFetch path: `user/billing/fleets/{fleetId}/campaigns` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `reference`: string (required) — The reference of the campaign

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `CampaignResponseDTO`, `404` → `CampaignResponseDTO`

### POST `/billing/fleets/{fleetId}/campaigns`
create campaign

authFetch path: `user/billing/fleets/{fleetId}/campaigns` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `CampaignRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | yes | reference |
| operatorId | string | yes | operatorId |

**Responses:** `201` → `CampaignResponseDTO`, `400` → `CampaignResponseDTO`

### DELETE `/billing/fleets/{fleetId}/campaigns`
Delete campaign

authFetch path: `user/billing/fleets/{fleetId}/campaigns` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `reference`: string (required) — The reference of the campaign

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### GET `/billing/fleets/{fleetId}/promoCodes`
return all promo codes paginated

authFetch path: `user/billing/fleets/{fleetId}/promoCodes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)
- `reference`: string (required) — The reference of the promocode

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PromoCode[]`, `400` → `PromoCodeResponseDTO[]`

### POST `/billing/fleets/{fleetId}/promoCodes`
create promo code

authFetch path: `user/billing/fleets/{fleetId}/promoCodes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PromoCodeRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | yes | reference |
| maxUses | integer (int32) | no | number of usage |
| walletType | string: `LOCAL`, `GLOBAL`, `PERIODIC` | yes | wallet type |
| status | string: `ACTIVE`, `INACTIVE` | yes | status |
| validityDuration | integer (int32) | no | validity of promocode |
| effectiveDate | string (date-time) | yes | effective date - date that the code may be used |
| expiryDate | string (date-time) | yes | expiry date - date that the code expires |
| validityEndDate | string (date-time) | no | validity end date - date that the validity code ends |
| description | string | yes | description |
| promoCodeType | string: `INVITEE_PROMOCODE`, `REFEREE_PROMOCODE` | no |  |
| registration | boolean | no |  |
| usages | PromoCodeUsageDTO[] | yes | promoCodeUsages |

**Responses:** `201` → `PromoCode`, `400` → `PromoCodeResponseDTO`

### POST `/billing/fleets/{fleetId}/promoCodes/bulk`
bulk insert of promo codes from csv

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/bulk` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| csvFile | string (binary) | yes |  |

**Responses:** `201` → `PromoCodeCsvUploadReport`, `400` → `PromoCodeCsvUploadReport`, `412` → `PromoCodeCsvUploadReport`

### PUT `/billing/fleets/{fleetId}/promoCodes/redeem/{reference}`
Redeem a promo code for a user

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/redeem/{reference}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reference`: string (required) — The reference of promocode

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `RedeemDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | userId |
| entityId | string | no | entityId |
| invitationId | string | no | invitationId |

**Responses:** `200` → `string`, `400` → `string`

### GET `/billing/fleets/{fleetId}/promoCodes/redeemed/{entityId}`
return the promo code history for an entityId

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/redeemed/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PromoCodeHistory[]`, `400` → `PromoCodeHistory[]`, `404` → `PromoCodeHistory[]`

### GET `/billing/fleets/{fleetId}/promoCodes/reference/{reference}/cities`
return available cities by promocode reference

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/reference/{reference}/cities` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reference`: string (required) — reference

**Query params:**
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`, `400` → `string[]`

### GET `/billing/fleets/{fleetId}/promoCodes/{id}`
return a promo code by its id

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — promocodeId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PromoCode`, `400` → `PromoCodeResponseDTO`, `404` → `PromoCodeResponseDTO`

### POST `/billing/fleets/{fleetId}/promoCodes/{promoCodeId}`
update an existing promo code

authFetch path: `user/billing/fleets/{fleetId}/promoCodes/{promoCodeId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `promoCodeId`: string (required) — The id of the promocode

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PromoCodeRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | yes | reference |
| maxUses | integer (int32) | no | number of usage |
| walletType | string: `LOCAL`, `GLOBAL`, `PERIODIC` | yes | wallet type |
| status | string: `ACTIVE`, `INACTIVE` | yes | status |
| validityDuration | integer (int32) | no | validity of promocode |
| effectiveDate | string (date-time) | yes | effective date - date that the code may be used |
| expiryDate | string (date-time) | yes | expiry date - date that the code expires |
| validityEndDate | string (date-time) | no | validity end date - date that the validity code ends |
| description | string | yes | description |
| promoCodeType | string: `INVITEE_PROMOCODE`, `REFEREE_PROMOCODE` | no |  |
| registration | boolean | no |  |
| usages | PromoCodeUsageDTO[] | yes | promoCodeUsages |

**Responses:** `200` → `PromoCode`, `400` → `PromoCodeResponseDTO`, `404` → `PromoCodeResponseDTO`

### POST `/billing/fleets/{fleetId}/v1/bulk/template/promoCodes`

authFetch path: `user/billing/fleets/{fleetId}/v1/bulk/template/promoCodes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional)

**Request body:** `BulkPromocodeRequestDTO`

**Responses:** `200` → `string (byte)`

### POST `/billing/fleets/{fleetId}/v2/bulk/template/promoCodes`

authFetch path: `user/billing/fleets/{fleetId}/v2/bulk/template/promoCodes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `validation`: boolean (required)
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `bulkPromocodeRequestDTO`

**Responses:** `200` → `PromoCodeCsvLine[]`

## admin-receipt (2 endpoints)

### GET `/scheduledBooking/fleets/{fleetId}/bookingRequests/{bookingRequestId}/credits/{creditId}/pdf`
return the PDF for a booking request credit id

This endpoint retrieve the PDF version of a booking request credit, given by its id

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingRequests/{bookingRequestId}/credits/{creditId}/pdf` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bookingRequestId`: string (required) — The id of the booking Request
- `creditId`: string (required) — The id of the credit

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string (byte)`, `404` → `string (byte)`

### GET `/scheduledBooking/fleets/{fleetId}/bookingRequests/{bookingRequestId}/receipts/{receiptId}/pdf`
return the PDF for a receipt id

This endpoint retrieve the PDF version of an receipt, given by its id

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingRequests/{bookingRequestId}/receipts/{receiptId}/pdf` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bookingRequestId`: string (required) — The id of the booking Request
- `receiptId`: string (required) — The id of the receipt

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string (byte)`, `404` → `string (byte)`

## admin-report (28 endpoints)

### GET `/fleets/{fleetId}/claims`
Get all claims for a given fleet

authFetch path: `user/fleets/{fleetId}/claims` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `status`: any (optional) — The status of claims
- `operatorId`: any (optional) — The id of the opérator
- `claimReference`: any (optional) — The reference of claims
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ClaimResponseDTO[]`, `400` → `ClaimResponseDTO[]`

### POST `/fleets/{fleetId}/claims`
Create a claim

authFetch path: `user/fleets/{fleetId}/claims` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ClaimRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| claimReference | string | no |  |
| operatorId | string | no |  |
| status | string: `NEW`, `ONGOING`, `CLOSE`, `CANCELLED` | no |  |

**Responses:** `201` → `ClaimResponseDTO`, `400` → `ClaimResponseDTO`, `409` → `ClaimResponseDTO`

### GET `/fleets/{fleetId}/claims/{claimId}`
Get a claims by id for a given fleet

authFetch path: `user/fleets/{fleetId}/claims/{claimId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `claimId`: any (required) — The id of the claim

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ClaimResponseDTO`, `400` → `ClaimResponseDTO`

### PUT `/fleets/{fleetId}/claims/{claimId}`
Update a claim

authFetch path: `user/fleets/{fleetId}/claims/{claimId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `claimId`: any (required) — The id of the claim

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ClaimRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| claimReference | string | no |  |
| operatorId | string | no |  |
| status | string: `NEW`, `ONGOING`, `CLOSE`, `CANCELLED` | no |  |

**Responses:** `200` → `ClaimResponseDTO`, `400` → `ClaimResponseDTO`, `404` → `ClaimResponseDTO`

### DELETE `/fleets/{fleetId}/claims/{claimId}`
Delete a claim

authFetch path: `user/fleets/{fleetId}/claims/{claimId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `claimId`: any (required) — The id of the claim

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`, `400`, `404`, `405`

### PUT `/fleets/{fleetId}/claims/{claimReference}/reportItems`
Assign claim reference to multiple damage items

authFetch path: `user/fleets/{fleetId}/claims/{claimReference}/reportItems` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `claimReference`: any (required) — The reference of the claim

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `AssignItemsToClaimDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | no |  |
| items | string[] | no |  |

**Responses:** `200` → `string`, `400` → `string`, `404` → `string`

### PUT `/fleets/{fleetId}/items/filesPurged`
Update Items after purge of files

authFetch path: `user/fleets/{fleetId}/items/filesPurged` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200` → `integer (int32)`, `400` → `integer (int32)`

### POST `/fleets/{fleetId}/items/{itemId}`
Update an Item

authFetch path: `user/fleets/{fleetId}/items/{itemId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `itemId`: string (required) — item Id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `items`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| report | ReportDTO | no |  |
| severity | integer (int32) | no | severity |
| repairDate | string (date-time) | no | repairDate |
| area | ItemAreaDTO | no |  |
| fileUrl | string | no | fileUrl |
| duplicateId | string | no | duplicateId |
| reportType | string: `DAMAGE`, `CLEANLINESS`, `PARKING` | no | reportType |
| itemComments | ItemCommentDTO[] | no |  |
| belowMinimalRepairValue | boolean | no | belowMinimalRepairValue |
| validationDate | string (date-time) | no | validationDate |
| validatorUserId | string | no | the userId of the user that have validate this item |
| claimReference | string | no | claimReference |
| operatorId | string | yes | operatorId |
| reportId | string | no |  |
| reporter | string | no |  |
| tripId | string | no |  |
| vehicleId | string | no |  |
| serviceId | string | no |  |
| timeline | string: `AFTER_TRIP`, `BEFORE_TRIP`, `DURING_TRIP` | no |  |

**Responses:** `200` → `items`, `201` → `items`, `400` → `items`

### POST `/fleets/{fleetId}/items/{itemId}/comment`
Add comment to existing item

authFetch path: `user/fleets/{fleetId}/items/{itemId}/comment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `itemId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ItemCommentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| description | string | yes |  |

**Responses:** `200` → `ItemCommentDTO`, `400` → `ItemCommentDTO`

### PUT `/fleets/{fleetId}/items/{itemId}/comments/{commentId}`
Update an Item comment

authFetch path: `user/fleets/{fleetId}/items/{itemId}/comments/{commentId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `itemId`: string (required) — item Id
- `commentId`: string (required) — comment Id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ItemCommentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| description | string | yes |  |

**Responses:** `200` → `ItemCommentDTO`, `201` → `ItemCommentDTO`, `400` → `ItemCommentDTO`

### DELETE `/fleets/{fleetId}/items/{itemId}/comments/{commentId}`
Delete comment from an item

authFetch path: `user/fleets/{fleetId}/items/{itemId}/comments/{commentId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `itemId`: string (required)
- `commentId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### GET `/fleets/{fleetId}/reports`
Get all reports for a given fleet or get all reports for a trip in franchise

authFetch path: `user/fleets/{fleetId}/reports` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)
- `tripId`: string (optional) — The id of trip

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Report[]`, `400` → `Report[]`

### POST `/fleets/{fleetId}/reports`
Add a new report

authFetch path: `user/fleets/{fleetId}/reports` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ReportDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | userId |
| vehicleId | string | no | vehicleId |
| tripId | string | no | tripId |
| serviceId | string | no | serviceId |
| latitude | number (double) | no | latitude |
| longitude | number (double) | no | longitude |
| items | items[] | no |  |
| timeline | string: `AFTER_TRIP`, `BEFORE_TRIP`, `DURING_TRIP` | no | timeline |

**Responses:** `201` → `ReportDTO`, `400` → `ReportDTO`

### GET `/fleets/{fleetId}/reports/areas`
Get all areas for a given fleet

authFetch path: `user/fleets/{fleetId}/reports/areas` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ItemAreaDTO[]`, `400` → `ItemAreaDTO[]`

### POST `/fleets/{fleetId}/reports/areas`
Add a new area

authFetch path: `user/fleets/{fleetId}/reports/areas` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ItemAreaDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | id of area |

**Responses:** `201` → `ItemAreaDTO`, `400` → `ItemAreaDTO`

### GET `/fleets/{fleetId}/reports/areas/{areaId}`
Get Area for a given fleet by Id

authFetch path: `user/fleets/{fleetId}/reports/areas/{areaId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `areaId`: string (required) — areaId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ItemAreaDTO`, `204` → `ItemAreaDTO`, `400` → `ItemAreaDTO`

### GET `/fleets/{fleetId}/reports/items`
Get all items with filters. Possible filters are: vehicleId, serviceId, repaired, duplicate, belowMinimalRepairValue, validated, severity, reportType.

authFetch path: `user/fleets/{fleetId}/reports/items` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `repaired`: boolean (optional)
- `duplicate`: boolean (optional)
- `belowMinimalRepairValue`: boolean (optional)
- `validated`: boolean (optional)
- `severity`: integer (int32) (optional)
- `reportType`: string: `DAMAGE`, `CLEANLINESS`, `PARKING` (optional)
- `vehicleId`: string (optional)
- `vehicleIds`: any (optional) — list of vehicleIds
- `serviceId`: string (optional)
- `claimReference`: string (optional)
- `areaId`: string (optional)
- `filePurged`: boolean (optional)
- `creationDateBefore`: string (optional) — the creation date should be prior to this date
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `items[]`, `400` → `items[]`

### GET `/fleets/{fleetId}/reports/templates`
Get all Templates for a given fleet

authFetch path: `user/fleets/{fleetId}/reports/templates` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ReportTemplateDTO[]`, `400` → `ReportTemplateDTO[]`

### POST `/fleets/{fleetId}/reports/templates`
Add a new template. A template defines the image and the areas of a vehicle for a given model.

authFetch path: `user/fleets/{fleetId}/reports/templates` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ReportTemplateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | template name |
| modelId | string | no | template modelId |
| baseUrl | string | no | template baseUrl |

**Responses:** `201` → `ReportTemplateDTO`, `400` → `ReportTemplateDTO`, `409` → `ReportTemplateDTO`

### GET `/fleets/{fleetId}/reports/templates/{templateId}`
Get Template for a given fleet by Id

authFetch path: `user/fleets/{fleetId}/reports/templates/{templateId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `templateId`: string (required) — templateId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ReportTemplateDTO`, `204` → `ReportTemplateDTO`, `400` → `ReportTemplateDTO`

### POST `/fleets/{fleetId}/reports/templates/{templateId}`
Update an existing template.

authFetch path: `user/fleets/{fleetId}/reports/templates/{templateId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `templateId`: string (required) — the template Id to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ReportTemplateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | template name |
| modelId | string | no | template modelId |
| baseUrl | string | no | template baseUrl |

**Responses:** `200` → `ReportTemplateDTO`, `400` → `ReportTemplateDTO`, `404` → `ReportTemplateDTO`, `409` → `ReportTemplateDTO`

### POST `/fleets/{fleetId}/reports/templates/{templateId}/area`
Add new Area to a Template

authFetch path: `user/fleets/{fleetId}/reports/templates/{templateId}/area` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `templateId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ItemAreaDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | id of area |

**Responses:** `200` → `ReportTemplateDTO`, `201` → `ReportTemplateDTO`, `400` → `ReportTemplateDTO`

### GET `/fleets/{fleetId}/reports/vehicles/{vehicleId}/items`
Get all Items for a specific vehicle and fleet

authFetch path: `user/fleets/{fleetId}/reports/vehicles/{vehicleId}/items` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `vehicleId`: string (required) — vehicleId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `items[]`, `400` → `items[]`

### GET `/fleets/{fleetId}/reports/vehicles/{vehicleId}/items/{reportType}`
Get all active (not fixed) Items (damages by default or cleanliness issues) for a specific vehicle and fleet and not below a minimum repair value

authFetch path: `user/fleets/{fleetId}/reports/vehicles/{vehicleId}/items/{reportType}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `vehicleId`: string (required) — vehicleId
- `reportType`: string: `DAMAGE`, `CLEANLINESS`, `PARKING` (required) — ReportType object

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `items[]`, `400` → `items[]`

### GET `/fleets/{fleetId}/reports/{reportId}`
Get Report for a given fleet by Id

authFetch path: `user/fleets/{fleetId}/reports/{reportId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reportId`: string (required) — reportId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ReportDTO`, `204` → `ReportDTO`, `400` → `ReportDTO`

### DELETE `/fleets/{fleetId}/reports/{reportId}`
Delete Report and ALL the related Items for a given fleet by Id

authFetch path: `user/fleets/{fleetId}/reports/{reportId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reportId`: string (required) — reportId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### POST `/fleets/{fleetId}/reports/{reportId}/items`
Add new Item to a Report

authFetch path: `user/fleets/{fleetId}/reports/{reportId}/items` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reportId`: string (required) — reportId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `items`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| report | ReportDTO | no |  |
| severity | integer (int32) | no | severity |
| repairDate | string (date-time) | no | repairDate |
| area | ItemAreaDTO | no |  |
| fileUrl | string | no | fileUrl |
| duplicateId | string | no | duplicateId |
| reportType | string: `DAMAGE`, `CLEANLINESS`, `PARKING` | no | reportType |
| itemComments | ItemCommentDTO[] | no |  |
| belowMinimalRepairValue | boolean | no | belowMinimalRepairValue |
| validationDate | string (date-time) | no | validationDate |
| validatorUserId | string | no | the userId of the user that have validate this item |
| claimReference | string | no | claimReference |
| operatorId | string | yes | operatorId |
| reportId | string | no |  |
| reporter | string | no |  |
| tripId | string | no |  |
| vehicleId | string | no |  |
| serviceId | string | no |  |
| timeline | string: `AFTER_TRIP`, `BEFORE_TRIP`, `DURING_TRIP` | no |  |

**Responses:** `200` → `items`, `201` → `items`, `400` → `items`

### DELETE `/fleets/{fleetId}/reports/{reportId}/items/{itemId}`
Delete an item from a report by Id

authFetch path: `user/fleets/{fleetId}/reports/{reportId}/items/{itemId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `reportId`: string (required) — reportId
- `itemId`: string (required) — itemId

**Query params:**
- `userId`: string (required) — userId of the user

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ReportDTO`, `400` → `ReportDTO`

## admin-subscription (19 endpoints)

### POST `/scheduledBooking/fleets/subscription/bookingrequests/processBilling`
Start billing process for all subscriptions and fleets

authFetch path: `user/scheduledBooking/fleets/subscription/bookingrequests/processBilling` (base path `/boapi/proxy/user`)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202` → `ResponseSummaryDTO`, `400` → `ResponseSummaryDTO`

### POST `/scheduledBooking/fleets/subscription/bookingrequests/processRenewalBilling`
Start renewal process for all subscriptions and fleets

authFetch path: `user/scheduledBooking/fleets/subscription/bookingrequests/processRenewalBilling` (base path `/boapi/proxy/user`)

**Query params:**
- `processDate`: string (date) (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202`, `400`

### POST `/scheduledBooking/fleets/subscription/bookingrequests/rollingcontract/renewal`
process renewal rolling contract subscriptions for all fleets

authFetch path: `user/scheduledBooking/fleets/subscription/bookingrequests/rollingcontract/renewal` (base path `/boapi/proxy/user`)

**Query params:**
- `processDate`: string (date) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202`, `400`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/bookingRequests/{id}/bookingRequestsSlave`
Retrieve history of all the flips performed by an end-user

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingRequests/{id}/bookingRequestsSlave` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `bookingStatus`: BookingStatusBO (required) — Only COMPLETED, ONGOING, UPCOMING supported
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SubscriptionBookingRequestHistoryDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests`
Create a Subscription Booking Request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `contractId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SubscriptionBookingRequestCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| userId | string | yes |  |
| profileId | string | yes |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | no |  |
| creationDate | string (date-time) | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| station | string | no |  |
| serviceId | string | yes |  |
| pricingId | string | no |  |
| productList | string[] | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| notes | string | no |  |
| parentId | string | no |  |
| bookingReferenceId | string | no |  |
| additionalDriverInvitations | string[] | no | List Additional driver email id |
| customPrice | CustomPriceDTO | no |  |
| rollingContract | boolean | no |  |

**Responses:** `200` → `SubscriptionBookingRequestOutDTO`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/digitalContracts`
create a new contract to sign

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/digitalContracts` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id of the user

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DigitalContractCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | Fleet id |
| externalId | string | no | The id of the digital contract that is sent by the provider at creation time |
| profileId | string | yes | Profile id of the user |
| userId | string | yes | Id of the user |
| documentType | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the document |

**Responses:** `201` → `DigitalContractCreationOutDTO`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/digitalContracts/{externalId}`
Update the status of a digital contract

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/digitalContracts/{externalId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id of the user
- `externalId`: string (required) — The contract id received from the digital signature provider

**Query params:**
- `status`: string (required) — The new status of the contract

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`, `400` → `string`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/preview`
Send back a preview of a subscription booking request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/preview` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SubscriptionBookingRequestCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| userId | string | yes |  |
| profileId | string | yes |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | no |  |
| creationDate | string (date-time) | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| station | string | no |  |
| serviceId | string | yes |  |
| pricingId | string | no |  |
| productList | string[] | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| notes | string | no |  |
| parentId | string | no |  |
| bookingReferenceId | string | no |  |
| additionalDriverInvitations | string[] | no | List Additional driver email id |
| customPrice | CustomPriceDTO | no |  |
| rollingContract | boolean | no |  |

**Responses:** `200` → `SubscriptionBookingRequestPreviewDTO`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}`
Get a subscription requests by its id

This endpoint will retrieve a subscription booking request. FRANCHISE COMPLIANT. PBA COMPLIANT

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bookingId`: string (required) — Id of the booking request

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `SubscriptionBookingRequestWithPPUDTO`, `400` → `SubscriptionBookingRequestWithPPUDTO`, `404` → `SubscriptionBookingRequestWithPPUDTO`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/allocate`
Allocate a vehicle to subscription booking request

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/allocate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `bookingId`: string (required)

**Query params:**
- `vehicleId`: string (optional)
- `serviceId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AllocatedSubscriptionBookingRequestDTO`, `400` → `AllocatedSubscriptionBookingRequestDTO`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/digitalContracts`
create a new contract to sign for the given bookingId

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{bookingId}/digitalContracts` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id of the user
- `bookingId`: string (required) — The booking request id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DigitalContractCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | Fleet id |
| externalId | string | no | The id of the digital contract that is sent by the provider at creation time |
| profileId | string | yes | Profile id of the user |
| userId | string | yes | Id of the user |
| documentType | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the document |

**Responses:** `201` → `DigitalContractWithBookingRequestIdOutDTO`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/digitalContracts`
Find all digital contracts for a booking request. This endpoint is PBA compatible

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/digitalContracts` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id of the user
- `id`: string (required) — The booking request id

**Query params:**
- `status`: string (optional) — The new status of the contract
- `type`: string (optional) — The type of the document (vehicle inspection document or digital contract)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `DigitalContractsForBookingRequestOutDTO[]`, `400` → `DigitalContractsForBookingRequestOutDTO[]`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/sendSwapReminder`
send swap reminder notification to the user for the given subscription

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/sendSwapReminder` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202`

### POST `/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/sendVehicleConfirmationEmail`
send email notification to the user when the vehicle confirmed for the given subscription

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/bookingrequests/{id}/sendVehicleConfirmationEmail` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `JSONObject`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/stations/{stationId}/vehicles/available`
Returns the subscription vehicles that are not booked in a station

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/stations/{stationId}/vehicles/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `stationId`: string (required)

**Query params:**
- `years`: integer (int32)[] (optional)
- `startDate`: string (optional) — beginning of the date range
- `endDate`: string (optional) — end of the date range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AvailableVehiclesSubscriptionDTO`, `400` → `AvailableVehiclesSubscriptionDTO`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/users/{userId}/active`
Returns a list of active subscriptions for a user

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/users/{userId}/active` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `pageable`: Pageable (required)
- `profileId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ActiveSubscriptionBookingRequestDTO[]`, `400` → `ActiveSubscriptionBookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/users/{userId}/past`
Returns a list of past subscriptions for a user

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/users/{userId}/past` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `pageable`: Pageable (required)
- `profileId`: string (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PastSubscriptionBookingRequestDTO[]`, `400` → `PastSubscriptionBookingRequestDTO[]`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/vehicles/available`
Return all subscription vehicles that are not booked

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/vehicles/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `startDate`: string (optional) — beginning of the date range
- `endDate`: string (optional) — end of the date range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`, `400` → `string[]`

### GET `/scheduledBooking/fleets/{fleetId}/subscription/vehicles/{vehicleId}/available`
Return the booking request associated to a vehicleId (if existing)

authFetch path: `user/scheduledBooking/fleets/{fleetId}/subscription/vehicles/{vehicleId}/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleAvailabilitySubscriptionDTO`, `400` → `VehicleAvailabilitySubscriptionDTO`
