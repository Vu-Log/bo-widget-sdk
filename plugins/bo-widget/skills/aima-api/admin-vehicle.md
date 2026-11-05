# AIMA Admin Vehicle API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-vehicle (60 endpoints)

### GET `/by-service/fleets/{fleetId}/vehicles/rfids`
List all RFID cards for a fleet

authFetch path: `user/by-service/fleets/{fleetId}/vehicles/rfids` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO[]`, `500` → `RFIDCardDTO[]`

### GET `/by-service/fleets/{fleetId}/vehicles/{vehicleId}/rfids`
List RFID cards linked to a vehicle

authFetch path: `user/by-service/fleets/{fleetId}/vehicles/{vehicleId}/rfids` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId
- `vehicleId`: any (required) — The vehicleId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO[]`, `400` → `RFIDCardDTO[]`, `500` → `RFIDCardDTO[]`

### GET `/fleets/{fleetId}/tokens/vehicles/createdAt/{date}`
list all the vehicle's tokens created at a given date

authFetch path: `user/fleets/{fleetId}/tokens/vehicles/createdAt/{date}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `date`: string (required) — The created at date

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleToken[]`

### GET `/fleets/{fleetId}/tokens/vehicles/validAt/{date}`
list all the vehicle's tokens valid at a given date

authFetch path: `user/fleets/{fleetId}/tokens/vehicles/validAt/{date}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `date`: string (required) — The valid at date

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleToken[]`

### GET `/fleets/{fleetId}/tokens/vehicles/{vehicleId}`
list all the vehicle's tokens

authFetch path: `user/fleets/{fleetId}/tokens/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleToken[]`

### POST `/fleets/{fleetId}/tokens/vehicles/{vehicleId}`
save the vehicle's tokens

authFetch path: `user/fleets/{fleetId}/tokens/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `200` → `VehicleToken`

### GET `/fleets/{fleetId}/vehicles/rfids`
List all RFID cards for a fleet

authFetch path: `user/fleets/{fleetId}/vehicles/rfids` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO[]`, `500` → `RFIDCardDTO[]`

### POST `/fleets/{fleetId}/vehicles/rfids`
POST Create an RFIDCard for a fleet

authFetch path: `user/fleets/{fleetId}/vehicles/rfids` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `RFIDCardDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| tag | string | yes | tag |
| vehicleId | string | no | vehicleId |
| description | string | no | description |
| pinCode | string | no | pinCode |
| updateDate | string (date-time) | no | updateDate |

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO`, `500` → `RFIDCardDTO`

### GET `/fleets/{fleetId}/vehicles/rfids/{tag}`
GET an RFID card for a fleet and a tag value

authFetch path: `user/fleets/{fleetId}/vehicles/rfids/{tag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `tag`: string (required) — tag

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO`, `500` → `RFIDCardDTO`

### POST `/fleets/{fleetId}/vehicles/rfids/{tag}`
UPDATE RFIDCard for a fleet and tag

authFetch path: `user/fleets/{fleetId}/vehicles/rfids/{tag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `tag`: string (required) — tag

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `RFIDCardDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| tag | string | yes | tag |
| vehicleId | string | no | vehicleId |
| description | string | no | description |
| pinCode | string | no | pinCode |
| updateDate | string (date-time) | no | updateDate |

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO`, `500` → `RFIDCardDTO`

### GET `/fleets/{fleetId}/vehicles/{vehicleId}/pinCode`
Get the pinCode of the vehicle in active trip

authFetch path: `user/fleets/{fleetId}/vehicles/{vehicleId}/pinCode` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `vehicleId`: string (required) — id of the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`, `400` → `string`, `500` → `string`

### GET `/fleets/{fleetId}/vehicles/{vehicleId}/rfids`
List RFID cards linked to a vehicle

authFetch path: `user/fleets/{fleetId}/vehicles/{vehicleId}/rfids` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `vehicleId`: string (required) — The vehicleId

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO[]`, `500` → `RFIDCardDTO[]`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/rfids/{tag}`
Link RFIDCard to a vehicle

