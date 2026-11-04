# AIMA Business, Service Desk and Geoloc API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## billing-controller (5 endpoints)

### GET `/business/fleets/{fleetId}/billing/entity/{entityId}/balance`

authFetch path: `business/business/fleets/{fleetId}/billing/entity/{entityId}/balance` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsBalanceDTO`

### GET `/business/fleets/{fleetId}/billing/entity/{entityId}/product`

authFetch path: `business/business/fleets/{fleetId}/billing/entity/{entityId}/product` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Query params:**
- `user`: string (optional)
- `period`: string (required)
- `productDetailsType`: string: `UNIT`, `ACCUMULATIVE`, `DEFAULT` (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageBilledBusinessWSProductDTO`

### GET `/business/fleets/{fleetId}/billing/entity/{entityId}/trip`

authFetch path: `business/business/fleets/{fleetId}/billing/entity/{entityId}/trip` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Query params:**
- `costCenterIds`: string[] (optional)
- `user`: string (optional)
- `period`: string (required)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageBilledBusinessWSTripDTO`

### GET `/business/fleets/{fleetId}/billing/entity/{entityId}/trips/cost`

authFetch path: `business/business/fleets/{fleetId}/billing/entity/{entityId}/trips/cost` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Query params:**
- `startDate`: string (date-time) (required)
- `endDate`: string (date-time) (required)
- `tripId`: string (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageTripAndCostBreakdownDTO`

### GET `/business/fleets/{fleetId}/billing/groups`

authFetch path: `business/business/fleets/{fleetId}/billing/groups` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsBillingBusinessWSGroupDTO[]`

## business-controller (29 endpoints)

### POST `/business/fleets/{fleetId}/business`

authFetch path: `business/business/fleets/{fleetId}/business` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsBusinessCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| billingAddress | BusinessWsAddressDTO | no |  |
| name | string | yes |  |
| legalName | string | no |  |
| phoneNumber | string | no |  |
| faxNumber | string | no |  |
| email | string (email) | no |  |
| vat | string | no |  |
| vatVerified | string | no |  |
| ein | string | no |  |
| siretSiren | string | no |  |
| electronicAddress | string | no |  |
| registrationUrl | string | no |  |
| billingGroup | BusinessWsBillingBusinessWSGroupDTO | no |  |
| address | BusinessWsAddressDTO | no |  |
| comment | string | no |  |
| paymentType | string | no |  |
| locale | string | no |  |
| invoiceFrequency | string | no |  |
| taxNumberCountry | string | no |  |
| communityTaxNumber | string | no |  |
| sdicemCode | string | no |  |
| status | string | no |  |
| nationality | string | no |  |
| pec | string | no |  |
| legalForm | string | no |  |
| fiscalCode | string | no |  |
| purchaseOrderReference | string | no |  |
| mandatoryTripNotes | boolean | no |  |

**Responses:** `200` → `BusinessWsBusinessWSDTO`

### GET `/business/fleets/{fleetId}/business/{businessId}`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsBusinessWSDTO`

### GET `/business/fleets/{fleetId}/business/{businessId}/contacts`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/contacts` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsBusinessContactsDTO`

### GET `/business/fleets/{fleetId}/business/{businessId}/costcenter`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/costcenter` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsCostCenterDTO[]`

### POST `/business/fleets/{fleetId}/business/{businessId}/costcenter`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/costcenter` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsCostCenterAddDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| value | string | yes |  |
| name | string | yes |  |

**Responses:** `200` → `BusinessWsCostCenterDTO`

### GET `/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsCostCenterDTO`

### PUT `/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsCostCenterUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| value | string | yes |  |
| name | string | yes |  |

**Responses:** `200` → `BusinessWsCostCenterDTO`

### DELETE `/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}`

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/costcenter/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

### POST `/business/fleets/{fleetId}/business/{businessId}/paymentDetails/wireTransfer`
Send IBAN for wire transfer

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/paymentDetails/wireTransfer` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsWireTransferBusinessDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| iban | string | yes |  |
| entityId | string | no |  |

**Responses:** `200` → `string`, `400`, `404`

### POST `/business/fleets/{fleetId}/business/{businessId}/product`
Charge the given product to the business

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/product` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `businessId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsProductChargeDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | yes |  |
| amount | number | yes |  |
| userId | string | no |  |
| productNotes | string | no |  |
| serviceId | string | no |  |

**Responses:** `201` → `string`, `400`, `404`

### POST `/business/fleets/{fleetId}/business/{businessId}/profiles/{profileId}/deactivate`
Archive an existing business profile

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/profiles/{profileId}/deactivate` (base path `/boapi/proxy/business`)

**Path params:**
- `businessId`: string (required)
- `fleetId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`, `404`

### DELETE `/business/fleets/{fleetId}/business/{businessId}/user/{userId}/profile/{profileId}`
Archive an existing business profile

authFetch path: `business/business/fleets/{fleetId}/business/{businessId}/user/{userId}/profile/{profileId}` (base path `/boapi/proxy/business`)

**Path params:**
- `businessId`: string (required)
- `userId`: string (required)
- `fleetId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `202`, `404`

### PUT `/business/fleets/{fleetId}/business/{id}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsBusinessUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| billingAddress | BusinessWsAddressDTO | no |  |
| name | string | no |  |
| legalName | string | no |  |
| phoneNumber | string | no |  |
| faxNumber | string | no |  |
| email | string | no |  |
| vat | string | no |  |
| vatVerified | string | no |  |
| ein | string | no |  |
| siretSiren | string | no |  |
| electronicAddress | string | no |  |
| registrationUrl | string | no |  |
| billingGroup | BusinessWsBillingBusinessWSGroupDTO | no |  |
| address | BusinessWsAddressDTO | no |  |
| comment | string | no |  |
| businessOwner | BusinessWsUserBusinessDTO | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| paymentType | string | no |  |
| status | string | no |  |
| locale | string | no |  |
| taxNumberCountry | string | no |  |
| communityTaxNumber | string | no |  |
| sdicemCode | string | no |  |
| invoiceFrequency | string | no |  |
| nationality | string | no |  |
| pec | string | no |  |
| legalForm | string | no |  |
| fiscalCode | string | no |  |
| mandatoryTripNotes | boolean | no |  |
| purchaseOrderReference | string | no |  |

