---
name: aima-api
description: Vulog admin API endpoints a BO widget can call with authFetch -- the AIMA admin API served under /boapi/proxy, generated weekly from the public swagger. Use it while writing a BO widget to find the path to pass to bo.authFetch(...), its parameters, request body, response schema, pagination and error codes (users, trips, bookings, vehicles, invoices, services, fleet, service desk, geoloc, reports...).
---

# AIMA admin API for BO widgets

> **Release {{release}}** — OpenAPI {{openapi}} — {{endpointCount}} endpoints a widget can call,
> {{tagCount}} tags, {{schemaCount}} schemas ({{excludedCount}} other swagger endpoints left out:
> mobile API, private, deprecated or unfinished ones)
> **Source:** https://vulog-doc-api.web.app/swagger/sta.yaml
>
> The endpoint files and `schemas.md` are regenerated weekly from the public swagger by
> `scripts/aima-api/generate.mjs` in the bo-widget-sdk repository. Edit
> `scripts/aima-api/SKILL.template.md` or `scripts/aima-api/config.mjs`, never the generated files.

## Calling an endpoint from a widget

A widget never builds URLs and never needs a host: it calls `bo.authFetch(path)` with a path
relative to the BO admin API (`baseUrl`, which already ends with `/boapi/proxy/`). The SDK and the
BO add the authentication (`X-API-Key`, and the token).

**authFetch path = the endpoint's base path after `/boapi/proxy/`, then the route.** Every endpoint
of this skill shows it on its `authFetch path:` line, e.g.

| Endpoint                                  | Base path                          | Call                                                                      |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `GET /fleets/{fleetId}/vehicles`          | `/boapi/proxy/fleetmanager/public` | ``bo.authFetch(`fleetmanager/public/fleets/${fleetId}/vehicles?page=0`)`` |
| `GET /fleets/{fleetId}/users/{id}/status` | `/boapi/proxy/user`                | ``bo.authFetch(`user/fleets/${fleetId}/users/${id}/status`)``             |

- Never prefix the path with `boapi/proxy/`, never add `Authorization` or `X-API-Key` yourself,
  and do not build URLs from `getApiInfo()` or call `getAccessToken()` for these APIs.
- The widget needs the `apiInfo` permission in the `permissions` of its `widget.json` to call
  `authFetch` with such a path (plus `accessToken` when it runs in an iframe).
- Handle a `401` (session lost) by showing a message, never by retrying in a loop.
- Only the endpoints under `/boapi/proxy` are listed: other Vulog APIs (such as the mobile API
  `/apiv5`) are not authenticated by `authFetch`.

## How to use this skill

Read this file first, then open only the sub-file you need. The files are large: search them
instead of reading them whole. They live next to this SKILL.md, in `${CLAUDE_SKILL_DIR}` -- always
use that full path (the working directory is the widget project, not this skill), e.g.:

```bash
grep -n -A30 '^### GET `/fleets/{fleetId}/users/{id}/status`$' "${CLAUDE_SKILL_DIR}/admin-user.md"
grep -n -A40 '^### UserStatusDTO$' "${CLAUDE_SKILL_DIR}/schemas.md"
grep -n 'authFetch path: `fleetmanager/' "${CLAUDE_SKILL_DIR}/admin-fleet.md"
```

Each endpoint lists its `authFetch` path and base path, its path/query/header params, the request
body (first-level fields) and its responses as `status → SchemaName`. Look a schema up in
`schemas.md` to see the shape of a request or a response. Header params such as `x-user-id` or
`x-boapi-ctx` describe the session and are normally filled in by the admin gateway: a widget does
not send them.

### Sub-files

All files are in `${CLAUDE_SKILL_DIR}`, next to this SKILL.md:

| File | Content | Endpoints |
| ---- | ------- | --------- |
{{fileTable}}

---

## Pagination

Query params: `page` (0-based), `size`, `sort` (e.g. `userName,DESC`).
Response headers: `first`, `last`, `number`, `numberOfElements`, `size`, `totalElements`, `totalPages`.

---

## Error Codes

| HTTP | Code                   | Description                                   |
| ---- | ---------------------- | --------------------------------------------- |
| 400  | `invalidArgument`      | Bad/missing param                             |
| 401  | —                      | Session expired or lost — show a message      |
| 403  | `forbidden`            | Request blocked (missing right for this user) |
| 404  | —                      | Resource not found                            |
| 405  | `notImplemented`       | BLE admin token on non-BLE box                |
| 409  | `ongoingCommand`       | Concurrent command on vehicle                 |
| 410  | `carConnectionProblem` | Box unreachable                               |
| 422  | `excessiveCancelation` | Too many booking attempts                     |
| 424  | `invalidTripUseState`  | Box rejected action (bad state)               |
| 424  | `conditionNotMatch`    | Precondition not fulfilled                    |
| 426  | `noBox`                | Vehicle not remotely manageable               |
| 429  | —                      | Rate limit                                    |
| 500  | `unexpectedError`      | Platform malfunction                          |
| 504  | —                      | Request timeout (no JSON body)                |

---

## Data Model Summary

| Resource                 | Description                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| **USER**                 | Physical person (name, login, birthdate). Root resource. 1-2 profiles.                         |
| **ROLE**                 | User role — default customer. `manager` = full BO access.                                      |
| **PROFILE**              | Personal (mandatory) or Business (optional) — linked to Entity                                 |
| **ENTITY**               | Payment method container; Personal (1 profile) or Business (N profiles)                        |
| **WALLET**               | System credits (amount + validity) owned by entity                                             |
| **SERVICE-REGISTRATION** | Profile↔Service link — `Approved`/`Incomplete`/`Pending`/`Suspended`/`Rejected`/`Unregistered` |
| **DOCUMENT / FILE**      | ID/license files attached to user                                                              |
| **SERVICE**              | Mobility service (FF, RT, SB) with zones, POIs, pricing                                        |
| **ZONE**                 | `Allowed`, `Forbidden`, or `Parking` area                                                      |
| **STATION**              | Drop-off = POI + Zone + vehicles                                                               |
| **VEHICLE**              | Bookable vehicle (Model + Options)                                                             |
| **TRIP**                 | User profile + vehicle + service + pricing                                                     |
| **BOOKING-REQUEST**      | Scheduled booking (model/station/dates)                                                        |
| **PRICING**              | Strategy per service/model/vehicle                                                             |
| **PRODUCT**              | Billable item                                                                                  |
| **MOBILITY-PLAN**        | Subscription with discounts                                                                    |
| **CITY**                 | Group of services in same area                                                                 |

---

## Usage notes

- **Fleet ID:** `fleetId` scopes all resources; a widget gets it from the BO context
  (`bo.getContext()`), never hard-codes it
- **Services behind the gateway:** `user/`, `business/`, `fleetmanager/public/`, `notifier/`,
  `pdf/`, or none (each endpoint's `authFetch path` says which)
- **Pagination default:** `page=0`, `size=50` (fleet manager vehicles: at most 2000 per page)
- **Swagger vs. behaviour:** the swagger documents the contract, not always the implementation:
  check the actual response when a field is missing or a status is unexpected