authFetch path: `user/fleets/{fleetId}/vehicles/{vehicleId}/rfids/{tag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `vehicleId`: string (required) — id of the vehicle
- `tag`: string (required) — tag

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO`, `500` → `RFIDCardDTO`

### DELETE `/fleets/{fleetId}/vehicles/{vehicleId}/rfids/{tag}`
Break the link between a RFIDCard a vehicle

authFetch path: `user/fleets/{fleetId}/vehicles/{vehicleId}/rfids/{tag}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId
- `vehicleId`: string (required) — id of the vehicle
- `tag`: string (required) — tag

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RFIDCardDTO`, `400` → `RFIDCardDTO`, `500` → `RFIDCardDTO`

### GET `/vehicle/by-service/fleets/{fleetId}/groups`
Get a all VehicleGroup for a specific fleet

authFetch path: `user/vehicle/by-service/fleets/{fleetId}/groups` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleGroupDTO[]`, `400` → `VehicleGroupDTO[]`

### GET `/vehicle/by-service/fleets/{fleetId}/groups/vehicles`
Get the list of the groups with the list of vehicles id associated

authFetch path: `user/vehicle/by-service/fleets/{fleetId}/groups/vehicles` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleet id

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Group2VehiclesDTO[]`

### GET `/vehicle/by-service/fleets/{fleetId}/vehicles`
List all the vehicles

authFetch path: `user/vehicle/by-service/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleet id

**Query params:**
- `page`: integer (int32) (optional)
- `size`: integer (int32) (optional)
- `onlyActive`: boolean (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO[]`

### GET `/vehicle/by-service/fleets/{fleetId}/vehicles/models`
List all the models

authFetch path: `user/vehicle/by-service/fleets/{fleetId}/vehicles/models` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleet id

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelDTO[]`

### GET `/vehicle/by-service/fleets/{fleetId}/vehicles/{vehicleId}`
Get vehicle administrative info by vehicleId

authFetch path: `user/vehicle/by-service/fleets/{fleetId}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `vehicleId`: any (required) — The unique id of the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### GET `/vehicle/fleets/{fleetId}/categories`
List all model categories for a fleet

