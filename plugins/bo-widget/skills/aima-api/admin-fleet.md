# AIMA Admin Fleet API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-fleet (41 endpoints)

### GET `/fleets/{fleetId}/book`
List all booked vehicles

Return all the vehicles which have a booking in progress

authFetch path: `fleetmanager/public/fleets/{fleetId}/book` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet

**Responses:** `200` → `object`, `500` → `Error`

### POST `/fleets/{fleetId}/trips/partial-vehicles-retrieval`
list partial vehicles for given order IDs

Retrieves partial vehicles corresponding to a given list of order IDs for a specific fleet

authFetch path: `fleetmanager/public/fleets/{fleetId}/trips/partial-vehicles-retrieval` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Query params:**
- `attributes`: string (required) — requested vehicle attributes

**Request body:** `IdsListRequest`

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### GET `/fleets/{fleetId}/unsync`
List all unsync vehicles.

Return all the vehicles in an unsync state. These are vehicles which have pending commands from the server

authFetch path: `fleetmanager/public/fleets/{fleetId}/unsync` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### GET `/fleets/{fleetId}/users/{userId}/vehicle`
get the vehicle booked by a user

Return the vehicle booked by the given user

authFetch path: `fleetmanager/public/fleets/{fleetId}/users/{userId}/vehicle` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `userId`: string (required) — Aima user id or in the mobility platform configuration any unique id provided at the booking.

**Responses:** `200` → `VehicleFM`, `404` → `Error`, `500` → `Error`

### GET `/fleets/{fleetId}/vehicles`
list all the vehicles

Return all the vehicles of a given fleet. This end point is paginated. the maximum page size is 2000 vehicles and the recommended page size is 500.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Query params:**
- `page`: number (optional) — page's number
- `lastUpdatedMillis`: number (optional) — will return only the vehicles updated since the provided timestamp.

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### PUT `/fleets/{fleetId}/vehicles/disable`
Batch disable multiple vehicles

Disable a list of vehicles in one call

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/disable` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `VehicleDisableListRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subStatus | string | yes | Out of service reason |
| vehicleIds | string[] | yes | the list of vehicle ids to update |

**Responses:** `200`, `400` → `Error`, `500` → `Error`

### PUT `/fleets/{fleetId}/vehicles/enable`
Batch enable multiple vehicles

Enable a list of vehicles in one call

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/enable` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `VehicleEnableListRequest`

**Responses:** `200`, `400` → `Error`, `500` → `Error`

### GET `/fleets/{fleetId}/vehicles/expert`
List expert commands

Returns the catalog of expert commands available for this box. Expert commands are specific to the model of the box. That can be commands to do diagnostics, reboot or a functionality specific to this model of box.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/expert` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Responses:** `200` → `string[]`, `400` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/needsRedistribution`
getAllVehiclesThatNeedRedistribution

Return all the vehicle which have not moved or in trip since a while and would need to be moved in a better place.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/needsRedistribution` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/search`
List vehicles by position

Return all the vehicles available which are localized in a circle of a given radius

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/search` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet

**Request body:** `SearchVehicle`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| latitude | number (double) | yes | latitude of the centre of the circle. |
| longitude | number (double) | yes | longitude of the centre of the circle. |
| radius | integer (int32) | yes | radius of the circle in kilometers/miles |
| userId | string | no | id of the user who search vehicles. |
| vehicleIds | string[] | no |  |

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### GET `/fleets/{fleetId}/vehicles/toIntegrate`
List boxes to integrate

Return all the box in the fleet which are not linked yet with a vehicle

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/toIntegrate` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet

**Responses:** `200` → `VehicleFM[]`, `500` → `Error`

### DELETE `/fleets/{fleetId}/vehicles/toIntegrate/{boxId}`
delete a Vehicle to integrate

During a the infleeting process, once the box is installed and associated to a vehicle, the box to integrate must be deleted. See the infleeting documentation for a complete description of the infleeting workflow.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/toIntegrate/{boxId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — Unique id of the fleet
- `boxId`: string (required) — unique id of the box

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200`, `403` → `Error`, `404` → `Error`, `500` → `Error`

### GET `/fleets/{fleetId}/vehicles/{vehicleId}`
get one vehicle

Returns the vehicle information by ID

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Query params:**
- `coordsys`: string: `WGS`, `GCJ`, `BD09` (optional) — The coordinates system used for the location of the vehicle. WGS by default. If you operate in mainland China please use GCJ or BD09