**Responses:** `200` → `BusinessWsBusinessWSDTO`

### POST `/business/fleets/{fleetId}/business/{id}/credit`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/credit` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional)
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsWalletCreationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | yes |  |
| expirationDate | string | yes |  |

**Responses:** `200` → `BusinessWsWalletDTO`

### GET `/business/fleets/{fleetId}/business/{id}/paymentDetails`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/paymentDetails` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPaymentBusinessDTO`

### PUT `/business/fleets/{fleetId}/business/{id}/profile/user/profile/status/{status}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/profile/user/profile/status/{status}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `status`: string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `string[]`

**Responses:** `200` → `BusinessWsUserProfileUpdateReporterDTO`

### POST `/business/fleets/{fleetId}/business/{id}/promoCodes/redeem/{reference}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/promoCodes/redeem/{reference}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `reference`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `string`

### GET `/business/fleets/{fleetId}/business/{id}/user`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `role`: string (optional)
- `status`: string (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageUserListDTO`

### POST `/business/fleets/{fleetId}/business/{id}/user/bulk`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/bulk` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `locale`: string (optional)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | string (binary) | yes |  |

**Responses:** `200` → `BusinessWsUserImportReporterDTO`

### POST `/business/fleets/{fleetId}/business/{id}/user/invite`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/invite` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `email`: string (email) (required)
- `firstName`: string (optional)
- `lastName`: string (optional)
- `costCenterId`: string (optional)
- `locale`: string (optional)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `string`

### GET `/business/fleets/{fleetId}/business/{id}/user/{userId}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsUserBusinessDTO`

### POST `/business/fleets/{fleetId}/business/{id}/user/{userId}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional)

**Request body:** `BusinessWsCreateUserProfileDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| emailConsent | boolean | no |  |
| email | string | no |  |
| costCenterId | string | no |  |
| requestId | string | no |  |

**Responses:** `200` → `BusinessWsUserProfileDTO`

### POST `/business/fleets/{fleetId}/business/{id}/user/{userId}/delegatedAdmin`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}/delegatedAdmin` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

### DELETE `/business/fleets/{fleetId}/business/{id}/user/{userId}/delegatedAdmin`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}/delegatedAdmin` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `boolean`

### POST `/business/fleets/{fleetId}/business/{id}/user/{userId}/owner`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}/owner` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

### DELETE `/business/fleets/{fleetId}/business/{id}/user/{userId}/owner`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}/owner` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

### PUT `/business/fleets/{fleetId}/business/{id}/user/{userId}/profile/{profileId}`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/user/{userId}/profile/{profileId}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `userId`: string (required)
- `profileId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsUpdateUserProfileDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string (email) | no |  |
| emailConsent | boolean | no |  |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` | no |  |
| costCenterId | string | no |  |
| isDelegatedAdmin | boolean | no |  |
| delegatedAdmin | boolean | no |  |

**Responses:** `200`

### GET `/business/fleets/{fleetId}/business/{id}/users/name`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/users/name` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `fullname`: string (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsUserBusinessDTO[]`

### GET `/business/fleets/{fleetId}/business/{id}/wallet`

authFetch path: `business/business/fleets/{fleetId}/business/{id}/wallet` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Query params:**
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageWalletDTO`

## Categories (3 endpoints)

### DELETE `/desk/fleets/{FleetId}/tickets/categories/{categoryId}`
Delete category

authFetch path: `desk/fleets/{FleetId}/tickets/categories/{categoryId}` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `categoryId`: string (required)

**Responses:** `200`, `401`, `503`

### POST `/desk/fleets/{fleetId}/categories`
Add category with default values

authFetch path: `desk/fleets/{fleetId}/categories` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)

**Request body:** `AddcategoriesRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| default | object | yes |  |

**Responses:** `200`, `401`, `503`

### GET `/desk/fleets/{fleetId}/tickets/categories/`
Get all categories

authFetch path: `desk/fleets/{fleetId}/tickets/categories/` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)

**Responses:** `200` → `object`, `401`, `503`

## Configuration (5 endpoints)

### GET `/desk/fleets/{fleetId}/conf`
Get configuration

get configuration by fleetId

authFetch path: `desk/fleets/{fleetId}/conf` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId

**Responses:** `200`, `400`, `500`

### POST `/desk/fleets/{fleetId}/conf`
Create configuration

create new configuration by fleetId

authFetch path: `desk/fleets/{fleetId}/conf` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId

**Request body:** `createConfigRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| autoRemoveAssignees | boolean | no |  |

**Responses:** `200`, `400`, `500`

### PUT `/desk/fleets/{fleetId}/conf`
Update configuration

update configuration by fleetId

authFetch path: `desk/fleets/{fleetId}/conf` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId

**Request body:** `updateConfigRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| autoRemoveAssignees | boolean | no |  |

**Responses:** `200`, `400`, `500`

### PUT `/fleetadmin//fleets/{fleetId}/config`
update configuration

authFetch path: `fleetadmin//fleets/{fleetId}/config` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — the id of the fleet

**Request body:** `FleetAdminFleetConfigurationAdminDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| maxTickets | integer | no |  |
| maxVehicles | integer | no |  |
| maxVehiclesModelInfo | integer | no |  |
| maxGroups | integer | no |  |
| maxUsers | integer | no |  |
| includeVehicleInUse | boolean | no |  |

**Responses:** `200`, `401`, `404`, `500`

### GET `/fleetadmin/fleets/{fleetId}/config`
get congiguration by fleet

authFetch path: `fleetadmin/fleets/{fleetId}/config` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — the id of the fleet

**Responses:** `200` → `FleetAdminFleetConfigurationAdminDTO`, `401`, `404`, `500`

## Groups (19 endpoints)

### GET `/desk/fleets/{FleetId}/groups`
get groups

get groups by fleetId

authFetch path: `desk/fleets/{FleetId}/groups` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Responses:** `200`, `401`, `503`

### POST `/desk/fleets/{FleetId}/groups`
create group

create a group

authFetch path: `desk/fleets/{FleetId}/groups` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Request body:** `AddcategoriesRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| default | object | yes |  |