authFetch path: `user/vehicle/fleets/{fleetId}/categories` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelCategoryResponseDTO[]`

### POST `/vehicle/fleets/{fleetId}/categories`
Create a new model category

New categories are created with enabled=true when the enabled field is omitted.

authFetch path: `user/vehicle/fleets/{fleetId}/categories` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ModelCategoryRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Category name |
| description | string | no | Category description |
| imageUrl | string | no | URL to S3 image resource representing the category |
| enabled | boolean | no | When false, the category is kept for historical data but should not be offered for new use. On create, defaults to true if omitted. On update, omit to keep the… |

**Responses:** `201` → `ModelCategoryResponseDTO`

### GET `/vehicle/fleets/{fleetId}/categories/{categoryId}`
Get a specific model category

authFetch path: `user/vehicle/fleets/{fleetId}/categories/{categoryId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `categoryId`: string (required) — The unique id of the category

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelCategoryResponseDTO`

### PUT `/vehicle/fleets/{fleetId}/categories/{categoryId}`
Update a model category

Updates name, description, imageUrl, and/or enabled. Send enabled=false to disable the category without deleting it (historical references remain). Omit a field to leave its current value unchanged.

authFetch path: `user/vehicle/fleets/{fleetId}/categories/{categoryId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `categoryId`: string (required) — The unique id of the category

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ModelCategoryRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Category name |
| description | string | no | Category description |
| imageUrl | string | no | URL to S3 image resource representing the category |
| enabled | boolean | no | When false, the category is kept for historical data but should not be offered for new use. On create, defaults to true if omitted. On update, omit to keep the… |

**Responses:** `200` → `ModelCategoryResponseDTO`

### DELETE `/vehicle/fleets/{fleetId}/categories/{categoryId}`
Delete a model category

authFetch path: `user/vehicle/fleets/{fleetId}/categories/{categoryId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `categoryId`: string (required) — The unique id of the category

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### POST `/vehicle/fleets/{fleetId}/categories/{categoryId}/models`
Associate models to a category

authFetch path: `user/vehicle/fleets/{fleetId}/categories/{categoryId}/models` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `categoryId`: string (required) — The unique id of the category

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `CategoryModelsAssociationDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelIds | integer (int64)[] | yes | List of model IDs to associate to the category |

**Responses:** `204`

### DELETE `/vehicle/fleets/{fleetId}/categories/{categoryId}/models/{modelId}`
Dissociate a model from a category

authFetch path: `user/vehicle/fleets/{fleetId}/categories/{categoryId}/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `categoryId`: string (required) — The unique id of the category
- `modelId`: integer (int64) (required) — The model ID to dissociate

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204`

### GET `/vehicle/fleets/{fleetId}/groups`
Get a all VehicleGroup for a specific fleet

authFetch path: `user/vehicle/fleets/{fleetId}/groups` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleGroupDTO[]`, `400` → `VehicleGroupDTO[]`

### POST `/vehicle/fleets/{fleetId}/groups`
Create a new VehicleGroup

authFetch path: `user/vehicle/fleets/{fleetId}/groups` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `CreateVehicleGroupDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| type | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | yes |  |
| intervalName | string | no |  |

**Responses:** `200` → `CreateVehicleGroupDTO`, `400` → `CreateVehicleGroupDTO`, `409` → `CreateVehicleGroupDTO`

### GET `/vehicle/fleets/{fleetId}/groups/vehicles`
Get the list of the groups with the list of vehicles id associated

authFetch path: `user/vehicle/fleets/{fleetId}/groups/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Group2VehiclesDTO[]`, `400` → `Group2VehiclesDTO[]`

### POST `/vehicle/fleets/{fleetId}/groups/vehicles`
Batch add or remove some vehicle to a Group

authFetch path: `user/vehicle/fleets/{fleetId}/groups/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Vehicle2GroupBatchDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | string: `add, delete` | yes |  |
| vehicles | string | yes |  |
| groupId | string | yes |  |
| deleteOn | string: `END_TRIP`, `NONE` | no |  |
| expireAt | string (date-time) | no |  |
| multipleGroupsOfSameTypeUniqueness | boolean | no |  |
| replaceAnyExistingGroup | boolean | no |  |

**Responses:** `200`, `201`, `400`

### PUT `/vehicle/fleets/{fleetId}/groups/{groupId}/vehicles/{vehicleId}`
Add a vehicle to a Group

authFetch path: `user/vehicle/fleets/{fleetId}/groups/{groupId}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `groupId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Vehicle2GroupDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| deleteOn | string: `END_TRIP`, `NONE` | no |  |
| expireAt | string (date-time) | no |  |
| multipleGroupsOfSameTypeUniqueness | boolean | no |  |
| replaceAnyExistingGroup | boolean | no |  |

**Responses:** `201`, `400`

### DELETE `/vehicle/fleets/{fleetId}/groups/{groupId}/vehicles/{vehicleId}`
Remove a vehicle from a Group

authFetch path: `user/vehicle/fleets/{fleetId}/groups/{groupId}/vehicles/{vehicleId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `groupId`: string (required)
- `vehicleId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `201`, `400`

### GET `/vehicle/fleets/{fleetId}/groups/{id}`
Get a specific VehicleGroup

authFetch path: `user/vehicle/fleets/{fleetId}/groups/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleGroupDTO`, `400` → `VehicleGroupDTO`

### DELETE `/vehicle/fleets/{fleetId}/groups/{id}`
Delete VehicleGroup for a specific fleet

authFetch path: `user/vehicle/fleets/{fleetId}/groups/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### GET `/vehicle/fleets/{fleetId}/vehicles`
list all the vehicles administrative information of a fleet

The administrative info are all the cold data which don't change often. If you want to get the real time data please use the /fleeetmanager/public/fleets/{fleetId}/vehicles end point.

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `onlyActive`: Boolean (optional) — If you want to return only the active vehicle (non archived)
- `page`: Integer (optional) — The page number, see the documentation of the pagination system
- `size`: Integer (optional) — The page size (max 2000), see the documentation of the pagination system
- `categoryId`: string (optional) — Optional category id to filter vehicles by model category

**Header params:**
- `Last-Modified`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO[]`

### POST `/vehicle/fleets/{fleetId}/vehicles`
Create a new vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `check`: boolean (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Vehicle`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| vin | string | no |  |
| name | string | no |  |
| plate | string | no |  |
| model | Model | no |  |
| options | Option[] | no |  |
| createDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| fleetId | string | no |  |
| vuboxId | string | no |  |
| externalId | string | no |  |
| wakeupProvider | string | no |  |
| noBox | boolean | no |  |
| pricingParameter | PricingParameter | no |  |
| msisdn | string | no |  |
| iccid | string | no |  |
| imsi | string | no |  |
| residualValue | number | no |  |
| vehicleSubscriptionAttributes | VehicleSubscriptionAttributes | no |  |
| registrationDate | string (date) | no |  |
| published | boolean | no |  |
| archived | boolean | no |  |

**Responses:** `200` → `VehicleDTO`

### GET `/vehicle/fleets/{fleetId}/vehicles/models`
List all the models

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelDTO[]`

### POST `/vehicle/fleets/{fleetId}/vehicles/models`
Create a model

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ModelDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | yes | Model Unique Id |
| name | string | yes | Model's name, it's the name of the model which will appears in the list of models and available vehicles (must be unique) |
| brand | string | no |  |
| energyType | string: `FUEL`, `ELECTRIC`, `HYBRID`, `GASOLINE`, `DIESEL`, `GAS`, `PHEV_GASOLINE`, `PHEV_DIESEL`, `HUMAN`, `HYDROGEN_FUEL_CELLS` | yes | Energy type: * Fuel * Electric * Hybrid |
| status | string: `ACTIVE`, `ARCHIVED` | yes | Model status: * Active * Archive |
| nbOfSeats | integer (int32) | yes | Number of seat |
| autonomy | integer (int32) | yes | Max Cruising range |
| creationDate | string (date-time) | no | Date of creation (cannot be updated) |
| updateDate | string (date-time) | no | Date of update (cannot be updated) |
| description | string | yes | Free field to store any extra information (not returned in the mobile api or showed in the backoffice) |
| fleetId | string | no | fleetId (cannot be updated) |
| vehicleType | string: `UNDEFINED`, `KICKSCOOTER`, `SCOOTER`, `CAR`, `VAN`, `SUV`, `INTERMEDIATE`, `COMPACT`, `CONVERTIBLE`, `SEDAN`, `HATCHBACK`, `STATION_WAGON`, `COUPE`, `MINIVAN`, `PICKUP`, `UTILITY`, `TRUCK`, `BIKE`, `MOPED` | no | Type of Vehicle: * UNDEFINED (default value if no specified) * KICKSCOOTER * CAR * SCOOTER * VAN * BIKE * EBIKE |
| transmission | string: `UNDEFINED`, `MANUAL`, `AUTOMATIC` | no |  |
| outOfServiceRange | string | no | Used by an automatic probe to put a vehicle 'out of service' if the autonomy's level goes below this value |
| recoveryRange | string | no | Used by an automatic probe to put an 'out of service' vehicle active again if the autonomy's level goes above this value (refuel or charging) |
| incentiveRecoveryRange | string | no | Used by the 'incentive to recharge' feature ; autonomy's level to reach to consider vehicle as 'recharged' |
| incentiveThresholds | IncentiveThreshold[] | no | Used by the 'incentive to recharge' feature ; thresholds that define how many credits will be offered for a specific autonomy level |
| redistributeVehicleChargedEnoughRange | string | no |  |
| odometerReliable | boolean | no |  |
| modelRate | number | no |  |
| capacityTank | integer (int32) | no |  |
| averageEnergyConsumption | number | no |  |
| categoryId | string | no |  |
| categoryEnabled | boolean | no | Whether the model's category is enabled for new use (mirrors model_category.enabled; null if the model has no category) |
| basePrice | number | no |  |

**Responses:** `200` → `ModelDTO`

### GET `/vehicle/fleets/{fleetId}/vehicles/models/modelvehicles`
Return service model and vehicles for Free Floating service

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models/modelvehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ServiceModelVehiclesDTO[]`

### GET `/vehicle/fleets/{fleetId}/vehicles/models/{modelId}`
Get a model by id

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `modelId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelDTO`

### POST `/vehicle/fleets/{fleetId}/vehicles/models/{modelId}`
Update a model by id

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `modelId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Model`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| brand | string | no |  |
| name | string | no |  |
| description | string | no |  |
| energyType | string: `FUEL`, `ELECTRIC`, `HYBRID`, `GASOLINE`, `DIESEL`, `GAS`, `PHEV_GASOLINE`, `PHEV_DIESEL`, `HUMAN`, `HYDROGEN_FUEL_CELLS` | no |  |
| status | string: `ACTIVE`, `ARCHIVED` | no |  |
| nbOfSeats | integer (int32) | no |  |
| autonomy | integer (int32) | no |  |
| outOfServiceRange | string | no |  |
| recoveryRange | string | no |  |
| incentiveRecoveryRange | string | no |  |
| incentiveThresholds | IncentiveThreshold[] | no |  |
| category | ModelCategory | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| vehicleType | string: `UNDEFINED`, `KICKSCOOTER`, `SCOOTER`, `CAR`, `VAN`, `SUV`, `INTERMEDIATE`, `COMPACT`, `CONVERTIBLE`, `SEDAN`, `HATCHBACK`, `STATION_WAGON`, `COUPE`, `MINIVAN`, `PICKUP`, `UTILITY`, `TRUCK`, `BIKE`, `MOPED` | no |  |
| transmission | string: `UNDEFINED`, `MANUAL`, `AUTOMATIC` | no |  |
| redistributeVehicleChargedEnoughRange | string | no |  |
| odometerReliable | boolean | no |  |
| modelBasePrice | number | no |  |
| modelRate | number | no |  |
| capacityTank | integer (int32) | no |  |
| averageEnergyConsumption | number | no |  |

**Responses:** `200` → `ModelDTO`

### PATCH `/vehicle/fleets/{fleetId}/vehicles/models/{modelId}`
Patch a model by id

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `modelId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `JsonPatch`

**Responses:** `200` → `ModelDTO`

### DELETE `/vehicle/fleets/{fleetId}/vehicles/models/{modelId}`
Archive a model

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/models/{modelId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `modelId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ModelDTO`

### GET `/vehicle/fleets/{fleetId}/vehicles/options`
List all the options

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/options` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Option[]`

### POST `/vehicle/fleets/{fleetId}/vehicles/options`
Create an option

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/options` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Option`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| name | string | no |  |
| type | string | no |  |
| startDate | string | no |  |
| endDate | string | no |  |
| description | string | no |  |

**Responses:** `200` → `Option`

### GET `/vehicle/fleets/{fleetId}/vehicles/options/{optionId}`
Get an option by id

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/options/{optionId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `optionId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Option`

### POST `/vehicle/fleets/{fleetId}/vehicles/options/{optionId}`
Update an option

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/options/{optionId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `optionId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `UpdateOptionDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| description | string | no |  |
| name | string | no |  |
| type | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |

**Responses:** `200` → `Option`

### GET `/vehicle/fleets/{fleetId}/vehicles/search`
Get vehicle administrative info by boxId

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/search` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `vuboxId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### GET `/vehicle/fleets/{fleetId}/vehicles/{id}`
Get vehicle administrative info by vehicleId

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The unique id of the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### POST `/vehicle/fleets/{fleetId}/vehicles/{id}`
Update a vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `Vehicle`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| vin | string | no |  |
| name | string | no |  |
| plate | string | no |  |
| model | Model | no |  |
| options | Option[] | no |  |
| createDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| fleetId | string | no |  |
| vuboxId | string | no |  |
| externalId | string | no |  |
| wakeupProvider | string | no |  |
| noBox | boolean | no |  |
| pricingParameter | PricingParameter | no |  |
| msisdn | string | no |  |
| iccid | string | no |  |
| imsi | string | no |  |
| residualValue | number | no |  |
| vehicleSubscriptionAttributes | VehicleSubscriptionAttributes | no |  |
| registrationDate | string (date) | no |  |
| published | boolean | no |  |
| archived | boolean | no |  |

**Responses:** `200` → `VehicleDTO`

### PATCH `/vehicle/fleets/{fleetId}/vehicles/{id}`
Patch vehicle administrative info by vehicleId

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The unique id of the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string`

**Responses:** `200` → `VehicleDTO`

### DELETE `/vehicle/fleets/{fleetId}/vehicles/{id}`
Archive a vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### PUT `/vehicle/fleets/{fleetId}/vehicles/{id}/options/{optionId}`
Add an option to a vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}/options/{optionId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `optionId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### DELETE `/vehicle/fleets/{fleetId}/vehicles/{id}/options/{optionId}`
Remove an option to a vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}/options/{optionId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)
- `optionId`: integer (int64) (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### PUT `/vehicle/fleets/{fleetId}/vehicles/{id}/removeVubox`
detach a box from a vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{id}/removeVubox` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `id`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `VehicleDTO`

### POST `/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/extendLock`
Extend the Lock of a locked vehicle

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/extendLock` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required) — The fleetId of the subscription
- `vehicleId`: string (required) — The id of the vehicle to extend the lock

**Query params:**
- `stationId`: string (required) — The stationId of the vehicle
- `userId`: string (required) — The id of the user who wants to extend the lock of the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `LockVehicleDTO`, `400` → `LockVehicleDTO`

### POST `/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/putLock`
Lock a vehicle for pre reservation

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/putLock` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required) — The fleetId of the subscription
- `vehicleId`: string (required) — The id of the vehicle to lock

**Query params:**
- `stationId`: string (required) — The stationId of the vehicle
- `userId`: string (required) — The id of the user who wants to lock the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `LockVehicleWithTimersDTO`, `400` → `LockVehicleWithTimersDTO`

### POST `/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/releaseLock`
Unlock a vehicle for pre reservation

authFetch path: `user/vehicle/fleets/{fleetId}/vehicles/{vehicleId}/releaseLock` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required) — The fleetId of the subscription
- `vehicleId`: string (required) — The id of the vehicle to unlock

**Query params:**
- `stationId`: string (required) — The stationId of the vehicle
- `userId`: string (required) — The id of the user who wants to unlock the vehicle

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `LockVehicleDTO`, `400` → `LockVehicleDTO`

### POST `/vehicle/fleets/{fleetId}/wakeupProvider`
Switch between wakeup providers

authFetch path: `user/vehicle/fleets/{fleetId}/wakeupProvider` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `SwitchWakeupCmd`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| moveFrom | string | yes |  |
| moveTo | string | yes |  |

**Responses:** `204`, `400`

### GET `/vehicle/v2/fleets/{fleetId}/vehicles`
List all the vehicles

authFetch path: `user/vehicle/v2/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: any (required) — The fleet id

**Query params:**
- `onlyActive`: any (optional) — to return only active vehicles (not archived and with a boxId)
- `domains`: any (optional) — optional comma separated list of domains: option,group,service
- `pageable`: CursorPageable (required)

**Header params:**
- `Last-Modified`: string (optional)
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `CursorPaginationSliceVehicleDTO`
