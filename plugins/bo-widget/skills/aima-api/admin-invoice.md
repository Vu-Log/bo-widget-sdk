# AIMA Admin Invoice API Endpoints

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> Schema names in backticks are described in `schemas.md`.

## admin-invoice (63 endpoints)

### GET `/billing/by-service/fleets/{fleetId}/entity/{entityId}/balance`
return the balance for a entity

This endpoint returns the last computed balance for an entity. The balance is the amount the entity has remaining to pay

authFetch path: `user/billing/by-service/fleets/{fleetId}/entity/{entityId}/balance` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `entityId`: any (required) — The entityId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Balance`, `400` → `Balance`, `404` → `Balance`

### GET `/billing/by-service/fleets/{fleetId}/entity/{entityId}/invoices/tripDetails`
Return the balance and trip details of an entity

This endpoint will return the balance information of an entity, within you will find the details of the trips the entity did, with the amounts, the trip specific details (invoice, duration, vehicle, etc...)

authFetch path: `user/billing/by-service/fleets/{fleetId}/entity/{entityId}/invoices/tripDetails` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `entityId`: any (required) — entityId

**Query params:**
- `startDate`: any (required) — start of the range
- `endDate`: any (required) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`, `400` → `BilledFullInvoicesBalanceDTO`, `404` → `BilledFullInvoicesBalanceDTO`

### GET `/billing/by-service/fleets/{fleetId}/trips/{tripId}/invoiceDetails`
Get the trip details given a fleetId and an tripIdGet the trip details given a fleetId and an tripId

This endpoint retrieves all the invoice details associated with a trip