**Responses:** `201`, `401`, `503`

### GET `/desk/fleets/{FleetId}/groups/backlog`
Get backlog

Get backlog for fleet. Optionally you can specify the userId

authFetch path: `desk/fleets/{FleetId}/groups/backlog` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Responses:** `200` → `object`, `401`, `503`

### GET `/desk/fleets/{FleetId}/groups/users`
get the userIds group by groupId

optionally you can specify the groups id in url as querystring ?1,3,66

authFetch path: `desk/fleets/{FleetId}/groups/users` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Responses:** `200` → `object`, `401`, `503`

### PUT `/desk/fleets/{FleetId}/groups/{groupId}`
update group

authFetch path: `desk/fleets/{FleetId}/groups/{groupId}` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `groupId`: integer (required)

**Request body:** `UpdateGroupRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| maxNbHoursAssigned | integer | no |  |

**Responses:** `200`, `400`, `401`, `500`, `503`

### DELETE `/desk/fleets/{FleetId}/groups/{groupId}`
Delete group

authFetch path: `desk/fleets/{FleetId}/groups/{groupId}` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `groupId`: integer (required)

**Responses:** `200`, `401`, `503`

### GET `/desk/fleets/{fleetId}/groups/stations`
Get all association groups to stations for a fleet

authFetch path: `desk/fleets/{fleetId}/groups/stations` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId

**Responses:** `200` → `object`, `204`, `401`, `500`, `503`

### GET `/desk/fleets/{fleetId}/groups/stations/{stationId}`
Get groupIds by stationId

authFetch path: `desk/fleets/{fleetId}/groups/stations/{stationId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `stationId`: string (required) — stationId

**Responses:** `200` → `object`, `204`, `401`, `500`, `503`

### GET `/desk/fleets/{fleetId}/groups/zones`
Get groups linked to all zones.

Get groups linked to all zones for fleet.

authFetch path: `desk/fleets/{fleetId}/groups/zones` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)

**Responses:** `200` → `GroupsZonesByFleetIdResponse[]`, `401`, `503`

### GET `/desk/fleets/{fleetId}/groups/zones/{zoneId}`
Get groups linked to a zone.

Get groups linked to zone for fleet.

authFetch path: `desk/fleets/{fleetId}/groups/zones/{zoneId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)
- `zoneId`: string (required)

**Responses:** `200` → `GroupsZonesByZoneIdResponse[]`, `401`, `503`

### POST `/desk/fleets/{fleetId}/groups/{groupId}/categories/{categoryId}`
Associate category to group.

Associate ticket category to a specific ticketing group.

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/categories/{categoryId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `categoryId`: string (required) — categoryId

**Responses:** `200`, `400`, `401`, `503`

### DELETE `/desk/fleets/{fleetId}/groups/{groupId}/categories/{categoryId}`
Dissociate category to group.

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/categories/{categoryId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `categoryId`: string (required) — categoryId

**Responses:** `200`, `401`, `503`

### POST `/desk/fleets/{fleetId}/groups/{groupId}/stations/{stationId}`
Associate ticketing group to station

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/stations/{stationId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `stationId`: string (required) — stationId

**Responses:** `200`, `400`, `401`, `503`

### DELETE `/desk/fleets/{fleetId}/groups/{groupId}/stations/{stationId}`
Dissociate ticketing group to station

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/stations/{stationId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `stationId`: string (required) — stationId

**Responses:** `200`, `401`, `503`

### PUT `/desk/fleets/{fleetId}/groups/{groupId}/zones/{zoneId}`
Associate group to zone.

Associate one group to one zone, there are empty reponse or if groupId or zoneId doesn't exist, there are an error message. if the type of zone is not operational, there are an error message.

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/zones/{zoneId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `zoneId`: string (required) — zoneId

**Responses:** `200`, `400`, `401`, `503`

### DELETE `/desk/fleets/{fleetId}/groups/{groupId}/zones/{zoneId}`
Dissociate group to zone.

Dissociate group to a zone.

authFetch path: `desk/fleets/{fleetId}/groups/{groupId}/zones/{zoneId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required) — groupId
- `zoneId`: string (required) — zoneId

**Responses:** `200`, `401`, `503`

### POST `/desk/fleets/{fleetId}/users/group/{groupId}`
Assign users to ticketing group

Assign users to ticketing group. It accepts an array of usersIds.

authFetch path: `desk/fleets/{fleetId}/users/group/{groupId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `groupId`: integer (required)

**Responses:** `200`, `400`, `401`, `503`

### POST `/desk/fleets/{fleetId}/users/groups`
Ticketing group each user belongs to

return a list of users with the ticketing group associated. the number of users is limited to 100 per call

authFetch path: `desk/fleets/{fleetId}/users/groups` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId

**Responses:** `200` → `object`, `400`, `401`, `503`

### GET `/desk/fleets/{fleetId}/users/{userId}/groups`
Get user's ticket groups

Get user's ticket grooups. returns an array of ticket groups

authFetch path: `desk/fleets/{fleetId}/users/{userId}/groups` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleet id
- `userId`: string (required) — user id

**Responses:** `200` → `UserTicketGroup[]`

## invitation-request-controller (2 endpoints)

### GET `/business/fleets/{fleetId}/invitationRequest/{id}`

authFetch path: `business/business/fleets/{fleetId}/invitationRequest/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

### DELETE `/business/fleets/{fleetId}/invitationRequest/{id}`

