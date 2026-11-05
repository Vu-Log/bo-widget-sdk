# AIMA Admin User API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-user (116 endpoints)

### GET `/by-service/fleets/{fleetId}/master/services`
List services linked to the master entity

authFetch path: `user/by-service/fleets/{fleetId}/master/services` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### GET `/by-service/fleets/{fleetId}/plans`
Get all plans for a given fleet

authFetch path: `user/by-service/fleets/{fleetId}/plans` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `status`: any (optional) — The status of the plans to retrieve
- `page`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PlanResponseDTO[]`, `400` → `PlanResponseDTO[]`

### POST `/by-service/fleets/{fleetId}/plans`
create a new plan

authFetch path: `user/by-service/fleets/{fleetId}/plans` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

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

### POST `/by-service/fleets/{fleetId}/profiles/{profileId}/serviceRegistrations`
Validate or reject user's registration to services in batch

Once the services are registered, the operator can confirm or reject the subscription for a given user

authFetch path: `user/by-service/fleets/{fleetId}/profiles/{profileId}/serviceRegistrations` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user who wants to register to the service. A user can have different profilesregistered to different services.

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ServiceRegistrationBatchDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorProfileId | string | no | ProfileId of the operator who is doing the batch update. It's required from tracability to know who has granted or suspended a user |
| actions | ActionDTO[] | yes | List of actions to be done on the service registration |
| disableEmailNotification | boolean | no | Must be set to true if you don't want to generate an email notification to inform the user of this change (false by default) |

**Responses:** `200` → `ServiceRegistrationValidationResultDTO[]`

### POST `/by-service/fleets/{fleetId}/profiles/{profileId}/services/{id}/result`
Validate or reject user's registration to a service

Once the service registered, the operator can confirm or reject the subscription for a given user

authFetch path: `user/by-service/fleets/{fleetId}/profiles/{profileId}/services/{id}/result` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user who wants to register to the service. A user can have different profilesregistered to different services.
- `id`: any (required) — Id of the service

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ServiceRegistrationResultDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorProfileId | string | yes | UserID of the operator who is doing the service registration change |
| requestStatus | string: `APPROVED`, `PENDING`, `REJECTED`, `INCOMPLETE`, `SUSPENDED` | yes | Status: * APPROVED: the user can book a vehicle of the service * PENDING: the status when the user has just submit his registration (the user cannot book) * RE… |
| reasonForChange | string | no | Reason why the status of the service change |

**Responses:** `200` → `string`

### GET `/by-service/fleets/{fleetId}/serviceRegistrationOverview`
get an overview of the service statuses for a list of userIds

This endpoint will retrieve an overview of the service statuses for a list of userIds

authFetch path: `user/by-service/fleets/{fleetId}/serviceRegistrationOverview` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `userIds`: string[] (required) — List of userIds to check

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserServiceRegistrationDTO[]`

### GET `/by-service/fleets/{fleetId}/users`
List all the users of the fleet

It's a paginated end point

authFetch path: `user/by-service/fleets/{fleetId}/users` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `startDate`: any (optional) — from this date
- `endDate`: any (optional) — to this date
- `status`: any (optional) — Filter by user account status
- `serviceId`: any (optional) — Filter by serviceId
- `profileType`: any (optional) — Filter by type of profile
- `pageable`: Pageable (required)

**Header params:**
- `version`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserServiceRegistrationNestedDTO[]`

### GET `/by-service/fleets/{fleetId}/users/list`
Get a subset of users by ids

the number of users is limited to 100 per call

authFetch path: `user/by-service/fleets/{fleetId}/users/list` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `ids`: string[] (required) — List of userIds

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO[]`

### POST `/by-service/fleets/{fleetId}/users/list`
Get a subset of users by ids

the number of users is limited to 100 per call

authFetch path: `user/by-service/fleets/{fleetId}/users/list` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200` → `UserPIDTO[]`

### POST `/by-service/fleets/{fleetId}/users/pi/find`
Find users by username, phone number, or email

authFetch path: `user/by-service/fleets/{fleetId}/users/pi/find` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PersonalInformationSearchRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| username | string | no |  |
| phoneNumber | string | no |  |
| email | string | no |  |

**Responses:** `200` → `PersonalInformationSearchResponseDTO`

### POST `/by-service/fleets/{fleetId}/users/pi/list`
Get personal information for a list of users

authFetch path: `user/by-service/fleets/{fleetId}/users/pi/list` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PersonalInformationForUserIdsRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userIds | string[] | no |  |

**Responses:** `200` → `PersonalInformationForUserIdsResponseDTO`

### GET `/by-service/fleets/{fleetId}/users/{id}/status`
Get users info including its service registration status

authFetch path: `user/by-service/fleets/{fleetId}/users/{id}/status` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserStatusDTO`

### GET `/by-service/fleets/{fleetId}/users/{userId}`
Get user by ID

authFetch path: `user/by-service/fleets/{fleetId}/users/{userId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserWithProfileDTO`

### GET `/by-service/fleets/{fleetId}/users/{userId}/pi`
Get personal information by user ID