authFetch path: `user/billing/by-service/fleets/{fleetId}/trips/{tripId}/invoiceDetails` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: any (required) — The fleetId of your account
- `tripId`: any (required) — The tripId linked to the invoice to retrieve

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`

### POST `/billing/fleets/{fleetId}/bulk-invoices/handle-event`
callback from payment gateway to complete bulk invoice flow

authFetch path: `user/billing/fleets/{fleetId}/bulk-invoices/handle-event` (base path `/boapi/proxy/user`)

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

**Responses:** `200` → `string`

### POST `/billing/fleets/{fleetId}/bulk/productInvoices`
upload List products for creating invoices

authFetch path: `user/billing/fleets/{fleetId}/bulk/productInvoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `simulation`: boolean (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `object`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| csvFile | string (binary) | yes |  |

**Responses:** `200` → `string`

### GET `/billing/fleets/{fleetId}/bulk/{bulkInvoiceReferenceId}/invoices`
Get the list of invoices id related to a bulkInvoiceReferenceId

authFetch path: `user/billing/fleets/{fleetId}/bulk/{bulkInvoiceReferenceId}/invoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `bulkInvoiceReferenceId`: string (required) — The bulkInvoiceReferenceId

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`, `404` → `string[]`

### GET `/billing/fleets/{fleetId}/business/instant/entities/{entityId}/invoices/tripDetails`
Return the balance and instant invoice trip details of a business entity

This endpoint will return the balance information of a business entity, within you will find the details of the instant invoice trips the entity did, with the amounts, the trip specific details (invoice, duration, vehicle, etc...)

authFetch path: `user/billing/fleets/{fleetId}/business/instant/entities/{entityId}/invoices/tripDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Query params:**
- `startDate`: string (required) — start of the range
- `endDate`: string (required) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`, `400` → `BilledFullInvoicesBalanceDTO`, `404` → `BilledFullInvoicesBalanceDTO`

### GET `/billing/fleets/{fleetId}/businessInvoices`
Get all the business invoices of a given entity

This endpoint retrieves all the business invoices associated with a given entity

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `entityIds`: string (optional) — The entityIds of your account
- `fromDate`: string (optional) — start of the range
- `toDate`: string (optional) — end of the range
- `fromUpdateDate`: string (optional) — start of the range
- `toUpdateDate`: string (optional) — end of the range
- `fromAmount`: BigDecimal (optional) — The minimum amount of the invoice to filter by
- `toAmount`: BigDecimal (optional) — The maximum amount of the invoice to filter by
- `type`: string (optional) — The type of business invoices to filter by (TRIP or PRODUCT)
- `statuses`: string (optional) — invoice status
- `page`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `IncludeNonNull[]`

### POST `/billing/fleets/{fleetId}/businessInvoices/type/{typeId}/pdf/generate`
Bulk re-generate Cumulative B2B invoice PDFs

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices/type/{typeId}/pdf/generate` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `typeId`: string: `INVOICE`, `REFUND_NOTE`, `CREDIT_NOTE` (required)

**Query params:**
- `reason`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200`, `400`

### PUT `/billing/fleets/{fleetId}/businessInvoices/{id}/externalPayment`
Flag a business invoices as paid externally

This endpoint will move the business invoice status to PAID, and set it as paid externally

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices/{id}/externalPayment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The id of the business invoice to be updated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ManualInvoiceUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| notes | string | no | The note for a manual invoice update |
| requesterId | string | yes | The id of the user making the update request |
| paymentMethod | string | yes | The mean of payment used |

**Responses:** `200` → `InvoiceCumulative`

### POST `/billing/fleets/{fleetId}/businessInvoices/{id}/status/{status}`
Update the status of an business invoice

This endpoint will update the status of a given business invoicesbut cancel an invoice with payment in progress is forbidden

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices/{id}/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The id of the business invoice to be updated
- `status`: string (required) — The new status of the invoices

**Query params:**
- `forcedNbAttempts`: Integer (optional) — The value you want to set in the invoice attempts

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `InvoiceCumulative`

### GET `/billing/fleets/{fleetId}/businessInvoices/{invoiceId}/creditNote`
return the credit note for a invoiceId

This endpoint returns the PDF version of the credit of an invoice

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices/{invoiceId}/creditNote` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `200` → `string (byte)`, `400` → `string (byte)`, `404` → `string (byte)`

### POST `/billing/fleets/{fleetId}/businessInvoices/{invoiceId}/type/{typeId}/pdf/generate`
Re-generate a single Cumulative B2B invoice PDF

authFetch path: `user/billing/fleets/{fleetId}/businessInvoices/{invoiceId}/type/{typeId}/pdf/generate` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)
- `typeId`: string: `INVOICE`, `REFUND_NOTE`, `CREDIT_NOTE` (required)

**Query params:**
- `reason`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### GET `/billing/fleets/{fleetId}/entities/{entityIds}/businessInvoices`
Get all the business invoices of a given entity

This endpoint retrieves all the business invoices associated with a given entity

authFetch path: `user/billing/fleets/{fleetId}/entities/{entityIds}/businessInvoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityIds`: string (required) — The entityIds of your account

**Query params:**
- `fromDate`: string (optional) — start of the range
- `toDate`: string (optional) — end of the range
- `fromUpdateDate`: string (optional) — start of the range
- `toUpdateDate`: string (optional) — end of the range
- `fromAmount`: BigDecimal (optional) — The minimum amount of the invoice to filter by
- `toAmount`: BigDecimal (optional) — The maximum amount of the invoice to filter by
- `type`: string (optional) — The type of business invoices to filter by (TRIP or PRODUCT)
- `statuses`: string (optional) — invoice status
- `page`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `InvoiceCumulativeDTO[]`

### GET `/billing/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceCumulativeId}/products`
Get an aggregated business invoice (for the products) by id

This endpoint will retrieve the products details associated with a business invoice (CSV format)

authFetch path: `user/billing/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceCumulativeId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — The entityId of your account
- `invoiceCumulativeId`: string (required) — The id of the business invoice to be updated

**Query params:**
- `page`: Pageable (required)
- `columns`: string[] (optional) — list of column names to be exported (order will be also applied)
- `cursor`: InstantRangeCursorRequestString (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AccountingBusinessProductDTO[]`

### GET `/billing/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceCumulativeId}/trips`
Get an aggregated business invoice (for the trips) by id

This endpoint will retrieve the trips details associated with a business invoice (CSV format)

authFetch path: `user/billing/fleets/{fleetId}/entities/{entityId}/businessInvoices/{invoiceCumulativeId}/trips` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — The entityId of your account
- `invoiceCumulativeId`: string (required) — The id of the business invoice to be updated

**Query params:**
- `page`: Pageable (required)
- `columns`: string[] (optional) — list of column names to be exported (order will be also applied)
- `cursor`: InstantRangeCursorRequestString (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AccountingBusinessTripDTO[]`