**Responses:** `200` → `VehicleFM`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}`
Update a vehicle

update specific information on a given vehicle.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (required) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `UpdateRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| out-of-service-reason | string | no | out of service reason |
| cleanliness-status | boolean | no | If true the vehicle will need to be cleaned |
| needs-redistribution | boolean | no | If true the vehicle hasn't moved since a while |
| automaticallyRecoverVehicle | boolean | no | Deprecated |

**Responses:** `200`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/adminToken`
get BLE AdminToken

'Get Bluetooth Low Energy (BLE) Admin token'. Only supported by the Vubox. If you provide the optional startDate parameter, the vehicle firmware version must be >= 7.7.0 and the token version will be 3. If not provided, version 2 is used.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/adminToken` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Query params:**
- `startDate`: string (optional) — Optional. Start date for the admin token in ISO-8601 format (e.g. 2019-12-01T10:40:27.29Z). If provided, the vehicle firmware version must be >= 7.7.0 and the…

**Header params:**
- `x-user-id`: string (required) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `BLETokenRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| expirationInSecs | integer (int64) | yes | token TTL in seconds |
| userId | string | yes | id of user for whom is the token. |
| startDate | string (date-time) | no | Optional. Start date for the admin token in ISO-8601 format (e.g. 2019-12-01T10:40:27.29Z). If provided, the vehicle firmware version must be >= 7.7.0 and the… |

**Responses:** `200` → `BLEToken`, `404` → `Error`, `405` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/archive`
archive vehicle

This delete the vehicle information of the fleet, when it has been definitly removed from the fleet. The vehicle must not be booked.Please note that an archived vehicle can reapear, in the fleet, if the box has not been unasigned from the vehicle and if it contines to send information to the platfo…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/archive` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200`, `400` → `Error`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/battery/lock`
lock/unlock battery

Toggle lock/unlock on the vehicles which have a swapable battery (mainly kickscooter or mopped)

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/battery/lock` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `BatteryLockRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | integer | yes | if 1, action is to lock the battery; otherwise, action is to unlock battery |

**Responses:** `200`, `400` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/book`
booking request

Book a vehicle for user, on a specific service with a specific profileId.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/book` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `BookingRequestFM`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | ID of the user who books the vehicle. Can by optional on the mobility platform. |
| rfidTk | string | no | Vehicle RFID token. |
| pricingId | string | yes | unique ID of the pricing strategy link to the booking. Can by optional on the mobility platform. |
| serviceId | object (string) | yes | unique ID of the service. |
| profileId | object (string) | yes | unique ID of the user's profile. |
| orderId | object (string) | no | unique ID of the trip. Optional. Can be used to force the usage of the specific orderId instead of one generated by AIMA. this feature is not compatible with t… |
| overrideBlocking | boolean | no | optional, only used for booking cancelation. default is false. Use true to NOT check cancellation counter. |
| theorStartDate | object (date-time) | no | theoretical Start date of the trip. Optional only used in when you want to allocate a vehicle on a schedule booking service |
| theorEndDate | object (date-time) | no | theoretical End date of the trip. Optional only used in when you want to allocate a vehicle on a schedule booking service |
| bookingEndZoneIds | string[] | no |  |
| bookingValiditySec | number | no | To override the booking validity configured in the service |
| locale | string | no | Set a specific locale (used for the voice prompt) |
| preAuthSkip | boolean | no | disable the preauth at the booking phase |

**Responses:** `200` → `BookingResponse`, `400` → `Error`, `403` → `Error`, `404` → `Error`, `409` → `Error`, `422` → `Error`, `500` → `Error`

### DELETE `/fleets/{fleetId}/vehicles/{vehicleId}/book`
cancel Booking

Cancel a booking on a vehicle. A booking can be cancelled if the trip has not been started yet (vehicle not unlocked) and if the booking has not expired. If the vehicle has not confirmed the booking yet, the platform will proceed to an instant cancel and record a canceled trip report server-side (f…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/book` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `204`, `400` → `Error`, `404` → `Error`, `409` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/connectBoxless`
Connect boxless vehicle

Connect boxless vehicle allows the user to initialize vehicle in Redis before trip is started

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/connectBoxless` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automatically filled by the vulog api g…

**Request body:** `ConnectBoxlessRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | id of the vehicle to connect |

**Responses:** `200` → `string`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/disable`
temporarily disable a vehicle.

Put the vehicle out of service, This vehicle won't be available for booking except on a service of type ServiceTrip (dedicated for the fleetAgent). The vehicle must not be booked to be put out of service. A description of why the vehicle is out of service can be provided.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/disable` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `VehicleStatusRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subStatus | string | yes | Out of service reason |
| allowDelayedDisable | boolean | no | If true the vehicle will be put out of service after the end of the trip. If false and the vehicle is booked, this request will be rejected. |