authFetch path: `business/business/fleets/{fleetId}/invitationRequest/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

## invoice-controller (10 endpoints)

### GET `/business/fleets/{fleetId}/entities/{entityId}/businessInvoices`

authFetch path: `business/business/fleets/{fleetId}/entities/{entityId}/businessInvoices` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Query params:**
- `fromDate`: string (date-time) (optional)
- `toDate`: string (date-time) (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageInvoiceCumulativeBusinessDTO`

### GET `/business/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceId}/products`

authFetch path: `business/business/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceId}/products` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)
- `invoiceId`: string (required)

**Query params:**
- `page`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageAccountingBusinessWSProductDTO`

### GET `/business/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceId}/trips`

authFetch path: `business/business/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceId}/trips` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)
- `invoiceId`: string (required)

**Query params:**
- `page`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageAccountingBusinessWSTripDTO`

### GET `/business/fleets/{fleetId}/invoices/{invoiceId}/creditNote`
return the credit note for a invoiceId

This endpoint returns the PDF version of the credit note of an invoice

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/creditNote` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: any (required) — The fleet Id of your account
- `invoiceId`: any (required) — The invoice id

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `string (byte)`, `404` → `string (byte)`

### PUT `/business/fleets/{fleetId}/invoices/{invoiceId}/externalPayment`
Update invoice for external payment

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/externalPayment` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsExternalPaymentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requesterId | string | yes |  |
| notes | string | no |  |
| paymentMethod | string | no |  |

**Responses:** `200` → `string`, `400`, `404`

### GET `/business/fleets/{fleetId}/invoices/{invoiceId}/pdf`

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/pdf` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `string (byte)`

### POST `/business/fleets/{fleetId}/invoices/{invoiceId}/refund`

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/refund` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsRefundAmountBaseDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | no | Amount to refund |
| note | string | no | Note related to the refund |
| refundItems | BusinessWsRefundItemDTO[] | no | lines selected for refund (ref + TTC amount), forwarded to the backend. When present, drives the refund-by-item flow; when absent, the legacy amount-only path… |

**Responses:** `200`

### GET `/business/fleets/{fleetId}/invoices/{invoiceId}/refundNote`
return the refund note for a invoiceId