### POST `/billing/fleets/{fleetId}/entities/{entityId}/wallets`
create a wallet for an entity

authFetch path: `user/billing/fleets/{fleetId}/entities/{entityId}/wallets` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `WalletRequestDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| current amount in the wallet | number | no | Relevant only for CREDITS. Current amount in the wallet can be negative |
| date when an amount is added  | string (date-time) | yes | date when an amount is added |
| expiration date  | string (date-time) | no | expiration date |
| notes | string | no | Notes about the given system credits |
| current percentage in the wallet  | number | no | current percentage in the wallet cannot be negative |
| cappedPercentage | number | no | Maximum discount limit for percentage-based calculations, The value must be positive and is expressed in monetary units, not as a percentage.PromocodeConstants… |
| discountCategory | string: `CREDITS`, `PERCENTAGE` | yes | wallet category discount |
| oneTimeUsage | boolean | no | if this wallet is considered for one usage only |
| Id used to identify a product group | string | no | Id used to identify a product group, it can be null in case a wallet can be used to pay all kinds of products |
| type | string: `LOCAL`, `GLOBAL`, `PERIODIC` | yes | wallet type |
| usage | string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL` | yes | wallet use for |

**Responses:** `201` → `WalletResponseDTO`, `400` → `WalletResponseDTO`

### GET `/billing/fleets/{fleetId}/entity/{entityId}/balance`
return the balance for a entity

This endpoint returns the last computed balance for an entity. The balance is the amount the entity has remaining to pay

authFetch path: `user/billing/fleets/{fleetId}/entity/{entityId}/balance` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — The entityId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Balance`, `400` → `Balance`, `404` → `Balance`

### GET `/billing/fleets/{fleetId}/entity/{entityId}/invoices/tripDetails`
Return the balance and trip details of an entity

This endpoint will return the balance information of an entity, within you will find the details of the trips the entity did, with the amounts, the trip specific details (invoice, duration, vehicle, etc...)

authFetch path: `user/billing/fleets/{fleetId}/entity/{entityId}/invoices/tripDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `entityId`: string (required) — entityId

**Query params:**
- `startDate`: string (required) — start of the range
- `endDate`: string (required) — end of the range

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`, `400` → `BilledFullInvoicesBalanceDTO`, `404` → `BilledFullInvoicesBalanceDTO`

### POST `/billing/fleets/{fleetId}/giftcards`
Bill a gift card product

This endpoint allows to charge a gift card product

authFetch path: `user/billing/fleets/{fleetId}/giftcards` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BillGiftCardInputDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | no | The id of the product |
| userId | string | yes | The id of the user charged |
| entityId | string | yes | The id of the entity charged |
| originId | string | yes | The id of the user charging the product |
| giftCard | GiftCard | yes | extra information carried for a product type GIFT_CARD |
| notes | string | no | The notes about the gift card |

**Responses:** `201` → `string`, `400` → `InvoiceDTO`, `404` → `InvoiceDTO`, `409` → `InvoiceDTO`

### GET `/billing/fleets/{fleetId}/invoices`
Get the list of billed Invoices for the given fleet and between the given dates (max 1 month)

This endpoint retrieves all the billed invoices for a fleet, between two dates. It can be filtered by the invoice creation date range and/or last update range, in both case the maximum range is 1 month. It is possible to filter the results by Invoice Status, minimum or maximum invoice amount. WARNI…

authFetch path: `user/billing/fleets/{fleetId}/invoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Query params:**
- `startDate`: string (required) — start of the range
- `endDate`: string (optional) — end of the range
- `creationStart`: string (optional) — Start range for creation date
- `creationEnd`: string (optional) — End range for creation date
- `updateStart`: string (optional) — Start range for update date
- `updateEnd`: string (optional) — End range for update date
- `invoicesStatus`: string (optional) — The status of the invoices to retrieve
- `minAmount`: BigDecimal (optional) — The minimum amount of the invoice to filter by
- `maxAmount`: BigDecimal (optional) — The maximum amount of the invoice to filter by
- `disableCount`: Boolean (optional)
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `AccountingBilledInvoiceDto[]`, `400` → `AccountingBilledInvoiceDto[]`, `404` → `AccountingBilledInvoiceDto[]`