**Responses:** `200`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/door`
Lock/Unlock vehicle door/topcase/saddle

Lock or unlock the vehicle's doors or topcase and saddle. This command is completly independant of any booking in the vehicle. It doesn't impact the state machine of the trip. So if vehicle is booked with a trip in pause and you unlock the door via this command the vehicle will stay in pause.This a…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/door` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `DoorsRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | integer (int32): `0`, `1` | no | possible action: 0 - Unlock doors 1 - Lock doors |

**Responses:** `200` → `FGResponse`, `400` → `Error`, `404`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/enable`
enable a vehicle

Enable a vehicle which is out of service.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/enable` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `VehicleEnableRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cancelDelayedDisable | boolean | no | cancel the out of service scheduled for vehicle in use |

**Responses:** `200`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/expert`
send an expert command

Send an expert command by providing an ID of command returned by the expert command list. The vehicle needs to be awake and connected to receive the command.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/expert` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — The unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `ExpertRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cmd | string | yes | list of expert commands available |

**Responses:** `200` → `string`, `400` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `500` → `Error`

### GET `/fleets/{fleetId}/vehicles/{vehicleId}/ping`
ping Vehicle

Send an applicative ping the box to check that the box is alive and the connectivity is established.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/ping` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200` → `Result`, `410` → `Error`, `500` → `Error`

### PUT `/fleets/{fleetId}/vehicles/{vehicleId}/products/{productId}`
add a productuct to the booking

Assign a Trip related prod to the current booking. Those products will be included in the trip report and will be used by the billing system to compute the amount of the trip.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/products/{productId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — Unique id of the fleet
- `vehicleId`: string (required) — Unique id of the vehicle
- `productId`: string (required) — The unique id of the product which need to be attached to this vehicle. The product will be applied to the trip in progress or the next trip done by the vehicl…

**Query params:**
- `force`: boolean (optional) — If false or omitted, the product is added only when it matches the trip service (validated via the backend). If true, the product id is attached without that v…

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200`, `403` → `Error`, `404` → `Error`, `500` → `Error`

### DELETE `/fleets/{fleetId}/vehicles/{vehicleId}/products/{productId}`
remove a product to the trip