This endpoint returns the PDF version of the refund of an invoice

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/refundNote` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: any (required) — The fleet Id of your account
- `invoiceId`: any (required) — The invoice id

**Query params:**
- `paymentRefundPspReference`: any (optional) — The psp reference of the refund

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `string (byte)`, `404` → `string (byte)`

### GET `/business/fleets/{fleetId}/invoices/{invoiceId}/refundableAmount`

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/refundableAmount` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsInvoiceRefundDTO`

### POST `/business/fleets/{fleetId}/invoices/{invoiceId}/status/{status}`

authFetch path: `business/business/fleets/{fleetId}/invoices/{invoiceId}/status/{status}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)
- `status`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200`

## Label (8 endpoints)

### GET `/fleets/{fleetId}/zones/{zoneId}/labels`
Retrieve the list of dedicated label for a zone

Return the list of dedicated label for a zone

authFetch path: `fleets/{fleetId}/zones/{zoneId}/labels` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `zoneId`: string (required) — the unique identifier of the zone

**Responses:** `200` → `ListLabels`, `400` → `string`, `500`

### PUT `/fleets/{fleetId}/zones/{zoneId}/labels/{labelId}`
Assign a dedicated label to a zone

authFetch path: `fleets/{fleetId}/zones/{zoneId}/labels/{labelId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `zoneId`: string (required) — the unique identifier of the zone
- `labelId`: string (uuid) (required) — the unique identifier of the label

**Responses:** `200` → `AddLabel`, `400` → `string`, `500`

### DELETE `/fleets/{fleetId}/zones/{zoneId}/labels/{labelId}`
Remove a dedicated label to a zone

authFetch path: `fleets/{fleetId}/zones/{zoneId}/labels/{labelId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `zoneId`: string (required) — the unique identifier of the zone
- `labelId`: string (uuid) (required) — the unique identifier of the label

**Responses:** `200`, `500`

### GET `/geoloc/fleets/{fleetId}/labels`
Get list of labels

Return the list of label for a fleet

authFetch path: `geoloc/fleets/{fleetId}/labels` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Responses:** `200` → `ListLabels`, `400` → `string`, `500`

### POST `/geoloc/fleets/{fleetId}/labels`
Create a dedicated label

Create the information for a dedicated label for a fleet

authFetch path: `geoloc/fleets/{fleetId}/labels` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Request body:** `CreateLabelDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string (string) | no | The dedicated name of the label |
| publicName | string (string) | no | The dedicated name of the label which will be available in the geojson of the zone |

**Responses:** `200` → `LabelDTOGeoloc`, `400` → `string`, `500`

### GET `/geoloc/fleets/{fleetId}/labels/{labelId}`
Get a dedicated label

Return the information for a dedicated label for a fleet

authFetch path: `geoloc/fleets/{fleetId}/labels/{labelId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `labelId`: string (uuid) (required) — the unique identifier of the label

**Responses:** `200` → `LabelDTOGeoloc`, `400` → `string`, `500`

### POST `/geoloc/fleets/{fleetId}/labels/{labelId}`
Update the dedicated label

Update the information for a dedicated label for a fleet

authFetch path: `geoloc/fleets/{fleetId}/labels/{labelId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `labelId`: string (uuid) (required) — the unique identifier of the label

**Request body:** `UpdateLabelDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string (string) | no | The dedicated name of the label |
| publicName | string (string) | no | The dedicated name of the label which will be available in the geojson of the zone |

**Responses:** `200` → `LabelDTOGeoloc`, `400` → `string`, `500`

### DELETE `/geoloc/fleets/{fleetId}/labels/{labelId}`
delete a label by labelId

Delete the dedicated label information.

authFetch path: `geoloc/fleets/{fleetId}/labels/{labelId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `labelId`: string (uuid) (required) — The unique ID of the label

**Responses:** `200`, `500`

## Operationnal Areas (1 endpoint)

### GET `/desk/fleets/{fleetId}/vehicles/{vehicleId}/groups`
Get groupId by localization of vehicle

Get groupId corresponding to a localization of vehicle. If OA zone doesn't exist, return 200 with empty response. If OA zone exist and doesn't match with the position of vehicle, return 200 with empty response.

authFetch path: `desk/fleets/{fleetId}/vehicles/{vehicleId}/groups` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleetId
- `vehicleId`: string (required) — vehicleId

**Query params:**
- `categoryId`: integer (required)
- `lat`: number (required)
- `lon`: number (required)

**Responses:** `200` → `GetGroupIdByGeolocVehicleResponse`, `400`

## POI (6 endpoints)

### GET `/geoloc/fleets/{fleetId}/pois`
Lists all the POI of the fleet.

Return the fleet POI in json or geojson format

authFetch path: `geoloc/fleets/{fleetId}/pois` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Responses:** `200` → `GetAllPois`, `500`

### POST `/geoloc/fleets/{fleetId}/pois`
Import a POI as geojson

Import a geojson with a point to create a new POI.<br> Before creating a new POI, be sur that no POI exists with the same name. Use the “list” endpoint to get all POIs and check names.<br> Even if the AddPoiGeo object (used as body parameter) contains a list of features, only one (1) item must be p…

authFetch path: `geoloc/fleets/{fleetId}/pois` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Request body:** `AddPoiGeo`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddPoiGeoFeature[] | no | should have only 1 element |

**Responses:** `202`, `400` → `string`, `500` → `string`

### GET `/geoloc/fleets/{fleetId}/pois/{poiId}`
Get all versions of the given POI

Returns all versions of the POI with given ID and for the given fleet.

authFetch path: `geoloc/fleets/{fleetId}/pois/{poiId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `poiId`: string (required) — The unique ID of the wanted POI

**Responses:** `200` → `GetPoisGeo`, `500`

### POST `/geoloc/fleets/{fleetId}/pois/{poiId}`
Update a POI

Update the POI with provided geojson data.<br> It is highly recommended to use the JSON returned by the get POI endpoint (see "Get all versions of the given POI) and to update it instead of creating an handmade JSON string. Be careful to take the POI with the highest version!<br> Even if PoiDetail…

authFetch path: `geoloc/fleets/{fleetId}/pois/{poiId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `poiId`: string (required) — The unique ID of the POI to update

**Request body:** `AddPoiGeo`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddPoiGeoFeature[] | no | should have only 1 element |

**Responses:** `200`, `400` → `string`, `500` → `string`

### DELETE `/geoloc/fleets/{fleetId}/pois/{poiId}`
delete pois by poiId

Delete all the versions to the given POI.

authFetch path: `geoloc/fleets/{fleetId}/pois/{poiId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `poiId`: string (required) — The unique ID of the POI to update

**Responses:** `200`, `500`

### GET `/geoloc/fleets/{fleetId}/pois/{poiname}/versions/{version}`
Get POI by name

Return the current POI by name, fleetId and version

authFetch path: `geoloc/fleets/{fleetId}/pois/{poiname}/versions/{version}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `poiname`: string (required) — the name of Poi
- `version`: integer (required) — the version of Poi

**Responses:** `200` → `ListLabels`, `400` → `string`, `500`

## product-controller (1 endpoint)

### GET `/business/fleets/{fleetId}/product`

authFetch path: `business/business/fleets/{fleetId}/product` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsProductBusinessDTO[]`

## stripe-controller (2 endpoints)

### GET `/business/fleets/{fleetId}/stripe/businesses/{businessId}/add`

authFetch path: `business/business/fleets/{fleetId}/stripe/businesses/{businessId}/add` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `businessId`: any (required) — The business id you are adding the mop to

**Header params:**
- `x-user-id`: string (optional)

**Responses:** `200` → `BusinessWsAddBusinessWSCreditCardResponseDTO`

### GET `/business/fleets/{fleetId}/stripe/config/key`
Retrieve the stripe publishable key for the fleet

authFetch path: `business/business/fleets/{fleetId}/stripe/config/key` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: any (required) — The fleetId of your account

**Header params:**
- `x-user-id`: string (optional)

**Responses:** `200` → `string`

## Tickets (26 endpoints)

### POST `/assignees`
batch assign tickets to user

authFetch path: `assignees` (base path `/boapi/proxy`)

**Request body:** `object`

**Responses:** `200` → `object`

### POST `/desk/fleets/{FleetId}/bulkTickets`
Bulk creation of tickets

Add a status

authFetch path: `desk/fleets/{FleetId}/bulkTickets` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Request body:** `CreateBulkTicketsRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string | yes |  |
| vehicleId | string[] | yes |  |
| priority | string | yes |  |
| subject | string | yes |  |
| categoryId | string | yes |  |
| groupId | integer | yes |  |
| description | string | yes |  |

**Responses:** `200`, `401`, `503`

### GET `/desk/fleets/{FleetId}/tickets/`
Get all tickets

Get tickets for a fleet with optional server-side filtering and pagination. Response is a JSON array of ticket objects suitable for list views (id, subject, status, priority, categoryId, groupId, assignedTo, vehicleId/vehicleIds, creationDate, etc.). Pagination metadata is returned in response head…

authFetch path: `desk/fleets/{FleetId}/tickets/` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required) — Fleet identifier

**Query params:**
- `page`: integer (optional) — 0-based page index for pagination
- `size`: integer (optional) — Page size (default 50, max 2000)
- `sort`: string (optional) — Sort specification, e.g. creationDate,desc or updateDate,asc. Allowed fields include creationDate, updateDate, priority, status, subject.
- `status`: string[] (optional) — Filter by status; repeat for multiple values
- `vehicleIdNotNull`: boolean (optional) — If true, only return tickets that have at least one linked vehicle
- `assignedTo`: string (optional) — Filter by assignee user id, or use literal null for unassigned tickets (backlog)
- `groupId`: integer[] (optional) — Filter by ticketing group id; repeat for multiple groups. Combine with assignedTo=null for backlog in user's groups.
- `groupIdNotNull`: boolean (optional) — If true, only return tickets that have a groupId assigned
- `categoryId`: string[] (optional) — Filter by category id; repeat for multiple values
- `priority`: string[] (optional) — Filter by priority (e.g. HIGH, MEDIUM, LOW); repeat for multiple values
- `vehicleId`: string[] (optional) — Filter by linked vehicle id; repeat for multiple values
- `unassignedOnly`: boolean (optional) — If true, restrict to unassigned tickets only (backlog). Can be combined with groupId.

**Responses:** `200` → `object[]`, `400`, `401`, `503`

### POST `/desk/fleets/{FleetId}/tickets/`
Add a ticket

authFetch path: `desk/fleets/{FleetId}/tickets/` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Request body:** `AddanewticketRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes |  |
| subject | string | yes |  |
| description | string | yes |  |
| statusId | integer (int32) | yes |  |
| priority | string | yes |  |
| creationDate | string | yes |  |
| updateDate | string | yes |  |
| workedHours | integer (int32) | yes |  |
| customerFault | boolean | yes |  |
| categoryId | string | yes |  |

**Responses:** `200`, `401`, `503`

### GET `/desk/fleets/{FleetId}/tickets/status/`
Get all status

authFetch path: `desk/fleets/{FleetId}/tickets/status/` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Responses:** `200` → `object`, `401`, `503`

### POST `/desk/fleets/{FleetId}/tickets/status/`
Add a status

authFetch path: `desk/fleets/{FleetId}/tickets/status/` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Request body:** `addstatusRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |

**Responses:** `200`, `401`, `503`

### PUT `/desk/fleets/{FleetId}/tickets/{ticketId}`
Update ticket

Update a ticket using ticketId

authFetch path: `desk/fleets/{FleetId}/tickets/{ticketId}` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `ticketId`: string (required)

**Request body:** `updateticketRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| assignedTo | string | no |  |
| categoryId | string | no |  |
| closeDate | string | no |  |
| creationDate | string | no |  |
| creatorId | string | no |  |
| customerFault | integer | no |  |
| description | string | no |  |
| eventType | string | no |  |
| fleetId | string | no |  |
| groupId | integer | no |  |
| id | string | no |  |
| modelId | string | no |  |
| priority | string | no |  |
| status | string | no |  |
| subject | string | no |  |
| tripId | string | no |  |
| vehicleId | string | no |  |
| updateDate | string | no |  |
| userId | string | no |  |
| workedHours | integer | no |  |

**Responses:** `200`, `401`, `500`, `503`

### GET `/desk/fleets/{FleetId}/tickets/{ticketId}/comments`
Get Comments for a ticket

authFetch path: `desk/fleets/{FleetId}/tickets/{ticketId}/comments` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `ticketId`: string (required)

**Responses:** `200`, `401`, `503`

### PUT `/desk/fleets/{FleetId}/tickets/{ticketId}/comments`
Add a comment to ticket

authFetch path: `desk/fleets/{FleetId}/tickets/{ticketId}/comments` (base path `/boapi/proxy`)

**Path params:**
- `FleetId`: string (required)
- `ticketId`: string (required)

**Header params:**
- `Content-Type`: string (required)

**Request body:** `AddacommenttoticketRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fromUser | string | yes |  |
| message | string | yes |  |

**Responses:** `200`, `401`, `503`

### POST `/desk/fleets/{fleetId}/tickets/assignees`
Batch assign tickets to agents

Assign multiple tickets to one agent in one request. It accepts a map of userId to array, the array contains ticketIds to be updated; it returns a map of userId to array, the array contains ticketIds which failed to be updated

authFetch path: `desk/fleets/{fleetId}/tickets/assignees` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleet id

**Request body:** `TicketBatchAssignRequest`

**Responses:** `200` → `TicketBatchAssignResponse`

### POST `/desk/fleets/{fleetId}/tickets/batch`
batch update a property for specified tickets

batch update a property to certain value for all specified tickets

authFetch path: `desk/fleets/{fleetId}/tickets/batch` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleet id

**Request body:** `batchUpdatePropertyRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes |  |
| ticketIds | string[] | yes |  |
| property | string | yes |  |
| value | string | yes |  |

**Responses:** `200` → `batchUpdatePropertyResponse`

### POST `/desk/fleets/{fleetId}/tickets/cleanSmartRedistribution`
clean smart redistribution tickets

For a list of vehicles that have needs-redistribution tickets, delete tickets not assigned and closed tickets already assigned to an agent, only triggered for tickets with NEW status

authFetch path: `desk/fleets/{fleetId}/tickets/cleanSmartRedistribution` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleet id

**Request body:** `cleanRedistributionTickets`

**Responses:** `200`, `400`

### GET `/desk/fleets/{fleetId}/tickets/eligible`
Get eligible tickets by user role

Returns active tickets (`NEW`, `ONGOING`, `PENDING`) eligible for the given user, unless `ticketStatus` narrows status. Exactly one role selector must be provided: - `fleetAgentId` (preferred) or legacy `agentId`: agent view — tickets assigned to this user OR unassigned tickets whose category is li…

authFetch path: `desk/fleets/{fleetId}/tickets/eligible` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `fleetAgentId`: string (optional) — User id for agent eligibility mode. Exactly one of fleetAgentId (or legacy agentId) or ticketVisibleTo (or legacy fleetManager) is required.
- `ticketVisibleTo`: string (optional) — User id for external fleet manager eligibility mode. Exactly one of fleetAgentId or ticketVisibleTo (or their legacy aliases) is required.
- `agentId`: string (optional) — Deprecated; use fleetAgentId.
- `fleetManager`: string (optional) — Deprecated; use ticketVisibleTo.
- `ticketStatus`: string: `NEW`, `ONGOING`, `PENDING` (optional) — Return only tickets with this status (must be an active status). Omit to include all active statuses.
- `ticketPriority`: string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` (optional) — Return only tickets with this priority.
- `ticketCategory`: integer (optional) — Return only tickets with this category id.
- `ticketGroup`: integer (optional) — Return only tickets with this group id.
- `ticketAssignedTo`: string (optional) — Assignee user id, or `none` (unassigned) or `anyone` (any assignee). Comparison to none/anyone is case-insensitive.
- `page`: integer (optional)
- `size`: integer (optional)
- `sort`: string (optional)

**Responses:** `200` → `object[]`, `400`, `401`, `503`

### GET `/desk/fleets/{fleetId}/tickets/eligible/vehicles-by-priority`
Vehicle ids grouped by highest priority across eligible tickets

Same filtering criteria as `GET /desk/fleets/{fleetId}/tickets/eligible`, but instead of returning tickets it returns the set of vehicles touched by those tickets, bucketed by ticket priority. Each vehicle appears in exactly one bucket: when a vehicle is associated to several eligible tickets, the…

authFetch path: `desk/fleets/{fleetId}/tickets/eligible/vehicles-by-priority` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `fleetAgentId`: string (optional) — User id for agent eligibility mode. Exactly one of fleetAgentId (or legacy agentId) or ticketVisibleTo (or legacy fleetManager) is required.
- `ticketVisibleTo`: string (optional) — User id for external fleet manager eligibility mode. Exactly one of fleetAgentId or ticketVisibleTo (or their legacy aliases) is required.
- `agentId`: string (optional) — Deprecated; use fleetAgentId.
- `fleetManager`: string (optional) — Deprecated; use ticketVisibleTo.
- `ticketStatus`: string: `NEW`, `ONGOING`, `PENDING` (optional) — Return only tickets with this status (must be an active status). Omit to include all active statuses.
- `ticketPriority`: string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` (optional) — Return only tickets with this priority.
- `ticketCategory`: integer (optional) — Return only tickets with this category id.
- `ticketGroup`: integer (optional) — Return only tickets with this group id.
- `ticketAssignedTo`: string (optional) — Assignee user id, or `none` (unassigned) or `anyone` (any assignee). Comparison to none/anyone is case-insensitive.

**Responses:** `200` → `object`, `400`, `401`, `503`

### POST `/desk/fleets/{fleetId}/tickets/group/{groupId}`
Assign tickets to ticketing group

Assign tickets to ticketing group to one agent in one request. It accepts an operatorId with an array of ticketIds. It returns empty or an array which contains tickets failure.

authFetch path: `desk/fleets/{fleetId}/tickets/group/{groupId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)
- `groupId`: integer (required)

**Request body:** `TicketToGroupBatchAssignRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | yes |  |
| ticketIds | string[] | yes |  |

**Responses:** `200` → `TicketToGroupBatchAssignResponse`

### POST `/desk/fleets/{fleetId}/tickets/{ticketId}/attachments`
save ticket attachment metadata

authFetch path: `desk/fleets/{fleetId}/tickets/{ticketId}/attachments` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)
- `ticketId`: string (required)

**Request body:** `TicketAttachMetaData`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| filename | string | yes |  |
| operatorId | string | yes |  |

**Responses:** `200` → `TicketAttachMetaDataResp`, `400`, `500`

### PUT `/desk/fleets/{fleetId}/v2/tickets/{ticketId}`
This is a temporary endpoint for update a single property of ticket

Update a single property of ticket, only one property is allowd in the body, and values are always strings

authFetch path: `desk/fleets/{fleetId}/v2/tickets/{ticketId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — fleet Id
- `ticketId`: string (required) — ticket id

**Request body:** `TicketSinglePropertyUpdateRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | yes |  |
| property | string | yes |  |
| value | string | yes |  |

**Responses:** `200`

### DELETE `/desk/tickets/assignees`
Batch delete assignee to agents

delete assignee into tickets, it use by the scheduler to unassign tickets after x hours we have configuration for x hours by groups, if not iwe have the default value to 24 hours. we have a limit for the request until 2 days. we assignTo to null only when the status of tickets is NEW

authFetch path: `desk/tickets/assignees` (base path `/boapi/proxy`)

**Responses:** `200`, `400`, `500`

### POST `/desk/tickets/closeResolvedTickets`
Close Resovled tickets

2 differents policies in order to close tickets.<br> Automatically created that are in status resolved they can pass to Closed after 2 month of inactivity.<br> Manually created update tickets RESOLVED to CLOSED when is created manually and inactive since 3 months.

authFetch path: `desk/tickets/closeResolvedTickets` (base path `/boapi/proxy`)

**Query params:**
- `isManuallyCreated`: boolean (optional)
- `limit`: integer (optional) — max number of tickets to be closed

**Responses:** `200` → `object`, `400`, `401`, `503`

### POST `/fleetadmin/fleets/{fleetId}/tickets/{ticketId}/attachments`
post attach info to service desk to retrieve upload urls etc

authFetch path: `fleetadmin/fleets/{fleetId}/tickets/{ticketId}/attachments` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required)
- `ticketId`: string (required)

**Header params:**
- `x-user-id`: string (required)

**Request body:** `FleetAdminTicketAttachmentRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| filename | string | no |  |

**Responses:** `200` → `FleetAdminServiceDeskTicketAttachmentDTO`, `401`

### POST `/group/{groupId}`
batch assign tickets to group

authFetch path: `group/{groupId}` (base path `/boapi/proxy`)

**Path params:**
- `groupId`: string (required)

**Request body:** `object`

**Responses:** `200` → `object`, `400`

### GET `/tickets`
searches tickets

By passing in the appropriate options, you can search for available tickets in the system. It returns a list of ticket summaries, there are no detailed information, only necessary info for a list view.

authFetch path: `tickets` (base path `/boapi/proxy`)

**Query params:**
- `id`: string (optional) — Ticket ID, supports multiple query values
- `fleetId`: string (optional) — Fleet ID of the tickets, supports multiple values
- `subject`: string (optional) — ticket subject, supports multiple values
- `status`: string (optional) — ticket status, supporst multiple query values
- `priority`: string (optional) — ticket priority, supports multiple query values
- `categoryId`: string (optional) — ticket category ID, supports multiple query values
- `groupId`: integer (optional) — ticket group ID, supports multiple query values
- `vehicleId`: string (optional) — ticket vehicle ID, supports multiple query values
- `latitude`: number (optional) — latitude of the user location
- `longitude`: number (optional) — longitude of the user location
- `backlogUserId`: string (optional) — if present, returns tickets which are not assigned and belongs to the specified user's ticket groups
- `assignedTo`: string (optional) — ticket assigneed, if specified, returns tickets whose assignee is the specified user

**Responses:** `200` → `FleetAdminTicketDTO[]`, `400`, `403`

### GET `/tickets/{ticketId}`
get the details of a ticket given its id

authFetch path: `tickets/{ticketId}` (base path `/boapi/proxy`)

**Path params:**
- `ticketId`: string (required)

**Responses:** `200`

### POST `/tickets/{ticketId}`
create ticket

authFetch path: `tickets/{ticketId}` (base path `/boapi/proxy`)

**Path params:**
- `ticketId`: string (required)

**Request body:** `FleetAdminCreateTicketDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| creatorId | string (uuid) | no |  |
| assignedTo | string (uuid) | no |  |
| categoryId | string | no |  |
| groupId | integer | no |  |
| priority | string | no |  |
| vehicleId | string | no |  |
| subject | string | no |  |
| description | string | no |  |
| userIds | string[] | no |  |
| vehicleIds | string[] | no |  |

**Responses:** `200` → `FleetAdminTicket`

### PUT `/tickets/{ticketId}`
update ticket

authFetch path: `tickets/{ticketId}` (base path `/boapi/proxy`)

**Path params:**
- `ticketId`: string (required)

**Header params:**
- `updateByAssignedOnly`: boolean (optional)

**Responses:** `200` → `FleetAdminServiceDeskTicketDTO`, `400` → `FleetAdminTicketError`, `404` → `FleetAdminTicketError`

### PUT `/{ticketId}/single`
update ticket with one property

update a ticket but each request will only have one property and value

authFetch path: `{ticketId}/single` (base path `/boapi/proxy`)

**Path params:**
- `ticketId`: string (required)

**Header params:**
- `updateByAssignedOnly`: boolean (optional)

**Request body:** `FleetAdminUpdateTicketDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string (uuid) | no |  |
| property | string | no |  |
| value | string | no |  |

**Responses:** `200` → `string`, `400` → `FleetAdminTicketError`, `404` → `FleetAdminTicketError`

## trip-controller (4 endpoints)

### GET `/business/fleets/{fleetId}/ongoingTrip/{tripId}/notes`

authFetch path: `business/business/fleets/{fleetId}/ongoingTrip/{tripId}/notes` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsTripNoteDTO`

### GET `/business/fleets/{fleetId}/trip/ongoing`

authFetch path: `business/business/fleets/{fleetId}/trip/ongoing` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `business`: string (required)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageOngoingTripDTO`

### GET `/business/fleets/{fleetId}/trip/{tripId}`

authFetch path: `business/business/fleets/{fleetId}/trip/{tripId}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsTripDetailDTO`

### POST `/business/fleets/{fleetId}/trip/{tripId}/notes`

authFetch path: `business/business/fleets/{fleetId}/trip/{tripId}/notes` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `BusinessWsTripNoteDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | string | no |  |

**Responses:** `200` → `BusinessWsTripDetailDTO`

## user-controller (3 endpoints)

### POST `/business/fleets/{fleetId}/users/list`

authFetch path: `business/business/fleets/{fleetId}/users/list` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Request body:** `string[]`

**Responses:** `200` → `BusinessWsUserBusinessDTO[]`

### GET `/business/fleets/{fleetId}/users/search`

authFetch path: `business/business/fleets/{fleetId}/users/search` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `name`: string (optional)
- `pageable`: BusinessWsPageable (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsPageUserBusinessDTO`

### GET `/business/fleets/{fleetId}/users/{id}`

authFetch path: `business/business/fleets/{fleetId}/users/{id}` (base path `/boapi/proxy/business`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-user-id`: string (optional) — the id of the authenticated user

**Responses:** `200` → `BusinessWsUserInfoDTO`

## Zone (4 endpoints)

### GET `/geoloc/fleets/{fleetId}/zones`
Lists all zones of the fleet.

Returns the fleet zones in json or geojson format

authFetch path: `geoloc/fleets/{fleetId}/zones` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Responses:** `200` → `GetAllZones`, `500`

### POST `/geoloc/fleets/{fleetId}/zones`
Import a zone as geojson

Import a geojson with a polygon to create a new zone

authFetch path: `geoloc/fleets/{fleetId}/zones` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.

**Request body:** `AddZoneGeo`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddZoneGeoFeature[] | no | should have only 1 element |

**Responses:** `202`, `400` → `ErrorMsg`, `500` → `string`

### GET `/geoloc/fleets/{fleetId}/zones/{zoneId}`
Returns a zone as geojson

Returns all versions of the zone with the given ID as geojson format

authFetch path: `geoloc/fleets/{fleetId}/zones/{zoneId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `zoneId`: string (required) — Unique ID of the zone to get

**Responses:** `200` → `GetZoneGeo`, `500`

### POST `/geoloc/fleets/{fleetId}/zones/{zoneId}`
Update a zone

Update zone with provided geojson data

authFetch path: `geoloc/fleets/{fleetId}/zones/{zoneId}` (base path `/boapi/proxy`)

**Path params:**
- `fleetId`: string (required) — The fleet ID provided by vulog and that represents your fleet.
- `zoneId`: string (required) — Unique ID of the zone to update

**Request body:** `AddZoneGeo`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddZoneGeoFeature[] | no | should have only 1 element |

**Responses:** `200`, `400` → `string`, `500` → `string`