### POST `/billing/fleets/{fleetId}/invoices/handle-event`
callback from payment gateway to complete business invoice flow

authFetch path: `user/billing/fleets/{fleetId}/invoices/handle-event` (base path `/boapi/proxy/user`)

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

**Responses:** `200` → `string`

### POST `/billing/fleets/{fleetId}/invoices/product`
Bill a non-trip related product

This endpoint allows to charge a product outside of a trip to a user

authFetch path: `user/billing/fleets/{fleetId}/invoices/product` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `BillProductInputDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | yes | The id of the product |
| serviceId | string | no | The id of the service for billing |
| amount | number | yes | The amount of the product |
| userId | string | yes | The id of the user charged |
| entityId | string | yes | The id of the entity charged |
| subscriptionId | string | no | The subscription id linked to the product, can be null |
| productNotes | string | no | The notes about the product |
| originId | string | yes | The id of the user charging the product |
| chargeProductRequestId | string | no | The id of the charge product request |
| additionalInfo | BillProductAdditionalInfo | no |  |

**Responses:** `201` → `string`, `400` → `InvoiceDTO`, `404` → `InvoiceDTO`, `409` → `InvoiceDTO`

### GET `/billing/fleets/{fleetId}/invoices/status/{status}`
Retrieve all invoices filtered by status

This endpoint retrieves all the invoices of a fleet filtered by their status

authFetch path: `user/billing/fleets/{fleetId}/invoices/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required) — The status of the invoices to retrieve

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Invoice[]`

### PUT `/billing/fleets/{fleetId}/invoices/status/{status}`
Batch update the status of a list of invoices

This endpoint update the status of a list of invoices. The PAID status is forbidden (use payExternal endpoint). Also some transition are forbidden (see Invoice transition Diagram) Also cancel an invoice with payment in progress is forbidden

authFetch path: `user/billing/fleets/{fleetId}/invoices/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `status`: string (required) — The status of the invoices to retrieve

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `any[]`

**Responses:** `200` → `integer (int32)`, `400` → `integer (int32)`

### GET `/billing/fleets/{fleetId}/invoices/statusHistory`
Get all the status changes for each invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/statusHistory` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of the wanted invoices

**Query params:**
- `createStart`: string (optional) — the creation date start parameter
- `createEnd`: string (optional) — the creation date end parameter
- `updateStart`: string (optional) — the update date start parameter
- `updateEnd`: string (optional) — the update date end parameter
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `InvoiceHistoryByStatusesDTO[]`, `400` → `InvoiceHistoryByStatusesDTO[]`

### POST `/billing/fleets/{fleetId}/invoices/type/{typeId}/pdf/generate`
Bulk re-generate B2C or Instant B2B invoice PDFs

authFetch path: `user/billing/fleets/{fleetId}/invoices/type/{typeId}/pdf/generate` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `typeId`: string: `INVOICE`, `REFUND_NOTE`, `CREDIT_NOTE` (required)

**Query params:**
- `reason`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `string[]`

**Responses:** `200`, `400`

### POST `/billing/fleets/{fleetId}/invoices/{id}/payment`
Manually execute a payment related to an Invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/{id}/payment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ManualPaymentDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| online | boolean | no | true to specify that the shopper is online |
| scope | string: `DEPOSIT`, `RENTAL` | yes | return url passed to the payment provider, used at the end of a 3ds flow |
| amountType | string: `FIXED,PERCENTAGE` | no | Payment amount type, can be a fixed amount of a percentage |
| amountValue | number | no | amount that must override the payment parameter configuration (can be a percentage of a fixed value depending on installed configuration) |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |

**Responses:** `200` → `InvoiceDTO`

### POST `/billing/fleets/{fleetId}/invoices/{id}/status/{status}`
Update the status of an invoice

Update an existing invoice with a given status. The PAID status is forbidden (use payExternal endpoint).Also some transition are forbidden (see Invoice transition Diagram). Also cancel an invoice with payment in progress is forbidden, Finally it is also possible to update the number of attempts don…

authFetch path: `user/billing/fleets/{fleetId}/invoices/{id}/status/{status}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The invoice id to be updated
- `status`: string (required) — The status of the invoices to retrieve