Remove a Trip related product from the current booking.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/products/{productId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle
- `productId`: string (required) — unique id of the product which need to be removed to this vehicle.

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200`, `403` → `Error`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/release`
release a trip

Release trip command allows the customer to do another booking on a different vehicle. This cut the link between the vehicle and the user who is free to book another vehicle. It's a last resort operation when the box is unreachable and it's impossible to finish the trip. The trip will continue to l…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/release` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `ReleaseRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | id of trip to release |

**Responses:** `200`, `400` → `Error`, `403` → `Error`, `404` → `Error`, `409` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/rfid/push`
push Rfid To Vehicle

Send RFID card tag to a given vehicle. This command is only available on specific box's model and vehicle's integration.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/rfid/push` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (required) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200` → `FGResponse`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/end`
End a trip

Finish the trip on a booked vehicle. The request must include the orderid. This will send a command to the box to lock and secure the vehicle. The response time of this request is between few seconds and one minutes depending of the box's manufacturer and the network coverage. The vehicle must be c…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/end` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `TripStartEndRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| odometer | number (double) | no | the current value of the odometer (for no-box vehicles) |
| autonomyPercent | number (double) | no | the current energy level of the vehicle (for no-box vehicles) |
| start_date | string (date-time) | no | the actual date the trip has started (for no-box vehicles) |
| end_date | string (date-time) | no | the actual date the trip has ended (for no-box vehicles) |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

**Responses:** `200`, `400` → `Error`, `403` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `424` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/forceEnd`
Force end a trip (server-side)

Finalize an active trip without waiting for an end-trip report from the box. Generates a light report trip from booking context and events; the resulting trip may be marked suspicious for agent review. Intended for support when the vehicle box cannot communicate (e.g. accident).

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/forceEnd` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `ForceEndTripRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | no | Optional tripId/orderId for validation against the vehicle's active trip |
| cancel | boolean | no | Whether to cancel the trip instead of ending it normally |

**Responses:** `200`, `400` → `Error`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/override`
Edit a trip

Override the duration of trip before the end trip.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/override` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `AdjustTripRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| customEndDate | string (date-time) | no | to override trip's end date |
| duration | object | no | to override trip's duration |
| customDiscount | object | no | to apply a specific discount |
| additionalCharges | object | no | to apply a specific discount |

**Responses:** `200`, `404` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/pause`
Pause a trip

Pause the trip on a booked vehicle. The request must include the orderid. This will send a command to the box to lock and secure the vehicle without finishing the trip. The response time of this request is between few seconds and one minutes depending of the box's manufacturer and the network cover…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/pause` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `TripRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

**Responses:** `200`, `400` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `424` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/report`
Post a Light Trip Report (BLE) (for Vubox5 only)

Post a trip report generated by the Vubox5 and forwarded to the mobile app using the Vulog BLE SDK.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/report` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `LTRRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| boxId | string | yes | unique id of the box |
| tripReport | string | yes | Light trip report |
| version | number | no | Protocol's version the light trip report (currently 2) |

**Responses:** `200` → `VehicleFM`, `400` → `Error`, `409` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/resume`
Resume a trip

Resume the trip on a booked vehicle. The request must include the orderid. This will send a command to the box to unlock the vehicle. The response time of this request is between few seconds and one minutes depending of the box's manufacturer and the network coverage. If the box's model has a power…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/resume` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `TripRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

**Responses:** `200`, `400` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `424` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/start`
Start a trip

Start a trip on a booked vehicle. The request must include the orderid. It can be rejected by the platform if the trip has already been started or if a command is already in progress. This will send a command to the box to unlock the vehicle. The response time of this request is between few seconds…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/start` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `TripStartEndRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| odometer | number (double) | no | the current value of the odometer (for no-box vehicles) |
| autonomyPercent | number (double) | no | the current energy level of the vehicle (for no-box vehicles) |
| start_date | string (date-time) | no | the actual date the trip has started (for no-box vehicles) |
| end_date | string (date-time) | no | the actual date the trip has ended (for no-box vehicles) |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

**Responses:** `200`, `400` → `Error`, `403` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `424` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/trip/terminate`
Terminate a trip

Finish the trip on a booked vehicle overriding the checks. This will send a command to the box to lock and secure the vehicle. The response time of this request is between few seconds and one minutes depending of the box's manufacturer and the network coverage. The vehicle must be connected otherwi…

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/trip/terminate` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required)

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `TripRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

**Responses:** `200`, `400` → `Error`, `404` → `Error`, `409` → `Error`, `410` → `Error`, `500` → `Error`

### POST `/fleets/{fleetId}/vehicles/{vehicleId}/wakeup`
wakeup a vehicle

Send a SMS to the box to wakeup it. This command is only applicable to boxes which can be in standby mode to preserve the auxilary battery.It can be rejected by the platform is a wakeup is already in progress on this vehicle.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/wakeup` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200` → `WakeupResponse`, `404` → `Error`, `500` → `Error`

### PUT `/fleets/{fleetId}/vehicles/{vehicleId}/zones/{zoneId}`
Assign a zone to a vehicle

At each position's update received by the server, a matching is done to retrieve the list of the zones which match this position. With this end point you can manually enrich this list with a specific zoneId or any externalId.

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/zones/{zoneId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle
- `zoneId`: string (required) — The unique id of the zone could be a zoneId, poiId or any externalId

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Request body:** `AssignZoneRequest`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | yes | home zone's type (allowed, forbidden, parking or any free text) |
| sticky | boolean | no | optional flag to know if this assignation must persist. Otherwise it will be deleted after the next position refresh. |

**Responses:** `200`, `400` → `Error`, `500` → `Error`

### DELETE `/fleets/{fleetId}/vehicles/{vehicleId}/zones/{zoneId}`
Remove a zone

To manually remove a zone by zoneID. This zone can a be one of previously manually added zone or one automatically added by the system

authFetch path: `fleetmanager/public/fleets/{fleetId}/vehicles/{vehicleId}/zones/{zoneId}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `vehicleId`: string (required) — unique id of the vehicle
- `zoneId`: string (required) — Unique id of the zone

**Header params:**
- `x-user-id`: string (optional) — vulog userid of user who perform this command. This is used to track the user who did the update. By default this id is automaticaly filled by the vulog api ga…

**Responses:** `200`, `500` → `Error`

### GET `/fleets/{fleetId}/zonesDetails/{id}`
get vehicle breakdown by zone

Return the list of zones used by at least one vehicle. Usefull to list all the vehicles located in each zones.

authFetch path: `fleetmanager/public/fleets/{fleetId}/zonesDetails/{id}` (base path `/boapi/proxy/fleetmanager/public`)

**Path params:**
- `fleetId`: string (required) — unique id of the fleet
- `id`: string (required) — Reserved for future use

**Responses:** `200` → `ZoneDetails[]`, `500` → `Error`