authFetch path: `user/by-service/fleets/{fleetId}/users/{userId}/pi` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PersonalInformationUserDTO`

### GET `/by-service/fleets/{fleetId}/users/{userId}/profiles/{profileId}/paymentMethodDetails`
Get payment details (credit card or bank account) of a user profile

authFetch path: `user/by-service/fleets/{fleetId}/users/{userId}/profiles/{profileId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `userId`: any (required) — userId
- `profileId`: any (required) — profileId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PaymentDetail`, `400` → `PaymentDetail`, `404` → `PaymentDetail`

### GET `/fleets/{fleetId}/billingGroup`
Get all billing group for a given fleet

This endpoint retrieves all the billing group of a fleet

authFetch path: `user/fleets/{fleetId}/billingGroup` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BillingGroup[]`, `204` → `BillingGroup[]`, `400` → `BillingGroup[]`

### POST `/fleets/{fleetId}/billingGroup`
Create a billing group for a given fleet

Creates a new billing group for the fleet

authFetch path: `user/fleets/{fleetId}/billingGroup` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BillingGroup`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the billing group |
| fleetId | string | yes | fleetId (cannot be updated) |
| name | string | yes | The name of the billing group |
| discount | number | yes | The percentage of discount applied by the billing group (from 0.00 to 100.00%) |
| overMileageCap | number | yes | The distance cap allowed by the billing group before being charge from overmileage |
| overMileageRate | number | yes | The distance overmileage pricing rate for each unite of distance above the cap |
| customRules | BillingGroupCustomRule[] | no | Granular discount rules refining the base discount, per service and per product |

**Responses:** `201` → `BillingGroup`, `400` → `BillingGroup`

### GET `/fleets/{fleetId}/billingGroup/{billingGroupId}`
Get a billing group for a given fleet by id

This endpoint retrieves a specific billing group by its id

authFetch path: `user/fleets/{fleetId}/billingGroup/{billingGroupId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `billingGroupId`: any (required) — The billing group to retrieve

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BillingGroup`, `204` → `BillingGroup`, `400` → `BillingGroup`

### POST `/fleets/{fleetId}/billingGroup/{billingGroupId}`
Update an existing billing group

Update data on an existing billing group

authFetch path: `user/fleets/{fleetId}/billingGroup/{billingGroupId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `billingGroupId`: any (required) — The billing group to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BillingGroup`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the billing group |
| fleetId | string | yes | fleetId (cannot be updated) |
| name | string | yes | The name of the billing group |
| discount | number | yes | The percentage of discount applied by the billing group (from 0.00 to 100.00%) |
| overMileageCap | number | yes | The distance cap allowed by the billing group before being charge from overmileage |
| overMileageRate | number | yes | The distance overmileage pricing rate for each unite of distance above the cap |
| customRules | BillingGroupCustomRule[] | no | Granular discount rules refining the base discount, per service and per product |

**Responses:** `200` → `BillingGroup`, `400` → `BillingGroup`

### POST `/fleets/{fleetId}/billingGroup/{billingGroupId}/entities`
Add a list of users to a billing group

This will link a group of entities to a billing group

authFetch path: `user/fleets/{fleetId}/billingGroup/{billingGroupId}/entities` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `billingGroupId`: any (required) — The billing group to link

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200`, `204`, `400`

### DELETE `/fleets/{fleetId}/billingGroup/{billingGroupId}/entities/{entityId}`
Remove a user from a billing group

This endpoint will remove an entity from a billing group

authFetch path: `user/fleets/{fleetId}/billingGroup/{billingGroupId}/entities/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `billingGroupId`: any (required) — The billing group to unlink
- `entityId`: any (required) — The entity to unlink

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `204`, `400`

### POST `/fleets/{fleetId}/billingGroup/{billingGroupId}/removeEntities`
Remove a list of users from a billing group

This endpoint will remove a list of entities from a billing group

authFetch path: `user/fleets/{fleetId}/billingGroup/{billingGroupId}/removeEntities` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `billingGroupId`: any (required) — The billing group to unlink

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200`, `204`, `400`

### POST `/fleets/{fleetId}/cities/{id}/users/{userId}/agreements`
Create or update terms of use (ToU) agreement for the specified user in the specified city

authFetch path: `user/fleets/{fleetId}/cities/{id}/users/{userId}/agreements` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserAgreementDTO[]`

### PUT `/fleets/{fleetId}/documents/{documentId}`
Set a status and a reviewer for a document

Once a document has been reviewed by an operator it can be flagged with a status

authFetch path: `user/fleets/{fleetId}/documents/{documentId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The document fleetId
- `documentId`: any (required) — the document ID

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentStatusReview`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string: `MISSING`, `VALID`, `INVALID`, `EXPIRED`, `PENDING_REVIEW` | yes | Document's status: * MISSING: initial status at the document's creation * VALID: Document reviewed and approved * INVALID: Document reviewed and not valid * EX… |
| reviewer | string | yes | UserID of the operator who has done the review |

**Responses:** `200` → `DocumentFullDTO`, `400`, `404`

### GET `/fleets/{fleetId}/documents/{status}`
List of users by document status

Get the list of users by document status of user

authFetch path: `user/fleets/{fleetId}/documents/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required) — the status of document

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ConnectedAccountLinkDTO[]`, `404` → `UserByDocumentStatusDTO[]`

### POST `/fleets/{fleetId}/entities/list`
Returns all entities with given IDs.

this end point is paginated

authFetch path: `user/fleets/{fleetId}/entities/list` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `status`: string (optional) — Entity Status
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `200` → `EntityPiDTO[]`

### PUT `/fleets/{fleetId}/entities/master/add/services/{serviceId}`
Link a service to the master entity

authFetch path: `user/fleets/{fleetId}/entities/master/add/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `serviceId`: string (required) — serviceId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### DELETE `/fleets/{fleetId}/entities/master/remove/services/{serviceId}`
Remove a service from the master entity

authFetch path: `user/fleets/{fleetId}/entities/master/remove/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `serviceId`: string (required) — serviceId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### GET `/fleets/{fleetId}/entities/{entityId}`
Get entity by Id

authFetch path: `user/fleets/{fleetId}/entities/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### POST `/fleets/{fleetId}/entities/{entityId}`
Update an entity

authFetch path: `user/fleets/{fleetId}/entities/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `UpdateEntityXDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| tokenId | string | no | entity's payment token generated by the payment provider |
| entityName | string | no | Entity friendly name |
| type | string: `Family`, `Business`, `Personal` | yes | Entity's type |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INCOMPLETE`, `OUTSTANDING_BALANCE` | yes | Entity's status |
| mandatoryTripNotes | boolean | no | True if trip notes are mandatory for this entity |
| fiscalCode | string | no | fiscal code |

**Responses:** `200` → `EntityDTO`

### GET `/fleets/{fleetId}/entities/{entityId}/paymentMethodDetails`
Get payment method of an entity

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityPaymentMethodDTO`

### DELETE `/fleets/{fleetId}/entities/{entityId}/paymentMethodDetails`
Delete a payment Method linked to an entity.

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PaymentDetail`, `404` → `PaymentDetail`

### GET `/fleets/{fleetId}/entities/{entityId}/services`
Get Services for the entity by Id

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceFull[]`

### PUT `/fleets/{fleetId}/entities/{entityId}/services/{serviceId}`
Link a service to an entity

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId
- `serviceId`: string (required) — service id to add

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### DELETE `/fleets/{fleetId}/entities/{entityId}/services/{serviceId}`
Remove a service from an entity

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/services/{serviceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId
- `serviceId`: string (required) — service id to add

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### GET `/fleets/{fleetId}/entities/{entityId}/users`
List the users of a given entity

authFetch path: `user/fleets/{fleetId}/entities/{entityId}/users` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO[]`

### GET `/fleets/{fleetId}/invitation/check/{referralCode}`
Check an invitation code

authFetch path: `user/fleets/{fleetId}/invitation/check/{referralCode}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `referralCode`: string (required) — The invitation code

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ReferralInfoDTO`, `404` → `ReferralInfoDTO`

### POST `/fleets/{fleetId}/invitation/users/{userId}/entity/{entityId}/invitationCode`
Get or generate an invitation code

authFetch path: `user/fleets/{fleetId}/invitation/users/{userId}/entity/{entityId}/invitationCode` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)
- `entityId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `InvitationDTO`, `404` → `InvitationDTO`

### POST `/fleets/{fleetId}/invitation/users/{userId}/entity/{entityId}/redeem/{referralCode}`
Redeem an invitation

authFetch path: `user/fleets/{fleetId}/invitation/users/{userId}/entity/{entityId}/redeem/{referralCode}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId of the user
- `entityId`: string (required) — ent
- `referralCode`: string (required) — The invitation code

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### GET `/fleets/{fleetId}/master/services`
List services linked to the master entity

authFetch path: `user/fleets/{fleetId}/master/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `EntityDTO`

### GET `/fleets/{fleetId}/myProfile`

authFetch path: `user/fleets/{fleetId}/myProfile` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `200` → `MyProfileDTO`

### GET `/fleets/{fleetId}/oldCustomers/{oldCustomerId}`
Get user's info by oldCustomerId

authFetch path: `user/fleets/{fleetId}/oldCustomers/{oldCustomerId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `oldCustomerId`: string (required) — oldCustomerId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO`

### POST `/fleets/{fleetId}/profiles`
Create a profile

authFetch path: `user/fleets/{fleetId}/profiles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SimpleProfileDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| fleetId | string | yes | fleetId |
| phoneNumber | string | no | Phonenumber links to the profile |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | no | This status can be used to block a certain profile without impacting the other. |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| identificationNumber | string | no | *(deprecated)* deprecated |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| financialInformation | FinancialInformationDTO | no | Contains the eventual financial information related to this profile |

**Responses:** `200` → `ProfilePiDTO`

### GET `/fleets/{fleetId}/profiles/{id}`
Get a profile by id

authFetch path: `user/fleets/{fleetId}/profiles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — profileId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProfilePiDTO`

### POST `/fleets/{fleetId}/profiles/{id}`
Update a profile

authFetch path: `user/fleets/{fleetId}/profiles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — profileId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Request body:** `SimpleProfileDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| fleetId | string | yes | fleetId |
| phoneNumber | string | no | Phonenumber links to the profile |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | no | This status can be used to block a certain profile without impacting the other. |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| identificationNumber | string | no | *(deprecated)* deprecated |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| financialInformation | FinancialInformationDTO | no | Contains the eventual financial information related to this profile |

**Responses:** `200` → `ProfilePiDTO`

### POST `/fleets/{fleetId}/profiles/{profileId}/archive`
Archive a Profile (business or personal)

authFetch path: `user/fleets/{fleetId}/profiles/{profileId}/archive` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202`, `400`

### POST `/fleets/{fleetId}/profiles/{profileId}/deactivate`
Deactivate a Profile (business or personal)

authFetch path: `user/fleets/{fleetId}/profiles/{profileId}/deactivate` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `202`, `400`

### POST `/fleets/{fleetId}/profiles/{profileId}/serviceRegistrations`
Validate or reject user's registration to services in batch

Once the services are registered, the operator can confirm or reject the subscription for a given user

authFetch path: `user/fleets/{fleetId}/profiles/{profileId}/serviceRegistrations` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user who wants to register to the service. A user can have different profilesregistered to different services.

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ServiceRegistrationBatchDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorProfileId | string | no | ProfileId of the operator who is doing the batch update. It's required from tracability to know who has granted or suspended a user |
| actions | ActionDTO[] | yes | List of actions to be done on the service registration |
| disableEmailNotification | boolean | no | Must be set to true if you don't want to generate an email notification to inform the user of this change (false by default) |

**Responses:** `200` → `ServiceRegistrationValidationResultDTO[]`

### PUT `/fleets/{fleetId}/profiles/{profileId}/services/{id}`
Register a user to a service

To have an access to a service and be able to book one of its vehicle, a user must register to this service. Once the subscription done, it must be validated by the operator before being able to book.

authFetch path: `user/fleets/{fleetId}/profiles/{profileId}/services/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user who wants to register to the service. A user can have different profilesregistered to different services.
- `id`: any (required) — Id of the service

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### POST `/fleets/{fleetId}/profiles/{profileId}/services/{id}/statusNote`
Update reason for change when service is REJECTED or SUSPENDED

Once the service is REJECTED or SUSPENDED, the operator can add/update a note corresponding to the status change

authFetch path: `user/fleets/{fleetId}/profiles/{profileId}/services/{id}/statusNote` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user
- `id`: any (required) — Id of the service

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `StatusNote`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reasonForChange | string | yes | Reason for change of status |

**Responses:** `200`

### GET `/fleets/{fleetId}/rfids/{rfid}`
Get user's info by rfid

authFetch path: `user/fleets/{fleetId}/rfids/{rfid}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `rfid`: string (required) — user rfid

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO`

### GET `/fleets/{fleetId}/rfids/{rfid}/status`
Get user's service registration status by rfid

authFetch path: `user/fleets/{fleetId}/rfids/{rfid}/status` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `rfid`: string (required) — user rfid

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserStatusDTO`

### GET `/fleets/{fleetId}/roles/available`
Return all the available roles

authFetch path: `user/fleets/{fleetId}/roles/available` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`

### GET `/fleets/{fleetId}/roles/{roleName}`
List all users of a given role (this end point is paginated)

authFetch path: `user/fleets/{fleetId}/roles/{roleName}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `roleName`: string (required) — role

**Query params:**
- `page`: integer (int32) (optional)
- `limit`: integer (int32) (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO[]`

### GET `/fleets/{fleetId}/serviceRegistrationOverview`
get an overview of the service statuses for a list of userIds

This endpoint will retrieve an overview of the service statuses for a list of userIds

authFetch path: `user/fleets/{fleetId}/serviceRegistrationOverview` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Query params:**
- `userId`: string[] (required) — List of userIds to check

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserServiceRegistrationDTO[]`

### GET `/fleets/{fleetId}/services/{id}/profiles/{profileId}/status`
Verify if a profileId can use (=book) on a serviceId

This endpoint will check if a user can book on a service for a given profileId.

authFetch path: `user/fleets/{fleetId}/services/{id}/profiles/{profileId}/status` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `profileId`: any (required) — The profileId of the user
- `id`: any (required) — Id of the service

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/services/{id}/rightsPropagation`
information on the propagation of access when registering to a service

This return the list of services which inherit from the provided serviceId.For example a kickscooter service can be linked to the car sharing service. In this case when a profile of a user is approved on the car sharing, it will be approved on the kickscooter too

authFetch path: `user/fleets/{fleetId}/services/{id}/rightsPropagation` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `id`: any (required) — Id of the service

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceRightsPropagationDTO`

### POST `/fleets/{fleetId}/userDefault`
create a user with personal profile and entity

It's the end point to create a new user.This will create a new user with a single profile and entity then you'll be able to fill up the attributes of his user,profile and entity object

authFetch path: `user/fleets/{fleetId}/userDefault` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `tcApproval`: boolean (optional)
- `skipUserNotification`: boolean (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SimpleUserDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique user id generated at the user creation by the system |
| fleetId | string | yes | fleetId |
| userName | string | yes | username/login of the user. cannot be updated after the creation |
| firstName | string | yes | User first name |
| lastName | string | yes | User last name |
| password | string | yes | user's password |
| email | string (email) | yes | user's primary email. This will be the email address of the single profile. It's mandatory to be able to send the reset password email |
| accountStatus | string: `CREATED`, `INCOMPLETE`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INACTIVE` | no | Account status at the creation (INCOMPLETE by default) |
| gender | string: `MALE`, `FEMALE`, `UNDEFINED` | no | Gender |
| dataPrivacyConsent | boolean | no | The user accepts to share his private data with third partners of the operator |
| profilingConsent | boolean | no | The user accepts to participate to data science processing |
| marketingConsent | boolean | no | The user accepts to receive marketing emails from the operator |
| membershipNumber | string | no | Membership number |
| phoneNumber | string | no | User's primary phone will be associated with the Personal profile |
| birthDate | string (date-time) | no | User's birth date (yes you can be very precise on the birthdate) |
| businessUser | boolean | no | if true the business profile will be created at the same time than the personal profile |
| entityId | string | no | Business entity to attach the business profile (it's the required when businessUser=true) |
| businessEmail | string (email) | no | Business email to attach the business profile (it's the required when businessUser=true) |
| referralCode | string | no | Referral code |
| fiscalCode | string | no | fiscal code |
| membershipStatus | string: `VALID`, `INVALID` | no | Status of the membership |
| countryBirth | string | no | The country Of birth |
| provinceRegionBirth | string | no | The Province/Region Of birth |
| cityBirth | string | no | The City Of birth |
| userIndividualBusiness | UserIndividualBusinessDTO | no | Individual business information |
| serviceIds | string[] | no | A set of service IDs to which the user will be registered |
| emailConsent | boolean | no |  |
| locale | string | no | User's locale used to personalize the language in the app (default en_US) |

**Responses:** `201` → `string`, `400` → `string`, `409` → `string`

### GET `/fleets/{fleetId}/usernames/{userName}`
Get user's info by username

authFetch path: `user/fleets/{fleetId}/usernames/{userName}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userName`: string (required) — userName

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO`

### GET `/fleets/{fleetId}/users`
List all the users of the fleet

It's a paginated end point

authFetch path: `user/fleets/{fleetId}/users` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `startDate`: string (optional) — from this date
- `endDate`: string (optional) — to this date
- `status`: string (optional) — Filter by user account status
- `serviceId`: string (optional) — Filter by serviceId
- `profileType`: string (optional) — Filter by type of profile
- `pageable`: Pageable (required)

**Header params:**
- `version`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserServiceRegistrationNestedDTO[]`

### POST `/fleets/{fleetId}/users-exist`
List all the existing users ids

authFetch path: `user/fleets/{fleetId}/users-exist` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `IdsDTOString`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ids | string[] | yes |  |

**Responses:** `200` → `IdsDTOString`

### GET `/fleets/{fleetId}/users/documentTypes`
List all types of document

authFetch path: `user/fleets/{fleetId}/users/documentTypes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `DocumentTypeDTO[]`

### POST `/fleets/{fleetId}/users/documentTypes`
Add a new document's type

authFetch path: `user/fleets/{fleetId}/users/documentTypes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentType`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| type | string | yes | type of document |
| name | string | yes | Document's name |
| mandatory | boolean | no | deprecated see service.documentTypes |
| hasNumber | boolean | yes | if this document include an id number |
| hasExpirationDate | boolean | yes | if this document has an expiration date |
| numberUploadUrl | integer (int32) | no | number of file's attachment |
| hasIssuingCountry | boolean | yes | if this document is issued by a country |
| hasIssuingOffice | boolean | yes | if this document is issued by an office or municipality |
| hasIssuingDate | boolean | yes | if this document has an issuing date |
| hasDlClass | boolean | yes | if this document has an driving license category |
| hasIssuingSubdivision | boolean | yes | Indicates if this document requires a subdivision |
| sensible | boolean | no | Indicates if this document type contains sensitive data that must be protected |

**Responses:** `200` → `DocumentType`

### PUT `/fleets/{fleetId}/users/documentTypes/{documentTypeId}`
Update an existed document's type

authFetch path: `user/fleets/{fleetId}/users/documentTypes/{documentTypeId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `documentTypeId`: string (required) — The Id of documentType

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentType`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| type | string | yes | type of document |
| name | string | yes | Document's name |
| mandatory | boolean | no | deprecated see service.documentTypes |
| hasNumber | boolean | yes | if this document include an id number |
| hasExpirationDate | boolean | yes | if this document has an expiration date |
| numberUploadUrl | integer (int32) | no | number of file's attachment |
| hasIssuingCountry | boolean | yes | if this document is issued by a country |
| hasIssuingOffice | boolean | yes | if this document is issued by an office or municipality |
| hasIssuingDate | boolean | yes | if this document has an issuing date |
| hasDlClass | boolean | yes | if this document has an driving license category |
| hasIssuingSubdivision | boolean | yes | Indicates if this document requires a subdivision |
| sensible | boolean | no | Indicates if this document type contains sensitive data that must be protected |

**Responses:** `200` → `DocumentType`

### GET `/fleets/{fleetId}/users/documents/expired`
Get a list of APPROVED users with any of the documents expired

it's a paginated end point

authFetch path: `user/fleets/{fleetId}/users/documents/expired` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ExpiredDocumentsPerUserDTO[]`

### GET `/fleets/{fleetId}/users/entity/{entityId}`
Returns all users for the given entity, fleet and (if provided) for given user's profile status.

authFetch path: `user/fleets/{fleetId}/users/entity/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Query params:**
- `pageable`: Pageable (required)
- `archived`: boolean (optional)
- `profileStatus`: string (optional) — profile's status

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserAndProfileDTO[]`

### POST `/fleets/{fleetId}/users/entity/{entityId}/externalBilling/paymentMethod`
Create an external Payment Method, and link it to an entity.

authFetch path: `user/fleets/{fleetId}/users/entity/{entityId}/externalBilling/paymentMethod` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `201` → `PaymentDetail`, `400` → `PaymentDetail`, `404` → `PaymentDetail`

### POST `/fleets/{fleetId}/users/entity/{entityId}/externalBilling/paymentMethod/status`
Update the status of an external Payment Method linked to an entity.

authFetch path: `user/fleets/{fleetId}/users/entity/{entityId}/externalBilling/paymentMethod/status` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `201` → `PaymentDetail`, `400` → `PaymentDetail`, `404` → `PaymentDetail`

### GET `/fleets/{fleetId}/users/entity/{entityId}/paymentMethodDetails`
get payment details (credit card or bank account) by entityId

authFetch path: `user/fleets/{fleetId}/users/entity/{entityId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PaymentDetail`, `400` → `PaymentDetail`

### POST `/fleets/{fleetId}/users/entity/{entityId}/paymentMethodDetails/status`
Update the status of an payment Method linked to an entity.

authFetch path: `user/fleets/{fleetId}/users/entity/{entityId}/paymentMethodDetails/status` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `404` → `PaymentDetail`

### POST `/fleets/{fleetId}/users/list`
Get a subset of users by ids

the number of users is limited to 100 per call

authFetch path: `user/fleets/{fleetId}/users/list` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200` → `UserPIDTO[]`

### GET `/fleets/{fleetId}/users/phoneNumbers/{phoneNumber}`
get user with the concerned phone number

authFetch path: `user/fleets/{fleetId}/users/phoneNumbers/{phoneNumber}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `phoneNumber`: string (required) — phone number

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserBasicDTO`

### POST `/fleets/{fleetId}/users/pi/find`
Find users by username, phone number, or email

authFetch path: `user/fleets/{fleetId}/users/pi/find` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PersonalInformationSearchRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| username | string | no |  |
| phoneNumber | string | no |  |
| email | string | no |  |

**Responses:** `200` → `PersonalInformationSearchResponseDTO`

### POST `/fleets/{fleetId}/users/pi/list`
Get personal information for a list of users

authFetch path: `user/fleets/{fleetId}/users/pi/list` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PersonalInformationForUserIdsRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userIds | string[] | no |  |

**Responses:** `200` → `PersonalInformationForUserIdsResponseDTO`

### POST `/fleets/{fleetId}/users/resetLostPassword/{tokenId}`
Reset password using the token provided in the reset password link

authFetch path: `user/fleets/{fleetId}/users/resetLostPassword/{tokenId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tokenId`: string (required) — token provided in the reset password link

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PasswordDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| password | string | yes | user's password |

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/users/status/{accountStatus}`
List users by account status

authFetch path: `user/fleets/{fleetId}/users/status/{accountStatus}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `accountStatus`: String: `INCOMPLETE,APPROVED,PENDING,REJECTED,SUSPENDED,ARCHIVED` (required) — user's account status

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserPIDTO[]`

### GET `/fleets/{fleetId}/users/uploadBaseUrl`

authFetch path: `user/fleets/{fleetId}/users/uploadBaseUrl` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### POST `/fleets/{fleetId}/users/{email}/sendLostPasswordEmail`
Send reset password link to the email address provided

authFetch path: `user/fleets/{fleetId}/users/{email}/sendLostPasswordEmail` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `email`: string (required) — Email's address which will received the reset password link

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### POST `/fleets/{fleetId}/users/{id}`
Update user's identity information

authFetch path: `user/fleets/{fleetId}/users/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-caller-id`: string (optional)
- `x-client-id`: string (optional)

**Request body:** `UserPIDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the user creation by the system |
| fleetId | string | yes | fleetId |
| accountStatus | string: `INCOMPLETE,PENDING,APPROVED,REJECTED,SUSPENDED,ARCHIVED` | no | Account status at the creation (INCOMPLETE by default) |
| locale | string | no | User's locale used to personalize the language in the app (default en_US) |
| registrationDate | string (date-time) | no | Creation date of this account |
| dataPrivacyConsent | boolean | no | The user accepts to share his private data with third partners of the operator |
| dataPrivacyConsentUpdateDate | string (date-time) | no |  |
| profilingConsent | boolean | no | The user accepts to participate to data science processing |
| profilingConsentUpdateDate | string (date-time) | no | Date of the acceptation of the Profiling consent |
| marketingConsent | boolean | no | The user accepts to receive marketing emails from the operator |
| marketingConsentUpdateDate | string (date-time) | no | Date of the acceptation of the Marketing consent |
| dateOfAgreements | string (date-time) | no | Last date of the acceptation of agreements |
| agreements | UserAgreementDTO[] | no | List of all city agreement's acceptations. One Agreement per city (term of uses is per city) |
| oldCustomerId | string | no | When a user has been migrated from on old platform/crm it's old user id is referenced hee |
| updateDate | string (date-time) | no | Last update date of this account |
| membershipStatus | string: `VALID`, `INVALID` | no | Status of the membership |
| surveyConsent | boolean | no | The user accepts to be contacted for surveys |
| shareDataConsent | boolean | no | The user accepts to share his data to other associated companies |
| surveyConsentUpdateDate | string (date-time) | no | Last update date of this survey consent |
| shareDataConsentUpdateDate | string (date-time) | no | Last update date of this shareData consent |
| userName | string | no | username/login of the user. cannot be updated after the creation |
| lastName | string | no | User last name |
| firstName | string | no | User first name |
| middleName | string | no | User middle name |
| preferredName | string | no | User preferred name |
| userStatusNote | string | no | Free field to put note when the account status changed |
| gender | string | no | Gender |
| birthDate | string (date-time) | no | User's birth date (yes you can be very precise on the birthdate) |
| nationality | string | no | nationality |
| membershipNumber | string | no | Membership number |
| notes | string | no | Free field to store any information about the user |
| address | AddressDTO | no | User's postal address (this field is managed by a dedicated end point |
| profiles | ProfilePiDTO[] | no |  |
| costCenter | CostCenterDTO | no |  |
| countryBirth | string | no | The country Of birth |
| provinceRegionBirth | string | no | The Province/Region Of birth |
| cityBirth | string | no | The City Of birth |
| userIndividualBusiness | UserIndividualBusinessOutputDTO | no | Individual business information |

**Responses:** `200` → `UserPIDTO`

### POST `/fleets/{fleetId}/users/{id}/address`
Update user's postal address

authFetch path: `user/fleets/{fleetId}/users/{id}/address` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Request body:** `AddressDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| streetName | string | no | Street name |
| streetName2 | string | no | Street name2 |
| streetType | string | no | Street type |
| city | string | no | City |
| postalCode | string | no | Postal code |
| region | string | no | Region |
| province | string | no | Province |
| country | string | no | Country |
| countryCode | string | no | Country code |
| number | string | no | Number |
| addressAdditionalInformation | string | no | Address additional information |

**Responses:** `200` → `AddressDTO`

### POST `/fleets/{fleetId}/users/{id}/individualBusiness`
Update user's individual business info

authFetch path: `user/fleets/{fleetId}/users/{id}/individualBusiness` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Request body:** `UserIndividualBusinessDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| companyName | string | yes | The name of the company |
| vat | string | no | Individual business VAT |
| number | string | no | Individual business address number |
| streetName | string | yes | Individual business address street name |
| addressAdditionalInformation | string | no | Individual business address additional information |
| city | string | yes | Individual business address city |
| postalCode | string | yes | Individual business address postal code |
| country | string | yes | Individual business address country |

**Responses:** `201` → `UserIndividualBusinessOutputDTO`, `403` → `UserIndividualBusinessOutputDTO`, `404` → `UserIndividualBusinessOutputDTO`

### DELETE `/fleets/{fleetId}/users/{id}/individualBusiness`
Update a user by deleting the associated individual business info

authFetch path: `user/fleets/{fleetId}/users/{id}/individualBusiness` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Responses:** `200` → `UserIndividualBusinessOutputDTO`, `403` → `UserIndividualBusinessOutputDTO`, `404` → `UserIndividualBusinessOutputDTO`

### POST `/fleets/{fleetId}/users/{id}/reset`
direct update of user's password

authFetch path: `user/fleets/{fleetId}/users/{id}/reset` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Request body:** `PasswordDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| password | string | yes | user's password |

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/users/{id}/status`
Get user's info including its service registration status

authFetch path: `user/fleets/{fleetId}/users/{id}/status` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserStatusDTO`

### GET `/fleets/{fleetId}/users/{id}/userLabels`
retrieve user labels attached to a given user

authFetch path: `user/fleets/{fleetId}/users/{id}/userLabels` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id
- `id`: string (required) — user id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `LabelDTO[]`

### POST `/fleets/{fleetId}/users/{id}/userLabels`
attach a label to a given user

authFetch path: `user/fleets/{fleetId}/users/{id}/userLabels` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id
- `id`: string (required) — user id

**Header params:**
- `x-boapi-ctx`: string (optional)

**Request body:** `CreateUserLabelRequestDto`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| labelId | integer (int64) | yes | label identifier |

**Responses:** `200` → `UserWithProfileDTO`, `409` → `UserWithProfileDTO`

### DELETE `/fleets/{fleetId}/users/{id}/userLabels/{userLabelId}`
detach a label from a given user

authFetch path: `user/fleets/{fleetId}/users/{id}/userLabels/{userLabelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleet id
- `id`: string (required) — user id
- `userLabelId`: integer (int64) (required) — user label id

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `200` → `UserWithProfileDTO`, `404` → `UserWithProfileDTO`

### POST `/fleets/{fleetId}/users/{userId}/archive`
Archive a user, all his private information will be deleted

authFetch path: `user/fleets/{fleetId}/users/{userId}/archive` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-client-id`: string (optional)

**Responses:** `200` → `UserBasicDTO`

### GET `/fleets/{fleetId}/users/{userId}/documents`
List user's documents

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — document's owner

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `DocumentSummaryDTO`

### POST `/fleets/{fleetId}/users/{userId}/documents`
Create a document for a user

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — document's owner

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentType | string | yes | type of document |
| documentNumber | string | no | Document number |
| expirationDate | string (date-time) | no | expiration date of document |
| approvalDate | string (date-time) | no | Last approval date of document |
| issuingCountry | string: `AD`, `AE`, `AF`, `AG`, `AI`, `AL`, `AM`, `AO`, `AQ`, `AR`, `AS`, `AT`, `AU`, `AW`, `AX`, `AZ`, `BA`, `BB`, `BD`, `BE`, `BF`, `BG`, `BH`, `BI`, `BJ`, `BL`, `BM`, `BN`, `BO`, `BQ`, `BR`, `BS`, `BT`, `BV`, `BW`, `BY`, `BZ`, `CA`, `CC`, `CD`, `CF`, `CG`, `CH`, `CI`, `CK`, `CL`, `CM`, `CN`, `CO`, `CR`, `CU`, `CV`, `CW`, `CX`, `CY`, `CZ`, `DE`, `DJ`, `DK`, `DM`, `DO`, `DZ`, `EC`, `EE`, `EG`, `EH`, `ER`, `ES`, `ET`, `FI`, `FJ`, `FK`, `FM`, `FO`, `FR`, `GA`, `GB`, `GD`, `GE`, `GF`, `GG`, `GH`, `GI`, `GL`, `GM`, `GN`, `GP`, `GQ`, `GR`, `GS`, `GT`, `GU`, `GW`, `GY`, `HK`, `HM`, `HN`, `HR`, `HT`, `HU`, `ID`, `IE`, `IL`, `IM`, `IN`, `IO`, `IQ`, `IR`, `IS`, `IT`, `JE`, `JM`, `JO`, `JP`, `KE`, `KG`, `KH`, `KI`, `KM`, `KN`, `KP`, `KR`, `KW`, `KY`, `KZ`, `LA`, `LB`, `LC`, `LI`, `LK`, `LR`, `LS`, `LT`, `LU`, `LV`, `LY`, `MA`, `MC`, `MD`, `ME`, `MF`, `MG`, `MH`, `MK`, `ML`, `MM`, `MN`, `MO`, `MP`, `MQ`, `MR`, `MS`, `MT`, `MU`, `MV`, `MW`, `MX`, `MY`, `MZ`, `NA`, `NC`, `NE`, `NF`, `NG`, `NI`, `NL`, `NO`, `NP`, `NR`, `NU`, `NZ`, `OM`, `PA`, `PE`, `PF`, `PG`, `PH`, `PK`, `PL`, `PM`, `PN`, `PR`, `PS`, `PT`, `PW`, `PY`, `QA`, `RE`, `RO`, `RS`, `RU`, `RW`, `SA`, `SB`, `SC`, `SD`, `SE`, `SG`, `SH`, `SI`, `SJ`, `SK`, `SL`, `SM`, `SN`, `SO`, `SR`, `SS`, `ST`, `SV`, `SX`, `SY`, `SZ`, `TC`, `TD`, `TF`, `TG`, `TH`, `TJ`, `TK`, `TL`, `TM`, `TN`, `TO`, `TR`, `TT`, `TV`, `TW`, `TZ`, `UA`, `UG`, `UM`, `US`, `UY`, `UZ`, `VA`, `VC`, `VE`, `VG`, `VI`, `VN`, `VU`, `WF`, `WS`, `YE`, `YT`, `ZA`, `ZM`, `ZW` | yes | if this document is issued by a country |
| dlClass | string | no | driving license class |
| issuingDate | string (date-time) | no | issuing date of document |
| issuingOffice | string | no | issuing office or municipality of document |
| issuingSubdivision | string | no | Subdivision code where the document was issued. - This field is required only if the document type requires it (`hasIssuingSubdivision` = true) |

**Responses:** `200` → `DocumentFullDTO`

### PUT `/fleets/{fleetId}/users/{userId}/documents`
update a user's document

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — document's owner

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentUpdateDto`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Document id (generated by the platform at the creation) |
| number | string | no | Document number |
| expirationDate | string | no | Expiration date of the document |
| issuingCountry | string: `AD`, `AE`, `AF`, `AG`, `AI`, `AL`, `AM`, `AO`, `AQ`, `AR`, `AS`, `AT`, `AU`, `AW`, `AX`, `AZ`, `BA`, `BB`, `BD`, `BE`, `BF`, `BG`, `BH`, `BI`, `BJ`, `BL`, `BM`, `BN`, `BO`, `BQ`, `BR`, `BS`, `BT`, `BV`, `BW`, `BY`, `BZ`, `CA`, `CC`, `CD`, `CF`, `CG`, `CH`, `CI`, `CK`, `CL`, `CM`, `CN`, `CO`, `CR`, `CU`, `CV`, `CW`, `CX`, `CY`, `CZ`, `DE`, `DJ`, `DK`, `DM`, `DO`, `DZ`, `EC`, `EE`, `EG`, `EH`, `ER`, `ES`, `ET`, `FI`, `FJ`, `FK`, `FM`, `FO`, `FR`, `GA`, `GB`, `GD`, `GE`, `GF`, `GG`, `GH`, `GI`, `GL`, `GM`, `GN`, `GP`, `GQ`, `GR`, `GS`, `GT`, `GU`, `GW`, `GY`, `HK`, `HM`, `HN`, `HR`, `HT`, `HU`, `ID`, `IE`, `IL`, `IM`, `IN`, `IO`, `IQ`, `IR`, `IS`, `IT`, `JE`, `JM`, `JO`, `JP`, `KE`, `KG`, `KH`, `KI`, `KM`, `KN`, `KP`, `KR`, `KW`, `KY`, `KZ`, `LA`, `LB`, `LC`, `LI`, `LK`, `LR`, `LS`, `LT`, `LU`, `LV`, `LY`, `MA`, `MC`, `MD`, `ME`, `MF`, `MG`, `MH`, `MK`, `ML`, `MM`, `MN`, `MO`, `MP`, `MQ`, `MR`, `MS`, `MT`, `MU`, `MV`, `MW`, `MX`, `MY`, `MZ`, `NA`, `NC`, `NE`, `NF`, `NG`, `NI`, `NL`, `NO`, `NP`, `NR`, `NU`, `NZ`, `OM`, `PA`, `PE`, `PF`, `PG`, `PH`, `PK`, `PL`, `PM`, `PN`, `PR`, `PS`, `PT`, `PW`, `PY`, `QA`, `RE`, `RO`, `RS`, `RU`, `RW`, `SA`, `SB`, `SC`, `SD`, `SE`, `SG`, `SH`, `SI`, `SJ`, `SK`, `SL`, `SM`, `SN`, `SO`, `SR`, `SS`, `ST`, `SV`, `SX`, `SY`, `SZ`, `TC`, `TD`, `TF`, `TG`, `TH`, `TJ`, `TK`, `TL`, `TM`, `TN`, `TO`, `TR`, `TT`, `TV`, `TW`, `TZ`, `UA`, `UG`, `UM`, `US`, `UY`, `UZ`, `VA`, `VC`, `VE`, `VG`, `VI`, `VN`, `VU`, `WF`, `WS`, `YE`, `YT`, `ZA`, `ZM`, `ZW` | yes | if this document is issued by a country |
| issuingDate | string | no | issuing date of the document |
| issuingOffice | string | no | issuing office or municipality of the document |
| dlClass | string | no | class of driving license |
| issuingSubdivision | string | no | Subdivision code where the document was issued. - This field is required only if the document type requires it (`hasIssuingSubdivision` = true) |

**Responses:** `200` → `DocumentFullDTO`

### DELETE `/fleets/{fleetId}/users/{userId}/documents/{documentId}`
delete a user's documents

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents/{documentId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — document's owner
- `documentId`: string (required) — document id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### POST `/fleets/{fleetId}/users/{userId}/documents/{documentId}/files`
Attach a file to a document

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents/{documentId}/files` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — The userId of your account
- `documentId`: string (required) — id of the document

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `DocumentNotification`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | url to download the attachment (this url must be public) |
| fileName | string | yes | friendly file's name |

**Responses:** `200` → `DocumentFullDTO`

### GET `/fleets/{fleetId}/users/{userId}/documents/{documentId}/pi`
List user's documents as personal information

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents/{documentId}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — document's owner
- `documentId`: string (required) — document id

**Query params:**
- `types`: string: `DOCUMENT_NUMBER_1`[] (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PersonalInformationDocumentDTO`

### PATCH `/fleets/{fleetId}/users/{userId}/documents/{documentId}/pi`
Update user's document personal information

The body must be an array of elements with<br><br>`op:replace`, `path` is `/documentNumber1` and `value` the new value with a point (`.`) and not a comma (`,`).<br><br> E.g. `[{"op":"replace", "path":"/documentNumber1", "value":"62346377"}]`

authFetch path: `user/fleets/{fleetId}/users/{userId}/documents/{documentId}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)
- `documentId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PatchOperationDTO[]`

**Responses:** `200`, `400`, `403`, `404`

### POST `/fleets/{fleetId}/users/{userId}/lostPasswordEmail`
Send reset password link to the user's current email address by userId

authFetch path: `user/fleets/{fleetId}/users/{userId}/lostPasswordEmail` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — The user ID to send the password reset link to

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/users/{userId}/notes`
List of user note histories for a given user

authFetch path: `user/fleets/{fleetId}/users/{userId}/notes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — user's id

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `userNoteHistory`, `400` → `userNoteHistory[]`

### POST `/fleets/{fleetId}/users/{userId}/notes`
add a user note history.

authFetch path: `user/fleets/{fleetId}/users/{userId}/notes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — user's id

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `userNoteHistory`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| note | string | no |  |
| operatorId | string | no |  |

**Responses:** `201` → `userNoteHistory`, `400`, `404`

### POST `/fleets/{fleetId}/users/{userId}/notes/{noteId}`
update a user note history.

authFetch path: `user/fleets/{fleetId}/users/{userId}/notes/{noteId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — user's id
- `noteId`: string (required) — notes's id to updated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `userNoteHistory`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| note | string | no |  |
| operatorId | string | no |  |

**Responses:** `200`, `400`, `404`

### GET `/fleets/{fleetId}/users/{userId}/paymentMethodDetails`
List all payment details (credit card or bank account) of a user

authFetch path: `user/fleets/{fleetId}/users/{userId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PaymentDetail[]`

### GET `/fleets/{fleetId}/users/{userId}/pi`
Get personal information by user ID

authFetch path: `user/fleets/{fleetId}/users/{userId}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Query params:**
- `types`: string: `IDENTITY`, `USERNAME`, `BIRTH`, `NATIONALITY`, `NOTES`, `GENDER`, `PERSONAL_COMPANY`, `FISCAL`, `ADDRESS`, `MEMBERSHIP`[] (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PersonalInformationUserDTO`

### PATCH `/fleets/{fleetId}/users/{userId}/pi`
Update user's personal information

The body must be an array of elements with<br><br>`op:replace`, `path` is `/firstName` or `/lastName` and `value` the new value with a point (`.`) and not a comma (`,`).<br><br> E.g. `[{"op":"replace", "path":"/firstName", "value":"John"}]` or `[{"op":"replace", "path":"/address/postalCode", "value…

authFetch path: `user/fleets/{fleetId}/users/{userId}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PatchOperationDTO[]`

**Responses:** `200`, `400`, `403`, `404`

### GET `/fleets/{fleetId}/users/{userId}/profiles/{id}/pi`
Get personal information by profile id

authFetch path: `user/fleets/{fleetId}/users/{userId}/profiles/{id}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — user id
- `id`: string (required) — profileId

**Query params:**
- `types`: string: `ID_NUMBER`, `PHONE_NUMBER`, `EMAIL`, `BILLING_ADDRESS`[] (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PersonalInformationProfileDTO`

### PUT `/fleets/{fleetId}/users/{userId}/profiles/{profileId}`
Attach a profile to a user (can be used to attach a business profile to an exiting user)

authFetch path: `user/fleets/{fleetId}/users/{userId}/profiles/{profileId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `profileId`: string (required) — profileId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProfileBasicDTO`

### GET `/fleets/{fleetId}/users/{userId}/profiles/{profileId}/paymentMethodDetails`
Get payment details (credit card or bank account) of a user profile

authFetch path: `user/fleets/{fleetId}/users/{userId}/profiles/{profileId}/paymentMethodDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `profileId`: string (required) — profileId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `PaymentDetail`, `400` → `PaymentDetail`, `404` → `PaymentDetail`

### PATCH `/fleets/{fleetId}/users/{userId}/profiles/{profileId}/pi`
Update user's profile personal information

The body must be an array of elements with<br><br>`op:replace`, `path` is `/phoneNumber` or `/email` and `value` the new value with a point (`.`) and not a comma (`,`).<br><br> E.g. `[{"op":"replace", "path":"/phoneNumber", "value":"John"}]` or `[{"op":"replace", "path":"/email", "value":"john@hotm…

authFetch path: `user/fleets/{fleetId}/users/{userId}/profiles/{profileId}/pi` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PatchOperationDTO[]`

**Responses:** `200`, `400`, `403`, `404`

### GET `/fleets/{fleetId}/users/{userId}/roles`
Get User's roles

authFetch path: `user/fleets/{fleetId}/users/{userId}/roles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`

### PUT `/fleets/{fleetId}/users/{userId}/roles/{roleName}`
Assign a role to an user

authFetch path: `user/fleets/{fleetId}/users/{userId}/roles/{roleName}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `roleName`: string (required) — role

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### DELETE `/fleets/{fleetId}/users/{userId}/roles/{roleName}`
Remove a role from an user

authFetch path: `user/fleets/{fleetId}/users/{userId}/roles/{roleName}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId
- `roleName`: string (required) — role

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`

### POST `/fleets/{fleetId}/users/{userId}/sendPinCode`
Send a pincode by sms

authFetch path: `user/fleets/{fleetId}/users/{userId}/sendPinCode` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `userId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `PinCodeDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pinCode | string | no |  |

**Responses:** `200` → `string`

### GET `/fleets/{fleetId}/users/{userId}/services`
get an overview of the service statuses for a userId

This endpoint will retrieve an overview of the service statuses for a userId

authFetch path: `user/fleets/{fleetId}/users/{userId}/services` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserServiceRegistrationDTO`

### GET `/fleets/{fleetId}/users/{userId}/statusNote`
Get the user status note, the reason why the change to SUSPENDED or INACTIVE

authFetch path: `user/fleets/{fleetId}/users/{userId}/statusNote` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `UserStatusNoteDTO`

### POST `/fleets/{fleetId}/users/{userId}/statusNote`
add or update the user status note corresponding to the reason for change of status

authFetch path: `user/fleets/{fleetId}/users/{userId}/statusNote` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `UserStatusNoteUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reasonForChange | string | no |  |

**Responses:** `204`, `400`, `404`

### PUT `/fleets/{fleetId}/users/{userId}/unlock`
Unlock user

authFetch path: `user/fleets/{fleetId}/users/{userId}/unlock` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — userId to unlock

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `201`, `204`, `400`, `403`, `404`

### POST `/scheduledBooking/fleets/{fleetId}/bookingrequests/list`
Get a subset of booking requests by ids

the number of br is limited to 100 per call

authFetch path: `user/scheduledBooking/fleets/{fleetId}/bookingrequests/list` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200` → `BookingRequestDTO[]`

### POST `/vehicle/fleets/{fleetId}/vehicles-exist`
List all the existing vehicle ids

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles-exist` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `IdsDTOString`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ids | string[] | yes |  |

**Responses:** `200` → `IdsDTOString`