**Query params:**
- `forcedNbAttempts`: Integer (optional) — The value you want to set in the invoice attempts

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `integer (int32)`, `400` → `Invoice`, `403` → `Invoice`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}`
return the invoice for an invoiceId

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Invoice`, `400` → `Invoice`, `404` → `Invoice`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/audit`
Get the histories of invoice status by invoiceId

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/audit` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `InvoiceStatusHistory[]`, `404` → `InvoiceStatusHistory[]`

### PUT `/billing/fleets/{fleetId}/invoices/{invoiceId}/cancel`
Perform a cancellation attempt on a pending or refused invoice

This endpoint will switch the status of an invoice (currently in PENDING or REFUSED status) to CANCELLED, cancel an invoice with payment in progress is forbidden

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/cancel` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Invoice`

### POST `/billing/fleets/{fleetId}/invoices/{invoiceId}/clear-payment`
clear payment_in_progress flag

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/clear-payment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The invoiceId of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `400` → `InvoiceDTO`, `404` → `InvoiceDTO`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/creditNote`
return the credit note for a invoiceId

This endpoint returns the PDF version of the credit of an invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/creditNote` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `StreamingResponseBody`, `400` → `StreamingResponseBody`, `404` → `StreamingResponseBody`

### PUT `/billing/fleets/{fleetId}/invoices/{invoiceId}/externalPayment`
Update the invoice to Paid, because was paid outside of the system (manually)

This endpoint is used to update an invoice after it was paid by a mean external to our system (Cash, Wire tranfert or other)

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/externalPayment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ManualInvoiceUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| notes | string | no | The note for a manual invoice update |
| requesterId | string | yes | The id of the user making the update request |
| paymentMethod | string | yes | The mean of payment used |

**Responses:** `200` → `string`, `400` → `Invoice`, `404` → `Invoice`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/pdf`
return the PDF for a invoiceId

This endpoint retrieve the PDF version of an invoice, given by its id

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/pdf` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `200` → `string (byte)`, `400` → `string (byte)`, `404` → `string (byte)`

### POST `/billing/fleets/{fleetId}/invoices/{invoiceId}/refund`
Perform a refund attempt with an user-specified amount

This endpoint attempts a refund, meaning the process of refund is launched. The payment provider isasked to refund the given amount

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/refund` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `RefundAmountDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | no | Amount to refund |
| note | string | no | Note related to the refund |
| refundItems | RefundItemDTO[] | no | lines selected by the operator to refund, each as a natural ref (echoed from GET .../refundableAmount) plus the TTC amount to refund. When present, drives the… |
| paymentIntentPspReference | string | no | Payment Intent psp reference |

**Responses:** `200` → `string`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/refundNote`
return the refund note for a invoiceId

This endpoint returns the PDF version of the refund of an invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/refundNote` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Query params:**
- `paymentRefundPspReference`: string (optional) — The psp reference of the refund

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `200` → `StreamingResponseBody`, `400` → `StreamingResponseBody`, `404` → `StreamingResponseBody`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/refundableAmount`
Get the max amount that can be refunded on an invoice

This endpoint return the maximum amount refundable for an invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/refundableAmount` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The id of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `RefundableAmountDTO`

### POST `/billing/fleets/{fleetId}/invoices/{invoiceId}/retry-payment`
Retry an invoices payment stuck in REFUSED and ERROR status, move the status to PENDING or PENDING_MANUAL_PAYMENT

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/retry-payment` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The invoiceId of the invoice

**Header params:**
- `x-boapi-ctx`: string (optional)

**Responses:** `400` → `InvoiceDTO`, `404` → `InvoiceDTO`

### GET `/billing/fleets/{fleetId}/invoices/{invoiceId}/tripDetails`
Get trip details by fleet id and invoice id

This endpoint retrieves the trip details for a given invoice

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/tripDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `invoiceId`: string (required) — The invoiceId to be retrieved

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`, `400` → `BilledFullInvoicesBalanceDTO`

### POST `/billing/fleets/{fleetId}/invoices/{invoiceId}/type/{typeId}/pdf/generate`
Re-generate a single B2C or Instant B2B invoice PDF

authFetch path: `user/billing/fleets/{fleetId}/invoices/{invoiceId}/type/{typeId}/pdf/generate` (base path `/boapi/proxy/user`)

**Auth:** needs a user token.

**Path params:**
- `fleetId`: string (required)
- `invoiceId`: string (required)
- `typeId`: string: `INVOICE`, `REFUND_NOTE`, `CREDIT_NOTE` (required)

**Query params:**
- `reason`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200`, `400`

### POST `/billing/fleets/{fleetId}/trips/{tripId}`
Update a suspicious trip durations or length

When a trip is marked as suspicious, it is not billed. This endpoint is used to update the trip durations and fix any error that might have happen to the trip

authFetch path: `user/billing/fleets/{fleetId}/trips/{tripId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — The trip to be updated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `ModifyTripDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pauseDuration | number | yes | The duration of the stop over part of the trip |
| bookingDuration | number | yes | The duration of the booking part of the trip |
| drivingDuration | number | yes | The duration of the driving part of the trip |
| notes | string | no | Notes related to the trip |

**Responses:** `200` → `string`, `400` → `string`, `404` → `string`

### GET `/billing/fleets/{fleetId}/trips/{tripId}/invoiceDetails`
Get the trip details given a fleetId and an tripIdGet the trip details given a fleetId and an tripId

This endpoint retrieves all the invoice details associated with a trip

authFetch path: `user/billing/fleets/{fleetId}/trips/{tripId}/invoiceDetails` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — The tripId linked to the invoice to retrieve

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`

### GET `/billing/fleets/{fleetId}/trips/{tripId}/invoices`
Get all invoices by tripId and fleetId

authFetch path: `user/billing/fleets/{fleetId}/trips/{tripId}/invoices` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `tripId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `BilledFullInvoicesBalanceDTO`, `400` → `BilledFullInvoicesBalanceDTO`

### POST `/billing/fleets/{fleetId}/trips/{tripId}/triggerBilling`
trigger billing for a suspicious trip

This endpoint trigger the billing for a trip. For example, if a trip is suspicious, it will not be triggered until this endpoint is called

authFetch path: `user/billing/fleets/{fleetId}/trips/{tripId}/triggerBilling` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `tripId`: string (required) — The trip to be updated

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string`, `400` → `Invoice`, `404` → `Invoice`

### POST `/billing/fleets/{fleetId}/user/{userId}/entity/{entityId}/invoices/payAll`
Retry all invoices payment stuck in REFUSED and ERROR status, move the status to PENDING or PENDING_MANUAL_PAYMENT

authFetch path: `user/billing/fleets/{fleetId}/user/{userId}/entity/{entityId}/invoices/payAll` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `userId`: string (required) — The userId linked to the entity
- `entityId`: string (required) — The entityId to pay all the invoices

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `400` → `string`, `404` → `string`

### GET `/billing/fleets/{fleetId}/wallet/entity/{entityId}`
return all wallets by entity id

authFetch path: `user/billing/fleets/{fleetId}/wallet/entity/{entityId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `entityId`: string (required)

**Query params:**
- `available`: boolean (optional)
- `usage`: string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL`[] (optional)
- `discountCategory`: string: `CREDITS`, `PERCENTAGE`[] (optional)
- `type`: string: `LOCAL`, `GLOBAL`, `PERIODIC`[] (optional)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `WalletResponseDTO[]`

### PATCH `/billing/fleets/{fleetId}/wallets/{walletId}`
Update wallet available amount or percentage

The body must be an array of 1 element with<br><br>`op:replace`, `path` is `/percentage` or `/availableAmount` and `value` the new value with a point (`.`) and not a comma (`,`).<br><br> E.g. `[{"op":"replace", "path":"/percentage", "value":"20.05"}]` or `[{"op":"replace", "path":"/availableAmount"…

authFetch path: `user/billing/fleets/{fleetId}/wallets/{walletId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `walletId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `JsonPatch`

**Responses:** `200` → `WalletResponseDTO`, `400` → `WalletResponseDTO`, `403` → `WalletResponseDTO`, `404` → `WalletResponseDTO`

### GET `/fleets/{fleetId}/pricing/timeranges`
get all TimeRanges for a fleet

authFetch path: `user/fleets/{fleetId}/pricing/timeranges` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Query params:**
- `pageable`: Pageable (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TimeRangeDto[]`, `404` → `TimeRangeDto[]`

### GET `/fleets/{fleetId}/taxes`
Get all taxes by fleetId

This endpoint retrieves all the taxes of fleet

authFetch path: `user/fleets/{fleetId}/taxes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TaxDTO[]`, `404` → `TaxDTO[]`

### POST `/fleets/{fleetId}/taxes`
Create a Tax

Create a new tax in the system

authFetch path: `user/fleets/{fleetId}/taxes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `TaxCreateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | yes | The name of the tax |
| taxRate | number | yes | The rate of the tax |
| zones | string[] | no |  |

**Responses:** `201` → `TaxDTO`, `400` → `TaxDTO`, `403` → `TaxDTO`

### GET `/fleets/{fleetId}/taxes/zones`
Get all the zoneIds for a fleet

authFetch path: `user/fleets/{fleetId}/taxes/zones` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `Zone[]`

### POST `/fleets/{fleetId}/taxes/{id}`
Update Tax

This endpoint is used to update an exiting tax. Tax is look up by its Id

authFetch path: `user/fleets/{fleetId}/taxes/{id}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `id`: string (required) — The tax id of the tax to update

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Request body:** `TaxUpdateDTO`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxRate | number | yes | The new tax rate to set to the existing tax |
| taxName | string | yes | The new tax name to set to the existing tax |

**Responses:** `200` → `TaxDTO`, `404` → `TaxDTO`

### GET `/fleets/{fleetId}/taxes/{taxId}`
Get tax by id

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}` (base path `/boapi/proxy/user`)

**Path params:**
- `taxId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TaxDTO`, `404` → `TaxDTO`

### DELETE `/fleets/{fleetId}/taxes/{taxId}`
Delete the Tax by TaxId from Tax table (remove association as well)

This endpoint deletes a tax, it also removes it from all the associated products

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `taxId`: string (required) — The taxId to be associated with the product

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`, `404` → `string`

### GET `/fleets/{fleetId}/taxes/{taxId}/products`
Get all tax products by taxId

This endpoint retrieves all product associated with a specific tax

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `taxId`: string (required) — The taxId associated with the products

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `ProductDTO | CancellationPolicyResponseDTO[]`, `404` → `ProductDTO | CancellationPolicyResponseDTO[]`

### DELETE `/fleets/{fleetId}/taxes/{taxId}/products`
Dissociate Tax and all related Products by taxId

This endpoint dissociated all the product to the given tax

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/products` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `taxId`: string (required) — The taxId to be associated with the product

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`

### DELETE `/fleets/{fleetId}/taxes/{taxId}/products/{productId}`
Dissociate Tax from Product by taxId and productId

This endpoint detach a tax from a specific product

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/products/{productId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required) — The fleetId of your account
- `taxId`: string (required) — The taxId to be dissociated with the product
- `productId`: string (required) — The productId to be dissociated with the tax

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`

### GET `/fleets/{fleetId}/taxes/{taxId}/zones`
Get all zones by taxId

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/zones` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `taxId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `string[]`, `404` → `string[]`

### PUT `/fleets/{fleetId}/taxes/{taxId}/zones/{zoneId}`
Associate a Zone to a Tax

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/zones/{zoneId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `zoneId`: string (required)
- `taxId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`, `404` → `string`, `409` → `string`

### DELETE `/fleets/{fleetId}/taxes/{taxId}/zones/{zoneId}`
Unlink a Zone from a Tax

authFetch path: `user/fleets/{fleetId}/taxes/{taxId}/zones/{zoneId}` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `zoneId`: string (required)
- `taxId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `204` → `string`, `404` → `string`

### GET `/fleets/{fleetId}/zones/{zoneId}/taxes`
Get all taxes by zoneId

authFetch path: `user/fleets/{fleetId}/zones/{zoneId}/taxes` (base path `/boapi/proxy/user`)

**Path params:**
- `fleetId`: string (required)
- `zoneId`: string (required)

**Header params:**
- `x-boapi-ctx`: string (optional) — the boapi context

**Responses:** `200` → `TaxDTO[]`, `404` → `TaxDTO[]`
