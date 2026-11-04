# AIMA API Schemas

> Generated from the AIMA swagger by `scripts/aima-api/generate.mjs` — do not edit by hand.
> First-level fields only: follow the type names to go deeper. Search with `### <SchemaName>`.

### AccountingBilledInvoiceDto
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelId | string | no | The id of the vehicle model used for the trip |
| product | AccountingBilledProductDTO | no | The details about the products |
| tripBillingBreakdown | BillingBreakdownTripDTO | no | The details about the trip amounts |
| rideTaxName | string | no | The name of the tax for the ride part of the trip (for trip invoices only) |
| rideTaxRate | number | no | The rate of the tax for the ride part of the trip (for trip invoices only) |
| serviceId | string | no | The id of the service used to make a trip (for trip invoices only) |
| cityId | string | no | The id of the city where the trip was done (for trip invoices only) |
| taxesPerRate | object | no | The list of taxes regroup under tax name and tax name |
| totalTaxAmount | number | yes | The total amount of the taxes (cumulated) |
| totalWithTax | number | yes | The total amount with taxes included |
| totalWithoutTax | number | yes | The total amount with taxes excluded |
| trip | AccountingTripDTO | yes | The details about the trip |
| vehiculeModelName | string | yes | The vehicle model name |
| vehiculePlate | string | yes | The vehicle plate number |
| taxAmountForBillingGroupDiscount | number | yes | The tax amount of the billing group discount |
| taxAmountForBooking | number | yes | The tax amount of the booking part of the trip |
| taxAmountForCancellationFee | number | yes | The tax amount of the cancellation fee |
| taxAmountForDriving | number | yes | The tax amount of the driving part of the trip |
| taxAmountForEndZoneFee | number | yes | The tax amount of the end zone fee |
| taxAmountForScheduleTripFee | number | yes | The tax amount of the schedule trip fee |
| taxAmountForStartZoneFee | number | yes | The tax amount of the start zone fee |
| taxAmountForStopover | number | yes | The tax amount of the stop over part of the trip |
| taxAmountForTripSystemCredit | number | yes | The tax amount of the system credits used to pay the trip part of the invoice |
| taxAmountForOvermileage | number | yes | The tax amount of the overmileage part of the trip |
| taxInitialTotalAmount | number | yes | The tax amount of the total of invoice before any discount is applied |
| taxAmountForDamageWaiverFee | number | yes | The tax amount of the damage waiver fee |
| netJourney | number | yes | The net amount of the journey |
| taxJourney | number | yes | The tax amount of the journey |
| grossJourney | number | yes | The gross amount of the journey |
| durationJourney | number | yes | The duration of the journey |
| finalAmount | number | no | The final amount of the invoice considering the refund |
| mopStatus | string | yes | The status of the user mean of payment (MOP) |
| taxRemainingToBePaid | number | yes | The remaining total amount of the taxes to be paid |
| grossRemainingToBePaid | number | yes | The remaining total amount with taxes included to be paid |
| netRemainingToBePaid | number | yes | The remaining total amount with taxes excluded to be paid |
| withTaxAmoountForCancellationFee | number | no |  |
| distanceUnit | string: `KM`, `MILES` | yes | The unit of distance used (KM, Miles) |
| invoice | AccountingInvoiceDTO | yes | The accounting details of the invoice |
| grossAmountForBillingGroupDiscount | number | yes | The gross amount of the billing group discount |
| grossAmountForBooking | number | yes | The gross amount of thebooking part of the trip |
| grossAmountForCancellationFee | number | yes | The gross amount of the cancellation |
| grossAmountForDriving | number | yes | The gross amount of the driving part of the trip |
| grossAmountForEndZoneFee | number | yes | The gross amount of the end zone fee |
| grossAmountForScheduleTripFee | number | yes | The gross amount of the schedule trip fee |
| grossAmountForStartZoneFee | number | yes | The gross amount of the start zone fee |
| grossAmountForStopover | number | yes | The gross amount of the stop over part of the trip |
| grossAmountForTripSystemCredit | number | yes | The gross amount of the system credits used for the trip part of the billing |
| grossAmountForRide | number | yes | The gross amount of ride (sum of the booking, driving, stop over and overmileage) |
| grossAmountForOvermileage | number | yes | The gross amount of the overmileage part of the trip |
| grossInitialTotalAmount | number | yes | The gross amount of the trip before any discounts |
| grossAmountForRefund | number | yes | The gross amount of the refund |
| grossAmountForUnlockFee | number | yes | The gross amount of unlock fee |
| grossAmountForDamageWaiverFee | number | yes | The gross amount of unlock fee |
| netAmountForBillingGroupDiscount | number | yes | The net amount of the billing group discount |
| netAmountForBooking | number | yes | The net amount of the booking part of the trip |
| netAmountForCancellationFee | number | yes | The net amount of the cancellation fee |
| netAmountForDriving | number | yes | The net amount of the driving part of the trip |
| netAmountForEndZoneFee | number | yes | The net amount of the end zone fee |
| netAmountForScheduleTripFee | number | yes | The net amount of the schedule trip fee |
| netAmountForStartZoneFee | number | yes | The net amount of the start zone fee |
| netAmountForStopover | number | yes | The net amount of the stop over part of the trip |
| netAmountForTripSystemCredit | number | yes | The net amount of the system credits used for the trip |
| netAmountForRide | number | yes | The net amount of the ride (sum of the booking, driving, stop over and overmileage) |
| netAmountForOvermileage | number | yes | The net amount of the overmileage part of the trip |
| netInitialTotalAmount | number | yes | The net amount of the invoice before any discount is applied |
| netAmountForUnlockFee | number | yes | The net amount of the unlock fee |
| netAmountForDamageWaiverFee | number | yes | The net amount of the damage waiver fee |
| taxAmountForRide | number | yes | The tax amount of the ride (sum of the booking, driving, stop over and overmileage) |
| taxAmountForUnlockFee | number | yes | The tax amount of the unlock fee |

### AccountingBilledProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | yes | The product id |
| productName | string | yes | The product name |
| productType | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes | Product type |
| taxName | string | yes | The product tax name, can be null |
| taxRate | number | yes | The product tax rate, can be null |
| taxes | Tax[] | yes | The product list of taxes |
| productBillingBreakdown | BillingBreakdownProductDTO | no | The details of the products |
| totalTaxAmount | number | no | The total amount of the taxes (cumulated) |
| totalWithTax | number | no | The total amount with the taxes included |
| totalWithoutTax | number | no | The total amount with the taxes excluded |
| productNotes | string | no | The notes about the product |

### AccountingBusinessProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | The product name |
| chargeDate | string (date-time) | yes | The date the product was charged |
| id | string | yes | The product id |
| net | number | yes | The net amount of the product |
| gross | number | yes | The gross amount of the product |
| productNotes | string | no | Charge reason |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | no | Product type |
| taxes | Tax[] | yes | The list of taxes applied to the product amount |

### AccountingBusinessTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleModelName | string | yes | The vehicle model name |
| vehiclePlate | string | yes | The vehicle plate number |
| modelId | string | no | The id of the vehicle model used for the trip |
| serviceId | string | no | The id of the service used to make a trip (for trip invoices only) |
| userId | string | yes | The id of the user linked to the invoice |
| profileId | string | yes | The id of the profile linked to the invoice |
| profileType | string: `Family`, `Business`, `Single`, `ALL` | yes | The type of the profile |
| profileName | string | yes | Profile name of the user who did the trip |
| tripId | string | yes | The id of the trip linked to the invoice, can be null in case of invoice for non-trip related product |
| tripEndDate | string (date-time) | yes | The real end date of the trip |
| theorEndDate | string (date-time) | yes | The theoretical end date of the trip |
| theorStartDate | string (date-time) | yes | The theoretical start date of the trip |
| billingBreakdown | BillingBreakdownTripDTO | no | The details about the trip amounts |
| cityId | string | no |  |
| distance | number | yes | The distance of the trip |
| duration | number | yes | The duration of the trip |
| stopoverDuration | number | yes | The total duration of the stop over part of the trip |
| bookingDuration | number | yes | The total duration of the booking part of the trip |
| tripDuration | number | yes | The total duration of the trip without the booking |
| drivingDuration | number | yes | The total duration of the driving part of the trip |
| tripStartDate | string (date-time) | yes | The real start date of the trip |

### AccountingInvoiceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| userId | string | yes | The id of the user linked to the invoice |
| entityId | string | yes | The id of the entity linked to the invoice |
| profileId | string | yes | The id of the profile linked to the invoice |
| profileType | string: `Family`, `Business`, `Single`, `ALL` | yes | The type of the profile |
| firstName | string | yes | The first name of the user |
| lastName | string | yes | The last name of the user |
| billingAdress | string | yes | The billing address of the user |
| fiscalCode | string | no | The fiscal code of the user |
| paymentRequesterId | string | no | The id of the user who requested a payment externally |
| notes | string | no | Notes about the external payment issued on the invoice |
| invoicesStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's current status |
| currency | string | yes | The invoice currency |
| id | string | yes | The id of the invoice |
| pspName | string | no | The last Payment Service Provider's name used to pay the invoice |
| pspReference | string | yes | The reference of payment of the invoice |
| isRefunded | boolean | no |  |
| isTaxIncluded | boolean | no | Invoice amount is tax included or not |
| amountPayWithSystemCredit | number | no | The amount which has been payed by system credit |
| lastUpdateDate | string (date-time) | no |  |
| cancellationDate | string (date-time) | no |  |
| planId | string | no | If the invoice is related to a plan this field contains the planId |
| period | string: `WEEK`, `MONTH`, `ANNUAL` | no |  |
| expiryDate | string (date-time) | no |  |
| paymentInProgress | boolean | yes | Invoice's payment is on going |
| refundInProgress | boolean | no | Refund of the invoice is in progress |
| refunded | boolean | no |  |
| taxIncluded | boolean | no |  |
| billingDate | string (date-time) | yes | Invoice's creation date |
| paymentDate | string (date-time) | yes | Invoice's payment date |
| reference | string | yes | The number of the invoice refunded for a fleet by year (First invoice of a fleet of a given year will have a refund sequence number equal to 0, the second one… |
| promocode | PromoCodeDTO[] | no | The list of promo codes used to pay this invoice |

### AccountingPdfProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productName | string | yes | Friendly name of the product |
| productType | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes | Product type |
| productWithoutTax | string | yes | The net amount of the product |
| productTaxAmount | string | yes | The tax amount of the product |
| productWithTax | string | yes | The gross amount of the product |
| productTaxName | string | yes | The tax name applied on the product amount |
| productTaxRate | string | yes | The tax name applied on the product amount |
| taxes | Tax[] | yes | The list of taxes applied on the product amount |
| percentage | string | no | In case the product support percentage amount we need a percentage value |
| pricePerHour | string | no | Price per hour |
| pricePerDay | string | no | Price per day |
| pricePerTrip | string | no | Price per trip |
| additionalInfo | BillProductAdditionalInfo | no | Additional Data as linked BookingRequest or Payment |
| occurrences | integer (int32) | no |  |

### AccountingTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| theorEndDate | string (date-time) | yes | The theoretical end date of the trip |
| theorStartDate | string (date-time) | yes | The theoretical start date of the trip |
| tripEndDate | string (date-time) | yes | The real end date of the trip |
| overriddenTripInfo | OverriddenTripInfo | yes | The overridden information about the trip, computed from the edit trip duration |
| tripId | string | yes | The id of the trip linked to the invoice, can be null in case of invoice for non-trip related product |
| vehicleId | string | yes | The id of the vehicle used |
| stationId | string | yes | The StationId if this trip was station based |
| bookingDuration | number | yes | The total duration of the booking part of the trip |
| distance | number | yes | The total distance of the trip |
| drivingDuration | number | yes | The total duration of the driving part of the trip |
| duration | number | yes | The total duration of the trip |
| stopoverDuration | number | yes | The total duration of the stop over part of the trip |
| tripDuration | number | yes | The total duration of the trip without the booking |
| tripStartDate | string (date-time) | yes | The real start date of the trip |

### ActionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | yes | Id of the service which needs to be approved or suspended |
| status | string: `APPROVED`, `PENDING`, `REJECTED`, `INCOMPLETE`, `SUSPENDED` | yes | Status: * APPROVED: the user can book a vehicle of the service * PENDING: the status when the user has just submit his registration (the user cannot book) * RE… |
| reasonForChange | string | no | Reason why the status of the service registration change |

### ActiveSubscriptionBookingRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | yes |  |
| profileId | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| creationDate | string (date-time) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| cityId | string | no |  |
| pricingId | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| journeyId | string | no |  |
| station | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| returnedDate | string (date-time) | no |  |
| products | string[] | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| cancellationDate | string (date-time) | no |  |
| rollingContract | boolean | no |  |
| planDurationInMonths | integer (int32) | no |  |
| planName | string | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| parentId | string | no |  |
| previous | string | no |  |
| bookingReferenceId | string | no |  |

### AddacommenttoticketRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fromUser | string | yes |  |
| message | string | yes |  |

### AddanewticketRequest
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

### AddcategoriesRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| default | object | yes |  |

### AdditionalChargesDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productAmount | number | no |  |
| productId | string | no |  |
| custom | boolean | no |  |

### AdditionalDriverOutputDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | additional driver id generated by the server |
| fleetId | string | no | fleetId |
| bookingRequestId | string | no | booking request id |
| profileId | string | no | ProfileId of the user |
| updateDate | string (date-time) | no | Update/Creation date |
| invitationEmail | string | no | Additional driver email id |
| profileStatus | string | no | Additional driver status |
| userId | string | no | user id of the additional driver |

### AdditionalInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstDriveDelayMinutes | number | no | Duration in minutes between the unlock and the first engine on |
| bookDuration | number | no | See Booking Duration |
| odoStart | number | no | Vehicle's mileage at the start of the trip |
| odoEnd | number | no | Vehicle's mileage at the end of the trip |
| energyLevelStart | number | no | Vehicle's energy level at the start of the trip |
| energyLevelEnd | number | no | Vehicle's energy level at the end of the trip |
| startZones | Zone[] | no | Zones which matched with the vehicle position at the start of the trip |
| endZones | Zone[] | no | Zones which matched with the vehicle position at the end of the trip |
| notes | string | no | Additional information in the form of text (255 chars max) |
| isAutolock | boolean | no | The trip has been ended automatically by the box |
| isCancel | boolean | no | The trip has been cancelled |
| isReleaseOnServer | boolean | no | The trip has been released |
| isBilled | boolean | no | The trip has been invoiced |
| billingInterrupted | boolean | no | The trip billing was interrupted |
| suspicious | boolean | no | The trip is flagged as suspicious. If true this trip will need to be manualy checked before being invoiced. |
| startLocation | Position | no | Vehicle's position at the start of the trip |
| endLocation | Position | no | Vehicle's position at the end of the trip |
| originCancelJourney | string | no | The origin of the cancel if the trip has been canceled |
| overriddenTripInfo | OverriddenTripInfo | no |  |
| freeMinutesDuration | integer (int32) | no |  |
| bypassBookingRequestCompleted | boolean | no |  |
| ignoreOdometer | boolean | no |  |
| suspiciousReason | string | no | If the trip is suspicious, this field explains why |
| startTripEventDate | string (date-time) | no |  |
| durationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | no | Custom trip duration calculation options |
| vehicleGroupId | string | no | The associated vehicle group if any at booking time |
| dstManagement | boolean | no |  |
| timeZone | string | no |  |
| dynamicScore | integer (int32) | no | Dynamic driving score (0-100): safety/smoothness based on harsh acceleration, braking, cornering, speeding. Null when not reported by the vubox. |
| ecoScore | integer (int32) | no | Eco driving score (0-100): energy efficiency from harsh accel/brake patterns, share of stabilized driving, and idling. Null when not reported by the vubox. |
| accelEventCount | integer (int32) | no | Count of harsh acceleration events during the trip. |
| brakeEventCount | integer (int32) | no | Count of harsh braking events during the trip. |
| turnEventCount | integer (int32) | no | Count of harsh cornering events during the trip. |
| idleTotalSec | integer (int32) | no | Cumulative seconds idling (ignition ON, speed < 1 km/h). |

### AddPoiGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddPoiGeoFeature[] | no | should have only 1 element |

### AddPoiGeoFeature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `Feature` | no | Feature type, will be 'Feature' |
| properties | object | no |  |
| geometry | object | no |  |

### AddressDTO
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

### addstatusRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |

### AddZoneGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | AddZoneGeoFeature[] | no | should have only 1 element |

### AddZoneGeoFeature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `Feature` | no | Feature type, will be 'Feature' |
| properties | object | no |  |
| geometry | object | no |  |

### AdjustTripRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| customEndDate | string (date-time) | no | to override trip's end date |
| duration | object | no | to override trip's duration |
| customDiscount | object | no | to apply a specific discount |
| additionalCharges | object | no | to apply a specific discount |

### AllocatedSubscriptionBookingRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | yes |  |
| profileId | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| creationDate | string (date-time) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| cityId | string | no |  |
| pricingId | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| bookingDate | string (date-time) | no |  |
| journeyId | string | no |  |
| station | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| cancellationDate | string (date-time) | no |  |
| returnedDate | string (date-time) | no |  |
| cancelledBy | string | no |  |
| latitude | number (double) | no |  |
| longitude | number (double) | no |  |
| failureReason | string | no |  |
| vehicleResidualValue | number | no |  |
| modelRate | number | no |  |
| products | string[] | no |  |
| completed | boolean | no |  |
| basePrice | number | no |  |

### AssignItemsToClaimDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | no |  |
| items | string[] | no |  |

### AssignZoneRequest
Assign
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | yes | home zone's type (allowed, forbidden, parking or any free text) |
| sticky | boolean | no | optional flag to know if this assignation must persist. Otherwise it will be deleted after the next position refresh. |

### AttachmentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| attachmentUrl | string | no | URL of the resource |
| fileName | string | yes | The original name of the file |

### AvailableVehiclesSubscriptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicles | VehicleWithLockedInfoDTO[] | no |  |
| stationId | string | no |  |

### Balance
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | string | no | The amount of the balance |
| currency | string | no | The currency of the balance |
| entityId | string | no | The subscription id linked to the invoice, for trip related invoice only |
| fleetId | string | yes | fleetId (cannot be updated) |
| refreshDate | string | yes | The last date when the balance was refreshed |
| invoiceIds | string[] | yes | The list of invoices linked to the balance |
| entityPayableInvoicesAvailable | boolean | no | The existence of user payable invoices |

### batchUpdatePropertyRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes |  |
| ticketIds | string[] | yes |  |
| property | string | yes |  |
| value | string | yes |  |

### batchUpdatePropertyResponse
list of failed updates
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes |  |
| ticketIds | string[] | no | list of ticket ids whose update failed |

### BatteryLockRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | integer | yes | if 1, action is to lock the battery; otherwise, action is to unlock battery |

### BilledFullInvoicesBalanceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| balance | number | yes | Balance of the entity (the amount due by the entity) |
| userId | string | no | deprecated |
| entityId | string | yes | Entity Id |
| Billing | BilledTripDTO[] | yes | List of trip's invoices which are due |

### BilledProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | The id of the user |
| fleetId | string | yes | fleetId (cannot be updated) |
| productId | string | yes | The product id charged (can be null is productBillingBreakdown is filled) |
| productName | string | yes | The name of the product charged (can be null is productBillingBreakdown is filled) |
| productType | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes | Product type |
| serviceId | string | yes | The id of the service used to make a trip |
| isTaxIncluded | boolean | yes | The tax is included in the product details |
| entityId | string | yes | The id of the entity |
| taxRate | number | yes | The rate of the tax |
| taxName | string | no | The name of the tax |
| totalWithoutTax | number | yes | The total amount of the products with tax excluded |
| totalTaxAmount | number | yes | The total tax amount of the products |
| totalWithTax | number | yes | The total amount of the products with tax included |
| totalWithoutTaxSystemCredits | number | yes | The total amount with tax excluded of the system credits used to pay the products |
| totalWithTaxSystemCredits | number | yes | The total amount with tax included of the system credits used to pay the products |
| totalTaxAmountSystemCredits | number | yes | The total tax amount of the system credits used to pay the products |
| withTaxRefundAmount | number | yes | The total amount with tax included refunded of the products |
| productNotes | string | no | The notes of the product charged (can be null is productBillingBreakdown is filled) |
| paymentMethodType | string | no | The payment method type |
| percentage | number | no | In case the product support percentage amount we need a percentage value |
| additionalInfo | BillProductAdditionalInfo | no | Additional not mandatory information for ex: BookingRequestId |
| refunded | boolean | no |  |
| billingBreakdownProduct | BillingBreakdownProductDTO | no | The details of the product charged |
| invoice | InvoiceDTO | yes | The invoice details |

### BilledTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| trip | TripDTO | yes | Trip summary |
| product | BilledProductDTO | yes | The product details |
| vehiculeModelName | string | yes | Vehicle's model name |
| vehiculePlate | string | yes | Vehicle's plate number |
| modelId | string | yes | Vehicle's model id |
| userId | string | yes | User who did the request |
| withoutTaxAmountForDriving | number | yes | The net amount of the driving part of the trip |
| withoutTaxAmountForStopover | number | yes | The net amount of the stop over part of the trip |
| withoutTaxAmountForBooking | number | yes | The net amount of the booking part of the trip |
| withoutTaxForOvermileage | number | yes | The net amount of the overmileage part of the trip |
| withoutTaxAmountForStartZoneFee | number | yes | The net amount of the start zone fee |
| withoutTaxAmountForEndZoneFee | number | yes | The net amount of the end zone fee |
| withoutTaxAmountForCancellationFee | number | yes | The net amount of the cancellation fee |
| withoutTaxAmountForScheduleTripFee | number | yes | The net amount of the schedule trip fee |
| withoutTaxAmountForTripSystemCredit | number | yes | The net amount of the system credits used for the trip |
| withoutTaxAmountForBillingGroupDiscount | number | yes | The net amount of the billing group discount applied on the trip |
| withTaxAmountForDriving | number | yes | The gross amount of the driving part of the trip |
| withTaxAmountForStopover | number | yes | The gross amount of the stop over part of the trip |
| withTaxAmountForBooking | number | yes | The gross amount of the booking part of the trip |
| withTaxForOvermileage | number | yes | The gross amount of the overmileage part of the trip |
| withTaxAmountForStartZoneFee | number | yes | The net amount of the start zone fee |
| withTaxAmountForEndZoneFee | number | yes | The net amount of the end zone fee |
| withTaxAmountForCancellationFee | number | yes | The net amount of the cancellation fee |
| withTaxAmountForScheduleTripFee | number | yes | The net amount of the schedule trip fee |
| withTaxAmountForTripSystemCredit | number | yes | The gross amount of the system credits used for the trip |
| withTaxAmountForBillingGroupDiscount | number | yes | The gross amount of the billing group discount applied on the trip |
| withoutTaxInitialTotalAmount | number | yes | The net amount of the invoice before the discounts were applied |
| withTaxInitialTotalAmount | number | yes | The gross amount of the invoice before the discounts were applied |
| taxInitialTotalAmount | number | yes | The tax amount of the invoice before the discounts were applied |
| paymentMethodType | string | no | The payment method type |
| walletId | string | yes | The id of the wallet used to pay part of the invoice |
| totalTaxAmount | number | yes | The tax total amount of the invoice |
| totalWithTax | number | yes | The gross total amount of the invoice |
| totalWithoutTax | number | yes | The net total amount of the invoice |
| taxRate | number | yes | The tax rate applied on the invoice |
| taxName | string | yes | The tax name applied on the invoice |
| withoutTaxAmountRideCost | number | yes | The net amount of the ride part of the invoice (sum of the booking, driving, stop over and overmileage) |
| withTaxAmountRideCost | number | yes | The gross amount of the ride part of the invoice (sum of the booking, driving, stop over and overmileage) |
| taxAmountRideCost | number | yes | The tax amount of the ride part of the invoice (sum of the booking, driving, stop over and overmileage) |
| taxAmountForTripSystemCredit | number | yes | The tax amount of the system credits used on the trip part of the invoice |
| taxAmountForBillingGroupDiscount | number | yes | The tax amount of the billing group discount applied on the invoice |
| rideTaxRate | number | yes | The tax rate applied on the ride part of the invoice |
| rideTaxName | string | yes | The tax name applied on the ride part of the invoice |
| products | AccountingPdfProductDTO[] | yes | The list of products applied on the trip |
| taxesPerRate | object | yes | The list of taxes applied, group by tax name and tax rates |
| serviceId | string | yes | The id of the service used to make a trip |
| profileId | string | yes | The profile id the user who did the trip |
| profileType | string: `Family`, `Business`, `Single`, `ALL` | yes | Profile type of the user who did the trip (Single or Business) |
| profileName | string | yes | Profile name of the user who did the trip |
| withoutTaxUnlockFee | number | yes | The net amount of the unlock fee |
| withTaxUnlockFee | number | yes | The gross amount of the unlock fee |
| taxUnlockFee | number | yes | The tax amount of the unlock fee |
| withTaxRefundAmount | number | yes | The gross amount of the refunded amount |
| isRefunded | boolean | yes | The invoice was refunded or not |
| cityName | string | yes | The city name where the trip was done |
| cityId | string | yes | The city id where the trip was done |
| tripBillingBreakdown | BillingBreakdownTripDTO | yes | The details of the trip billing |
| pricingId | string | yes | PricingId |
| netJourney | number | yes | The net amount of the journey part of the invoice (the combination of driving & stopover caps) |
| taxJourney | number | yes | The tax amount of the journey part of the invoice (the combination of driving & stopover caps) |
| grossJourney | number | yes | The gross amount of the journey part of the invoice (the combination of driving & stopover caps) |
| durationJourney | number | yes | The duration of the journey part of the invoice (the combination of driving & stopover caps) |
| taxRemainingToBePaid | number | yes | The remaining total amount of the taxes to be paid |
| grossRemainingToBePaid | number | yes | The remaining total amount with taxes included to be paid |
| netRemainingToBePaid | number | yes | The remaining total amount with taxes excluded to be paid |
| overriddenTripInfo | OverriddenTripInfo | yes | The overridden information about the trip, computed from the edit trip duration |
| interrupted | boolean | no | Flag indicating that the billing has been interrupted for some reason before invoice generation and needs to be replayed |
| interruptedReason | string | no | The reason why a billing has been interrupted |
| withTaxAmoountForCancellationFee | number | no |  |
| invoice | InvoiceDTO | yes | Invoice summary |
| distanceUnit | string: `KM`, `MILES` | no |  |
| isTaxIncluded | boolean | yes | The amount is given with tax included or not |

### BillGiftCardInputDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | no | The id of the product |
| userId | string | yes | The id of the user charged |
| entityId | string | yes | The id of the entity charged |
| originId | string | yes | The id of the user charging the product |
| giftCard | GiftCard | yes | extra information carried for a product type GIFT_CARD |
| notes | string | no | The notes about the gift card |

### BillingBreakdownProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | yes | The invoice id |
| fees | FeeDTO[] | yes | The list of fees/products |
| discounts | DiscountsDTO | yes | The details of the discounts applied to the products |
| totals | object | yes | The totals before and after the discount were applied |

### BillingBreakdownTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | yes | The invoice id |
| trip | object | no | The list amounts for the trip part |
| fees | FeeDTO[] | yes | The list of fees/products |
| payments | PaymentBreakdownDTO[] | no | Payments list |
| paymentsTotal | PaymentsTotalDTO | no | Other payments part |
| discounts | DiscountsDTO | yes | The details of the discounts applied to the products |
| totals | object | yes | The totals before and after the discount were applied |
| subscription | SubscriptionBreakdownDTO | no | The details of the subscription |

### BillingGroup
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the billing group |
| fleetId | string | yes | fleetId (cannot be updated) |
| name | string | yes | The name of the billing group |
| discount | number | yes | The percentage of discount applied by the billing group (from 0.00 to 100.00%) |
| overMileageCap | number | yes | The distance cap allowed by the billing group before being charge from overmileage |
| overMileageRate | number | yes | The distance overmileage pricing rate for each unite of distance above the cap |
| customRules | BillingGroupCustomRule[] | no | Granular discount rules refining the base discount, per service and per product |

### BillingGroupCustomRule
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | The id of the rule |
| kind | string: `SERVICE_TRIP`, `SERVICE_PRODUCT` | yes | SERVICE_TRIP overrides the base ride discount for a service, SERVICE_PRODUCT opts a product in for a discount on a service |
| serviceId | string | yes | The service the rule applies to |
| productId | string | no | The product the rule applies to. Required for SERVICE_PRODUCT, must be null for SERVICE_TRIP |
| discount | number | yes | The percentage of discount applied by the rule (from 0.00 to 100.00%). 0 is only allowed on SERVICE_TRIP, where it means no ride discount at all on that service |
| maxDiscountedOccurrences | integer (int32) | no | How many occurrences of the product are discounted on a single trip. Null means unlimited. Only meaningful for SERVICE_PRODUCT |

### BillingGroupCustomRuleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | The id of the rule |
| kind | string: `SERVICE_TRIP`, `SERVICE_PRODUCT` | yes | SERVICE_TRIP or SERVICE_PRODUCT |
| serviceId | string | yes | The service the rule applies to |
| productId | string | no | The product the rule applies to, for SERVICE_PRODUCT rules only |
| discount | number | yes | The percentage of discount applied by the rule (from 0.00 to 100.00%) |
| maxDiscountedOccurrences | integer (int32) | no | How many occurrences of the product are discounted on a single trip, null means unlimited |

### BillingGroupDiscountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | The name of the billing group applied |
| rate | number | yes | The rate applied on the invoice for the user using this billing group |
| net | number | yes | The net amount of the billing group discount |
| gross | number | yes | The gross amount of the billing group discount |
| taxes | Tax[] | yes | The list of taxes of the billing group discount |
| target | string | no | TRIP when the discount applies to the ride, otherwise the product id |

### BillingGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | The fllet id of the billing group |
| id | string | yes | The id of the billing group |
| name | string | yes | The name of the billing group |
| discount | number | yes | The percentage of discount applied by the billing group (from 0.00 to 100.00%) |
| overMileageCap | number | yes | The distance cap allowed by the billing group before being charge from overmileage |
| overMileageRate | number | yes | The distance overmileage pricing rate for each unite of distance above the cap |
| customRules | BillingGroupCustomRuleDTO[] | no | Granular discount rules refining the base discount, per service and per product |

### BillProductAdditionalInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingRequestId | string | no | The id of the related booking request |
| manualPayment | boolean | no | Defines the way the invoice should be paid: manual or not |
| giftCard | GiftCard | no | extra information carried for a product type GIFT_CARD |
| giftCardPspReference | string | no | psp reference information carried for a product type GIFT_CARD |
| tollFeeAdditionalInfo | BillProductTollFeeAdditionalInfo | no |  |

### BillProductInputDTO
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

### BillProductTollFeeAdditionalInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| zoneLabel | string | no | The toll zone label |
| tripId | string | no | The tripId associated with the toll |
| tripStartDate | string (date-time) | no | Start date of the trip |
| tripEndDate | string (date-time) | no | End date of the trip |
| vehicleId | string | no | The id of the related vehicle |
| vehiclePlate | string | no | The plate of the related vehicle |
| bookingId | string | no | The id of the related booking request |
| bookingReferenceId | string | no | The reference id of the related booking request |
| crossingDate | string (date-time) | no | The date when crossing the toll area |

### BLEToken
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | string | no | the BLE token used to initiate a BLE with the device specified in the device name. |
| sessionKey | string | no | session Key used to encrypt the BLE exchange between the app and the box. |
| deviceName | string | no | The name used to identify the vehicle during the BLE scanning. |

### BLETokenRequest
Request to retrieve a BLE admin token for a given vehicle. If startDate is provided, the vehicle firmware version must be >= 7.7.0 and the token version will be 3. If not provided, version 2 is used.
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| expirationInSecs | integer (int64) | yes | token TTL in seconds |
| userId | string | yes | id of user for whom is the token. |
| startDate | string (date-time) | no | Optional. Start date for the admin token in ISO-8601 format (e.g. 2019-12-01T10:40:27.29Z). If provided, the vehicle firmware version must be >= 7.7.0 and the… |

### BookingFeeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| duration | integer (int32) | yes | The Booking fee duration in minutes (X minutes before the expire time) |
| price | number (double) | yes | Price per minutes |

### BookingRequest
The booking request object
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

### BookingRequestAdditionalInformation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingRequest | BookingRequest | no |  |
| modelBasePrice | number | no |  |
| modelRate | number | no |  |
| vehicleResidualValue | number | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| notes | string | no |  |
| thresholdDateLimit | string (date-time) | no | Date Limit for apply a cancellation fee |
| rollingContract | boolean | no |  |
| planName | string | no | The Subscription plan name |
| planDurationInMonths | integer (int32) | no | The plan duration in months |

### BookingRequestCalendarDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| vehicleReturnedDate | string (date-time) | no |  |
| vehicleId | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| userId | string | no |  |
| firstName | string | no |  |
| lastName | string | no |  |
| userName | string | no |  |
| profileType | string: `Family`, `Business`, `Single`, `ALL` | no |  |
| phoneNumber | string | no |  |
| email | string | no |  |
| isOneWay | boolean | no |  |
| bookingReferenceId | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| rollingContract | boolean | no |  |

### BookingRequestContract
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| bookingRequest | object | no |  |
| contractType | string: `SVS`, `MVS` | yes | type of contract of the created BR. It can be MVS or SVS |
| previous | string | no |  |

### BookingRequestCreditDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| amount | number | no |  |
| availableAmount | number | no |  |
| status | string: `PAYMENT_PENDING`, `CONFIRMED`, `USED` | no |  |
| walletId | string | no |  |
| date | string (date-time) | no | creation date |

### BookingRequestDTO
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

### BookingRequestExtension
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| bookingRequest | object | no |  |
| fleetId | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| originId | string | no |  |
| creationDate | string (date-time) | no |  |

### BookingRequestFM
if the fleetmanager isn't used with the Vulog's billing engine the pricingId can be null
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

### BookingRequestManualPaymentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| online | boolean | no | true to specify that the shopper is online |
| scope | string: `DEPOSIT`, `RENTAL` | yes | return url passed to the payment provider, used at the end of a 3ds flow |
| amountType | string: `FIXED,PERCENTAGE` | no | Payment amount type, can be a fixed amount of a percentage |
| amountValue | number | no | amount that must override the payment parameter configuration (can be a percentage of a fixed value depending on installed configuration) |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |
| profileId | string | no | Profile id to use for the payment instead of the default one from the booking request |

### BookingRequestModelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| price | string | no |  |
| prePaymentPrice | number | no |  |
| mileageAllowance | MileageAllowanceDTO | no |  |
| pricingInfo | PricingInfo | no |  |
| finalPrice | number | no |  |
| prePaymentPriceWithAppliedWallets | number | no |  |

### BookingRequestPreferredPaymentMethod
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| pspReference | string | yes | psp reference |
| amount | number | no | maximum amount to use for this payment method |

### BookingRequestPricingProvider
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| type | string: `TIMERANGE`, `CALENDAR`, `CUSTOM_PRICE`, `DEFAULT` | no |  |
| pricingId | string | no |  |

### BookingRequestReminderDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| stationId | string | no |  |
| modelName | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| userId | string | no |  |
| nbHours | string | no |  |
| modelDescription | string | no |  |
| bookingReferenceId | string | no |  |
| profileType | string | no |  |
| serviceId | string | no |  |

### BookingRequestRequiredActionOutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | Id of the user requesting the action |
| status | string: `PENDING`, `WARNING`, `CONFIRMED`, `COMPLETED`, `CANCELLED_BY_USER`, `REJECTED`, `REVOKED` | no | booking request required action status |
| action | string: `EARLIER_CANCELLATION_REQUEST`, `MANUAL_APPROVAL_REQUEST` | no | booking request required action name |
| requiredChange | RequiredChangeDTO | no | required change for booking request |
| bookingStatusBO | BookingStatusBO | no | the booking request status in BO |
| fileNames | string[] | no | File names to upload specific to MANUAL_APPROVAL feature |
| id | string | no | booking request required action id |
| fleetId | string | yes | the fleet id |
| bookingRequestId | string | yes | The id of booking request required action |
| operatorId | string | no | the operator id |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | Last update date |
| fileUrlDTOS | ManualApprovalFileURLDTO[] | no | file name and url to upload |

### BookingRequestResponseWithPricingInfoDTO
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
| estimationPricingInfo | PricingInfo | no |  |
| completed | boolean | no |  |
| earlyCancelledByUser | boolean | no |  |

### BookingResponse
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | id of the user who has booked the vehicle. |
| orderId | string | no | unique id of booking. |
| date | string (date-time) | no | date of the booking. |
| bookingInProgress | boolean | no | true if the preauth at the booking phase is not CONFIRMED |
| isPreAuthEnabled | boolean | no | true if the preauth is activated for this booking |
| preAuthStatus | string: `PREAUTH_INIT`, `PREAUTH_INPROGRESS`, `PREAUTH_CONFIRMED`, `PREAUTH_REJECTED` | no | Status of the preauth operation |
| originCancelJourney | string | no |  |
| expiresOn | string (date-time) | no | expiration date of the booking. The booking will be canceled if the trip is not started before this date. |

### BookingStatusBO
Type: string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `UPCOMING`, `LATE`, `PENDING_APPROVAL`

### BreakdownDetails
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | no |  |
| gross | number | no |  |
| taxes | Tax[] | no |  |
| date | string | no |  |
| usage | string | no |  |
| type | string | no |  |
| category | string | no |  |
| distance | number | no |  |
| fuelPricePerDistanceUnitNet | number | no |  |

### BusinessWsAccountingBusinessWSProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | The product name |
| chargeDate | string (date-time) | yes | The date the product was charged |
| id | string | yes | The product id |
| net | number | yes | The net amount of the product |
| gross | number | yes | The gross amount of the product |
| productNotes | string | no | Charge reason |
| taxes | BusinessWsTaxDTO[] | no |  |

### BusinessWsAccountingBusinessWSTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| distanceUnit | string: `KM`, `MILES` | no |  |
| vehicleModelName | string | no |  |
| vehiclePlate | string | no |  |
| modelId | string | no |  |
| serviceId | string | no |  |
| userId | string | no |  |
| profileId | string | no |  |
| profileType | string: `Family`, `Business`, `Single` | no |  |
| profileName | string | no |  |
| tripId | string | no |  |
| tripEndDate | string (date-time) | yes |  |
| theorEndDate | string (date-time) | no |  |
| theorStartDate | string (date-time) | no |  |
| costCenter | BusinessWsCostCenterDTO | no |  |
| billingBreakdown | BusinessWsBillingBusinessWSBreakdownTripDTO | no |  |
| cityId | string | no |  |
| distance | number | no |  |
| duration | number | no |  |
| stopoverDuration | number | no |  |
| bookingDuration | number | no |  |
| tripDuration | number | no |  |
| drivingDuration | number | no |  |
| tripStartDate | string (date-time) | yes |  |

### BusinessWsAddBusinessWSCreditCardResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| publishableKey | string | no |  |
| customerId | string | no |  |
| clientSecret | string | no |  |

### BusinessWsAdditionalInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| notes | string | no |  |

### BusinessWsAddressDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| city | string | no |  |
| country | string | no |  |
| region | string | no |  |
| streetName | string | no |  |
| postalCode | string | no |  |
| countryCode | string | no |  |

### BusinessWsBalanceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| amount | string | no |  |
| currency | string | no |  |
| entityId | string | no |  |
| fleetId | string | no |  |
| invoiceIds | string[] | no |  |
| refreshDate | string | no |  |

### BusinessWsBilledBusinessWSProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no |  |
| user | BusinessWsUserBusinessDTO | no |  |
| productName | string | no |  |
| totalTaxAmount | number (double) | no |  |
| totalWithoutTax | number (double) | no |  |
| totalWithTax | number (double) | no |  |
| invoice | BusinessWsInvoiceBusinessDTO | no |  |
| productId | string | no |  |
| productNotes | string | no |  |

### BusinessWsBilledBusinessWSTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| trip | BusinessWsSimpleTripDTO | no |  |
| fleetId | string | no |  |
| distanceUnit | string | no |  |
| userId | string | no |  |
| userToBill | BusinessWsUserBusinessDTO | no |  |
| costCenterId | string | no |  |
| amountWithoutTaxOfBill | number (double) | no |  |
| taxOfBill | number (double) | no |  |
| taxRate | number (double) | no |  |
| amountOfBill | number (double) | no |  |
| tripId | string | no |  |
| currency | string | no |  |
| pricingRules | object[] | no |  |
| creditUsed | number (double) | no |  |
| amountPayWithSystemCredit | number (double) | no |  |

### BusinessWsBillingBusinessWSBreakdownTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | no |  |
| trip | object | no |  |
| fees | BusinessWsFeeBusinessDTO[] | no |  |
| discounts | BusinessWsDiscountsBusinessDTO | no |  |
| totals | object | no |  |

### BusinessWsBillingBusinessWSGroupDiscountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| rate | number | no |  |
| net | number | no |  |
| gross | number | no |  |
| taxes | BusinessWsTaxBusiness[] | no |  |

### BusinessWsBillingBusinessWSGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | yes |  |
| discount | number (double) | no |  |
| name | string | no |  |

### BusinessWsBusinessContactsDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| email | string | no |  |

### BusinessWsBusinessCreationDTO
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

### BusinessWsBusinessUpdateDTO
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

### BusinessWsBusinessWSDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| billingAddress | BusinessWsAddressDTO | no |  |
| name | string | yes |  |
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
| businessOwner | object | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| paymentType | string | no |  |
| locale | string | no |  |
| invoiceFrequency | string | no |  |
| taxNumberCountry | string | no |  |
| communityTaxNumber | string | no |  |
| status | string | no |  |
| type | string | no |  |
| entityName | string | no |  |
| mandatoryTripNotes | boolean | no |  |
| services | BusinessWsServiceDTO[] | no |  |
| sdicemCode | string | no |  |
| nationality | string | no |  |
| pec | string | no |  |
| legalForm | string | no |  |
| fiscalCode | string | no |  |
| nextIteration | string (date-time) | no |  |
| purchaseOrderReference | string | no |  |
| masterEntity | boolean | no |  |

### BusinessWsCostCenterAddDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| value | string | yes |  |
| name | string | yes |  |

### BusinessWsCostCenterDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| name | string | no |  |
| value | string | no |  |

### BusinessWsCostCenterUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| value | string | yes |  |
| name | string | yes |  |

### BusinessWsCreateUserProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| emailConsent | boolean | no |  |
| email | string | no |  |
| costCenterId | string | no |  |
| requestId | string | no |  |

### BusinessWsCustomerDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | string | no |  |
| lastName | string | no |  |
| userName | string | no |  |
| billingAdress | string | no |  |
| email | string | no |  |

### BusinessWsDiscountsBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| systemCredits | BusinessWsSystemCreditsDiscountBusinessDTO | no |  |
| billingGroup | BusinessWsBillingBusinessWSGroupDiscountDTO | no |  |

### BusinessWsExtendedTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripId | string | no |  |
| serviceName | string | no |  |
| cityName | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| theorStartDate | string (date-time) | no |  |
| theorEndDate | string (date-time) | no |  |
| distance | number | no |  |
| duration | number | no |  |
| stopoverDuration | number | no |  |
| bookingDuration | number | no |  |
| drivingDuration | number | no |  |

### BusinessWsExternalPaymentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requesterId | string | yes |  |
| notes | string | no |  |
| paymentMethod | string | no |  |

### BusinessWsFeeBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| id | string | no |  |
| net | number | no |  |
| gross | number | no |  |
| taxes | BusinessWsTaxBusiness[] | no |  |

### BusinessWsInvoiceBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| billingStatus | string | no |  |

### BusinessWsInvoiceCumulativeBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| sequence | integer (int64) | no |  |
| invoiceDate | string (date-time) | no |  |
| fleetId | string | no |  |
| invoiceYear | integer (int32) | no |  |
| invoicesStatus | string | no |  |
| amount | number | no |  |
| total | BusinessWsPriceBusinessDTO | no |  |
| currency | string | no |  |
| entityId | string | no |  |
| attempts | integer (int32) | no |  |
| pspName | string | no |  |
| pspReference | string | no |  |
| tripExpensesCumulativeId | string | no |  |
| type | string | no |  |
| invoiceNumber | string | no |  |
| taxNumberCountry | string | no |  |
| communityTaxNumber | string | no |  |
| paymentReceipts | BusinessWsPaymentDTO[] | no | Payment receipts |
| paymentIntents | BusinessWsPaymentDTO[] | no | Payment intents at non final status |
| cancellationDate | string (date-time) | no |  |

### BusinessWsInvoiceRefundDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | no |  |
| fleetId | string | no |  |
| refundableAmount | number | no |  |
| currency | string | no |  |
| refundableItems | BusinessWsRefundableItemDTO[] | no |  |
| refundableByRate | BusinessWsRateRefundableDTO[] | no |  |

### BusinessWsOngoingTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| userId | string | no |  |
| profileId | string | no |  |
| theorStartDate | string (date-time) | no |  |
| theorEndDate | string (date-time) | no |  |
| name | string | no |  |
| plate | string | no |  |
| user | BusinessWsUserBusinessDTO | no |  |
| tripId | string | no |  |
| booking_date | string (date-time) | no |  |

### BusinessWsPageable
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| page | integer (int32) | no |  |
| size | integer (int32) | no |  |
| sort | string[] | no |  |

### BusinessWsPageableObject
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paged | boolean | no |  |
| pageNumber | integer (int32) | no |  |
| pageSize | integer (int32) | no |  |
| offset | integer (int64) | no |  |
| sort | BusinessWsSortObject | no |  |
| unpaged | boolean | no |  |

### BusinessWsPageAccountingBusinessWSProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsAccountingBusinessWSProductDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageAccountingBusinessWSTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsAccountingBusinessWSTripDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageBilledBusinessWSProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsBilledBusinessWSProductDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageBilledBusinessWSTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsBilledBusinessWSTripDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageInvoiceCumulativeBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsInvoiceCumulativeBusinessDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageOngoingTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsOngoingTripDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageTripAndCostBreakdownDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsTripAndCostBreakdownDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageUserBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsUserBusinessDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageUserListDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsUserListDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPageWalletDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalElements | integer (int64) | no |  |
| totalPages | integer (int32) | no |  |
| pageable | BusinessWsPageableObject | no |  |
| size | integer (int32) | no |  |
| content | BusinessWsWalletDTO[] | no |  |
| number | integer (int32) | no |  |
| sort | BusinessWsSortObject | no |  |
| numberOfElements | integer (int32) | no |  |
| first | boolean | no |  |
| last | boolean | no |  |
| empty | boolean | no |  |

### BusinessWsPaymentBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| entityId | string | no |  |
| fleetId | string | no |  |
| holderName | string | no |  |
| cardType | string | no |  |
| cardSummary | string | no |  |
| expiryDate | string | no |  |
| lastUpdateDate | string | no |  |
| token | string | no |  |
| origin | string | no |  |
| iban | string | no |  |
| paymentMethod | string | no |  |
| mopStatus | string | no |  |
| pspName | string | no |  |
| customerPspReference | string | no |  |
| bankCode | string | no |  |
| branchCode | string | no |  |
| country | string | no |  |
| fingerprint | string | no |  |
| last4 | string | no |  |

### BusinessWsPaymentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | payment object identifier |
| pspName | string | yes | related psp name |
| pspReference | string | yes | related psp reference |
| pspPublishableKey | string | no | related psp public key (available only when status is at 'REQUIRES_CONFIRMATION' or 'REQUIRES_ACTION') |
| amount | number | yes | related amount value |
| currency | string | yes | related Three-letter ISO currency code (https://www.iso.org/iso-4217-currency-codes.html) |
| date | string (date-time) | yes | related effective date |
| status | string: `AUTHORIZED, PAID, REFUSED, REFUNDED, CANCELLED` | yes | related status |
| paymentMethodType | string: `CREDIT_CARD,SEPA` | yes | related payment method type used for the payment |
| paymentIntentPspReference | string | no | related payment intent psp reference (for refund receipt) |
| number | integer (int64) | yes | unique receipt number |
| code | string | no | error code in case of status 'REFUSED' |
| declineCode | string | no | decline code in case of status 'REFUSED' |
| pspClientSecret | string | no | the client secret of this PaymentIntent. Used for client-side retrieval using a publishable key. The client secret can be used to complete a payment from your… |
| reason | string | no | a human-readable message in case of status 'REFUSED' |
| note | string | no | note in case of status 'REFUNDED' |
| nextAction | BusinessWsPaymentNextAction | no | if present, this property tells you what actions you need to take in order for your customer to fulfill a payment using the provided source (in case of status… |
| metadatas | object | no | related Set of key-value pairs attached to the payment object |

### BusinessWsPaymentNextAction
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| nextActionRedirectUrl | BusinessWsPaymentNextActionRedirectUrl | yes | requires action redirect in case of status 'REQUIRES_ACTION' |
| type | string: `redirect_to_url` | yes | type of the next action to perform |

### BusinessWsPaymentNextActionRedirectUrl
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | the URL you must redirect your customer in order to authenticate the intent |
| method | string: `POST,GET` | yes | the HTTP method to use |
| data | object | no | pair of (key,value) to pass as a form if method is set to POST |

### BusinessWsPriceAmountBusiness
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | no |  |
| gross | number | no |  |
| taxes | BusinessWsTaxBusiness[] | no |  |

### BusinessWsPriceBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| gross | number | no |  |
| net | number | no |  |
| taxes | BusinessWsTax[] | no |  |

### BusinessWsProductBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| serviceIds | string[] | no |  |
| type | string | no |  |
| price | number | no |  |
| name | string | no |  |
| taxIncluded | boolean | no |  |
| expirationDate | string (date-time) | no |  |
| taxName | string | no |  |
| taxRate | number | no |  |
| zones | string[] | no |  |

### BusinessWsProductChargeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | yes |  |
| amount | number | yes |  |
| userId | string | no |  |
| productNotes | string | no |  |
| serviceId | string | no |  |

### BusinessWsRateRefundableDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxRate | number | no | Normalized VAT rate, same normalization as the refs |
| refundableAmount | number | no | Validation cap: the backend rejects a per-rate refunded sum above this amount |

### BusinessWsRefundableItemDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ref | string | no | Natural line key: {segmentType\|productName}-{normalizedTaxRate} |
| name | string | no | Display name: the segmentType or productName |
| taxRates | number[] | no | Normalized VAT rates of the line — several entries only for a multi-tax line (the avoir groups by each numeric rate, Factur-X BG-23) |
| originalPrice | number | no | Original gross price of the line, before discounts/credits — display guideline only, NOT the maximum refundable amount |
| multiTax | boolean | no | True when the line carries several coupled taxes (refunded together via the combined ref) |

### BusinessWsRefundAmountBaseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | no | Amount to refund |
| note | string | no | Note related to the refund |
| refundItems | BusinessWsRefundItemDTO[] | no | lines selected for refund (ref + TTC amount), forwarded to the backend. When present, drives the refund-by-item flow; when absent, the legacy amount-only path… |

### BusinessWsRefundItemDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ref | string | no | Natural line key echoed from GET .../refundableAmount |
| amount | number | no | Gross amount (TTC) to refund for this line |

### BusinessWsServiceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| name | string | no |  |
| status | string: `ACTIVE`, `DISABLED` | no |  |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | no |  |
| visibility | string: `PUBLIC`, `PRIVATE` | no |  |

### BusinessWsSimpleTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripId | string | no |  |
| length | integer (int32) | no |  |
| duration | integer (int32) | no |  |
| date | string (date-time) | no |  |
| tripEndDate | string (date-time) | no |  |
| userId | string | no |  |

### BusinessWsSimpleVehicleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| plate | string | no |  |
| modelName | string | no |  |

### BusinessWsSortObject
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| sorted | boolean | no |  |
| empty | boolean | no |  |
| unsorted | boolean | no |  |

### BusinessWsSystemCreditsDiscountBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | no |  |
| gross | number | no |  |
| taxes | BusinessWsTaxBusiness[] | no |  |
| breakdown | object | no |  |

### BusinessWsTax
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | no |  |
| taxRate | number | no |  |
| taxAmount | number | no |  |

### BusinessWsTaxBusiness
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | no |  |
| taxRate | number | no |  |
| taxAmount | number | no |  |

### BusinessWsTaxDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| taxName | string | no |  |
| taxRate | number | no |  |
| taxAmount | number | no |  |
| products | BusinessWsProductBusinessDTO[] | no |  |

### BusinessWsTripAndCostBreakdownDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| trip | BusinessWsExtendedTripDTO | no |  |
| customer | BusinessWsCustomerDTO | no |  |
| vehicle | BusinessWsSimpleVehicleDTO | no |  |
| currency | string | no |  |
| pricingId | string | no |  |
| tripBillingBreakdown | BusinessWsBillingBusinessWSBreakdownTripDTO | no |  |

### BusinessWsTripDetailDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripId | string | no |  |
| fleetId | string | no |  |
| duration | number (double) | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| serviceName | string | no |  |
| mapCoordinates | number (double)[][] | no |  |
| vehicleId | string | no |  |
| vehicleDetail | BusinessWsVehicleDetailDTO | no |  |
| additionalInfo | BusinessWsAdditionalInfoDTO | no |  |
| length | number (double) | no |  |
| date | string (date-time) | no |  |

### BusinessWsTripNoteDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | string | no |  |

### BusinessWsUpdateUserProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string (email) | no |  |
| emailConsent | boolean | no |  |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` | no |  |
| costCenterId | string | no |  |
| isDelegatedAdmin | boolean | no |  |
| delegatedAdmin | boolean | no |  |

### BusinessWsUserBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| firstName | string | no |  |
| lastName | string | no |  |
| registrationDate | string (date-time) | no |  |
| userName | string | no |  |
| accountStatus | string | no |  |
| profiles | BusinessWsUserProfileDTO[] | no |  |
| costCenter | BusinessWsCostCenterDTO | no |  |
| delegatedAdmin | boolean | no |  |
| fullName | string | no |  |
| isDelegatedAdmin | boolean | no |  |

### BusinessWsUserCSVImport
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | no |  |
| firstName | string | no |  |
| lastName | string | no |  |
| costCenterValue | string | no |  |

### BusinessWsUserImportError
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userCSVImport | BusinessWsUserCSVImport | no |  |
| errorMessage | string | no |  |
| errorCode | string | no |  |

### BusinessWsUserImportReporterDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| listOfFailed | BusinessWsUserImportError[] | no |  |
| listOfNotHandleFailed | BusinessWsUserImportError[] | no |  |
| totalInsertedRows | integer (int32) | no |  |
| totalSubmittedRows | integer (int32) | no |  |

### BusinessWsUserInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | string | no |  |
| lastName | string | no |  |
| userRoles | string[] | no |  |
| entityRoles | object | no |  |

### BusinessWsUserListDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| firstName | string | no |  |
| lastName | string | no |  |
| registrationDate | string (date-time) | no |  |
| userName | string | no |  |
| accountStatus | string | no |  |
| profileStatus | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` | no |  |
| isDelegatedAdmin | boolean | no |  |

### BusinessWsUserProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| entity | BusinessWsBusinessWSDTO | no |  |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` | no |  |
| phoneNumber | string | no |  |
| email | string | no |  |
| name | string | no |  |
| fleetId | string | no |  |
| emailConsent | boolean | no |  |
| identificationNumber | string | no |  |
| rfid | string | no |  |
| type | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| billingInProgress | boolean | no |  |

### BusinessWsUserProfileUpdateReporterDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| listOfSuccess | BusinessWsUserProfileDTO[] | no |  |
| listOfFailure | string[] | no |  |
| totalSuccess | integer (int32) | no |  |
| totalFailure | integer (int32) | no |  |

### BusinessWsVehicleDetailDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| vin | string | no |  |
| name | string | no |  |
| plate | string | no |  |
| wakeupProvider | string | no |  |

### BusinessWsWalletCreationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | yes |  |
| expirationDate | string | yes |  |

### BusinessWsWalletDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| availableAmount | number | no |  |
| initialAmount | number | no |  |
| promoCodeReference | string | no |  |
| percentage | number | no |  |
| discountCategory | string: `PERCENTAGE`, `CREDITS` | no |  |
| type | string: `LOCAL`, `GLOBAL` | no |  |
| usage | string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL` | no |  |
| usedAmount | number | no |  |
| date when an amount is added  | string (date-time) | yes | date when an amount is added |
| expiration date  | string (date-time) | no | expiration date |
| entityId | string | no |  |

### BusinessWsWireTransferBusinessDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| iban | string | yes |  |
| entityId | string | no |  |

### CampaignRequestDTO
Campaign object request
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | yes | reference |
| operatorId | string | yes | operatorId |

### CampaignResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | yes | reference |
| operatorId | string | yes | operatorId |
| id | integer (int64) | yes | id |
| fleetId | string | yes | fleetId |

### CancellationPolicyDetailDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fromTimeUnitBeforeTheoreticalStartDate | integer (int32) | no | The lower bound for a specific detail of the cancellation policy |
| value | number | no | The value used to apply the policy. The value depends on the type of the policy. |

### CancellationPolicyDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| policyType | string: `PERCENTAGE`, `FIXED` | yes | Type of the policy |
| details | CancellationPolicyDetailDTO[] | no |  |
| creationDate | string (date-time) | yes | Creation date |
| updateDate | string (date-time) | yes | Creation date |

### CancellationPolicyRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| price | number | no |  |
| serviceIds | string[] | no |  |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes |  |
| name | string | yes |  |
| taxRate | number | no |  |
| taxName | string | no |  |
| taxIncluded | boolean | yes |  |
| expirationDate | string (date-time) | no |  |
| zones | string[] | no |  |
| priceRate | number | no |  |
| pricePerUnitExceedingAllowance | number | no |  |
| distanceIncluded | number | no |  |
| active | boolean | no |  |
| isGlobalWallet | boolean | no |  |
| getxMinutesBefore | integer (int32) | no |  |
| percentage | number | no |  |
| walletPayable | boolean | no |  |
| pricePerHour | number | no |  |
| pricePerDay | number | no |  |
| pricePerTrip | number | no |  |
| freeMinutes | integer (int32) | no |  |
| systemCreditsAvailable | number | no |  |
| validityDays | integer (int32) | no |  |
| extensionTime | integer (int32) | no |  |
| policyType | string: `PERCENTAGE`, `FIXED` | yes | The type of the cancellation policy |
| details | CancellationPolicyDetailDTO[] | yes |  |

### CancellationPolicyResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the product |
| fleetId | string | yes | The id of the fleet |
| modelIdsByServiceId | object | yes | The Map of model by service associated with the product |
| serviceIds | string[] | yes | The list of services associated with the product |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes | The type of the product |
| price | number | yes | The price amount of the product |
| name | string | yes | The name of the product |
| taxIncluded | boolean | yes | Is the tax included in the price amount |
| expirationDate | string (date-time) | yes | The expiration date of the product of the product |
| taxName | string | yes | The name of the tax applied on the product |
| taxRate | number | yes | The rate of the tax applied on the product |
| taxes | TaxDTO | yes | The list of taxes applied to the product |
| priceRate | number | no |  |
| pricePerUnitExceedingAllowance | number | no |  |
| distanceIncluded | number | no |  |
| active | boolean | no |  |
| systemCreditsAvailable | number | no |  |
| isGlobalWallet | boolean | no |  |
| validityDays | integer (int32) | no |  |
| getxMinutesBefore | integer (int32) | no | Mandatory for scheduled booking cancellation fee, it's the number of minutes the customer is allowed before having to pay the cancellation fee |
| percentage | number | no | If the product supports a percentage amount, this property provides the value of the percentage |
| walletPayable | boolean | no | Defines the possibility to pay the product by system credits |
| pricePerHour | number | no | Price per hour |
| pricePerDay | number | no | Price per hour |
| pricePerTrip | number | no | Price per Trip |
| freeMinutes | integer (int32) | no | Free Minutes to apply with system credits packages |
| extensionTime | integer (int32) | no | Extension Time in MINUTES to apply to the booking expiration date |
| cancellationPolicy | CancellationPolicyDTO | no | Cancellation Policy Id |

### CategoryModelsAssociationDTO
List of model IDs to associate to a category.
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelIds | integer (int64)[] | yes | List of model IDs to associate to the category |

### Changes
Contains the changes and who has made the change
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| datetime | string (date-time) | no |  |
| operatorId | string | no |  |
| operatorRole | string | no |  |
| oldBookingDuration | number | no |  |
| newBookingDuration | number | no |  |
| oldPauseDuration | number | no |  |
| newPauseDuration | number | no |  |
| oldDrivingDuration | number | no |  |
| newDrivingDuration | number | no |  |
| oldDuration | number | no |  |
| newDuration | number | no |  |
| oldEndTrip | string (date-time) | no |  |
| newEndTrip | string (date-time) | no |  |
| type | string: `TRIP_END`, `FORCE_END_TRIP`, `DURATION_CHANGE` | no |  |

### ChargeProductRequestDTO
The fields to be updated
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

### ClaimHistoryDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| previousReference | string | no |  |
| newReference | string | no |  |
| operatorId | string | no |  |
| updateDate | string (date-time) | no |  |

### ClaimRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| claimReference | string | no |  |
| operatorId | string | no |  |
| status | string: `NEW`, `ONGOING`, `CLOSE`, `CANCELLED` | no |  |

### ClaimResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| claimReference | string | no |  |
| status | string: `NEW`, `ONGOING`, `CLOSE`, `CANCELLED` | no |  |
| creationDate | string (date-time) | no |  |
| operatorId | string | no |  |
| updateDate | string (date-time) | no |  |
| history | ClaimHistoryDTO[] | no |  |

### cleanRedistributionTickets
Type: string[]

### ConnectBoxlessRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | id of the vehicle to connect |

### ConnectedAccountLinkDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| accountId | string | no |  |
| url | string | no |  |
| expiry_date | string (date-time) | no |  |

### CostCenterDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| name | string | no |  |
| value | string | no |  |

### CreateBulkTicketsRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string | yes |  |
| vehicleId | string[] | yes |  |
| priority | string | yes |  |
| subject | string | yes |  |
| categoryId | string | yes |  |
| groupId | integer | yes |  |
| description | string | yes |  |

### createConfigRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| autoRemoveAssignees | boolean | no |  |

### CreateLabelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string (string) | no | The dedicated name of the label |
| publicName | string (string) | no | The dedicated name of the label which will be available in the geojson of the zone |

### CreateSubscriptionDTO
Subscription
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profileId | string | yes |  |
| planId | string | yes |  |

### CreateUserLabelRequestDto
attach label payload
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| labelId | integer (int64) | yes | label identifier |

### CreateVehicleGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| type | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | yes |  |
| intervalName | string | no |  |

### CursorPageable
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paged | boolean | no |  |
| size | integer (int32) | no |  |
| sort | string | no |  |
| direction | string: `ASC`, `DESC` | no |  |
| unpaged | boolean | no |  |
| continuationToken | string | no |  |

### CursorPaginationSliceEventV2OutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | EventV2OutDTO[] | yes | The result page |
| continuationToken | string | no | The token to get the next page |
| size | integer (int32) | yes | The number of result returned |
| numberOfElements | integer (int32) | no |  |

### CursorPaginationSliceTripSessionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | TripSessionDTO[] | yes | The result page |
| continuationToken | string | no | The token to get the next page |
| size | integer (int32) | yes | The number of result returned |
| numberOfElements | integer (int32) | no |  |

### CursorPaginationSliceTripV2DTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | TripV2DTO[] | yes | The result page |
| continuationToken | string | no | The token to get the next page |
| size | integer (int32) | yes | The number of result returned |
| numberOfElements | integer (int32) | no |  |

### CursorPaginationSliceVehicleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | VehicleDTO[] | yes | The result page |
| continuationToken | string | no | The token to get the next page |
| size | integer (int32) | yes | The number of result returned |
| numberOfElements | integer (int32) | no |  |

### CustomBillingGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| billingGroupId | string | no |  |

### CustomDiscountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| discountAmount | number | no |  |
| discountReason | string | no |  |

### CustomerTripFilter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| serviceId | string | no |  |
| suspicious | boolean | no |  |
| billed | boolean | no |  |
| cancelled | boolean | no |  |
| released | boolean | no |  |
| ticketCategoryId | integer (int32) | no |  |
| ticketGroupId | integer (int32) | no |  |
| vehicleId | string | no |  |
| plate | string | no |  |
| excludedServiceTypes | string[] | no |  |
| userId | string | no |  |

### CustomInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| key | string | no |  |
| value | string | no |  |

### CustomPriceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | The unique identifier of the custom price |
| fleetId | string | yes | The fleet id |
| type | string: `CUSTOM_FIXED_PRICE`, `EXTENDED_FIXED_PRICE` | yes | The type of the custom price |
| amount | number | yes | The amount of the custom price |
| reason | string | yes | The reason to apply a custom price |
| pricingReferenceId | string | no | The pricing reference id used for billing calculations |

### DailyTimetableDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int32) | no |  |
| openAt | string | no |  |
| closeAt | string | no |  |
| closed | boolean | no |  |
| weekDay | string: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` | no |  |

### DboPlannerDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stationId | string | no |  |
| requests | DboPlannerRequestDTO[] | no |  |

### DboPlannerRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profileId | string | yes | profile Id |
| profileType | string: `Family`, `Business`, `Single`, `ALL` | yes | profileType |
| entityName | string | yes | entity name |
| firstName | string | yes | user first name |
| lastName | string | yes | user last name |
| requestId | string | yes | booking request id generated by the server |
| time | string (date-time) | yes | The time specific for type, could be start, end or planned returned date of booking request |
| type | string | yes | Type filled by type of service related to given booking request, rental (service type SCHEDULED_BOOKING_STATION or ROUND_TRIP_BOOKING) or subscription (Service… |
| actionType | string: `INBOUND`, `OUTBOUND`, `SWAP` | yes | Definition for leaving or returning vehicle |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | yes | Status of the booking request |
| delivery | boolean | yes | Status if delivery is true or false then is pick up |
| contractType | string: `SVS`, `MVS` | no | Business meaning i.e SVS or MVS |
| userId | string | yes | The user ID owner of booking request |
| cancellation | boolean | yes | The booking request is a cancellation request |
| preallocated | boolean | yes | The vehicle is preallocated for booking request |
| vehicleId | string | yes | The vehicle ID of booking request |
| startDate | string (date-time) | yes | Start Date of booking request |
| endDate | string (date-time) | yes | End Date of booking request |
| deliveryAddress | string | yes | delivery address |
| deliveryAddressAdditionalInfo | string | yes | additionnal info for delivery address |
| deliveryCity | string | yes | city where the vehicle will be delivered |
| deliveryPostalCode | string | yes | delivery Postal Code |
| vehiclePlate | string | yes | vehicle plate |
| modelName | string | yes | model name |
| bookingReferenceId | string | no | Short booking id |

### DetailedDoorStatus
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| frontLeftClosed | boolean | no |  |
| frontRightClosed | boolean | no |  |
| rearLeftClosed | boolean | no |  |
| rearRightClosed | boolean | no |  |
| trunkClosed | boolean | no |  |

### DetailedWindowStatus
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| frontLeftClosed | boolean | no |  |
| frontRightClosed | boolean | no |  |
| rearLeftClosed | boolean | no |  |
| rearRightClosed | boolean | no |  |
| trunkClosed | boolean | no |  |

### DigitalContract
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | digital contract id generated by the server |
| fleetId | string | yes | fleetId |
| profileId | string | yes | ProfileId of the user |
| creationDate | string (date-time) | no | The date the contract to sign was created |
| provider | string: `DOCUSIGN` | no | The provider of the digital signature |
| externalContractId | string | no | The id assigned to the contract by the provider |
| status | string: `CREATED`, `SIGNED` | yes | Contract current status |
| type | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | yes | Type of the document (vehicle inspection or digital contract) |
| bookingRequest | BookingRequest | no |  |

### DigitalContractCreationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | Fleet id |
| externalId | string | no | The id of the digital contract that is sent by the provider at creation time |
| profileId | string | yes | Profile id of the user |
| userId | string | yes | Id of the user |
| documentType | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the document |

### DigitalContractCreationOutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Digital contract id generated by the server |
| externalContractId | string | no | The id of the digital contract that is sent by the provider at creation time |
| type | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the contract |

### DigitalContractDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | digital contract id generated by the server |
| externalContractId | string | no | The id assigned to the contract by the provider |
| status | string: `CREATED`, `SIGNED` | no | Contract current status |

### DigitalContractsForBookingRequestOutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the contract |
| status | string: `CREATED`, `SIGNED` | no | Contract current status |
| provider | string: `DOCUSIGN` | no | The provider of the digital signature |
| creationDate | string (date-time) | no | The date the contract to sign was created |
| profileId | string | yes | Profile Id where the services are registered |
| externalContractId | string | no | The id of the digital contract that is sent by the provider at creation time |
| type | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the contract |

### DigitalContractWithBookingRequestIdOutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Digital contract id generated by the server |
| bookingRequestId | string | no | Booking request id related to the contract |
| externalContractId | string | no | The id of the digital contract that is sent by the provider at creation time |
| status | string: `CREATED`, `SIGNED` | yes | Contract current status |
| type | string: `SUBSCRIPTION_CONTRACT`, `RETURN_SUBSCRIPTION_CONTRACT`, `HANDOVER_SWAP`, `RETURN_SWAP`, `INSPECTION_DOCUMENT`, `HANDOVER_VEHICLE_INSPECTION_DOCUMENT`, `RETURN_VEHICLE_INSPECTION_DOCUMENT` | no | The type of the contract |

### DiscountsDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| systemCredits | SystemCreditsDiscountDTO | yes | The details of the system credits applied |
| billingGroup | BillingGroupDiscountDTO | yes | The details of the billing group advantages applied |
| mergedBillingGroup | BillingGroupDiscountDTO[] | yes | Merged billing group per name and rate. Cumulative documents only: this is the result of merging the billing group discounts of several trips |
| billingGroupDetails | BillingGroupDiscountDTO[] | no | One entry per rate applied by the billing group on this single trip or product: the ride rate and, since an earlier change, the rate of each discounted product… |

### DocumentByFranchiseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| serviceId | string | no |  |
| mandatoryDocumentTypeId | integer (int64)[] | no |  |

### DocumentByServiceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no |  |
| areMandatoryPresent | boolean | no |  |
| mandatoryDocumentTypeId | integer (int64)[] | no |  |

### DocumentDTO
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

### DocumentFullDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| documentType | DocumentTypeDTO | no |  |
| expirationDate | string (date-time) | no |  |
| approvalDate | string (date-time) | no |  |
| files | FileUrlDTO[] | no |  |
| uploadUrls | FileUrlDTO[] | no |  |
| status | string | no |  |
| reviewer | string | no |  |
| issuingCountry | string: `AD`, `AE`, `AF`, `AG`, `AI`, `AL`, `AM`, `AO`, `AQ`, `AR`, `AS`, `AT`, `AU`, `AW`, `AX`, `AZ`, `BA`, `BB`, `BD`, `BE`, `BF`, `BG`, `BH`, `BI`, `BJ`, `BL`, `BM`, `BN`, `BO`, `BQ`, `BR`, `BS`, `BT`, `BV`, `BW`, `BY`, `BZ`, `CA`, `CC`, `CD`, `CF`, `CG`, `CH`, `CI`, `CK`, `CL`, `CM`, `CN`, `CO`, `CR`, `CU`, `CV`, `CW`, `CX`, `CY`, `CZ`, `DE`, `DJ`, `DK`, `DM`, `DO`, `DZ`, `EC`, `EE`, `EG`, `EH`, `ER`, `ES`, `ET`, `FI`, `FJ`, `FK`, `FM`, `FO`, `FR`, `GA`, `GB`, `GD`, `GE`, `GF`, `GG`, `GH`, `GI`, `GL`, `GM`, `GN`, `GP`, `GQ`, `GR`, `GS`, `GT`, `GU`, `GW`, `GY`, `HK`, `HM`, `HN`, `HR`, `HT`, `HU`, `ID`, `IE`, `IL`, `IM`, `IN`, `IO`, `IQ`, `IR`, `IS`, `IT`, `JE`, `JM`, `JO`, `JP`, `KE`, `KG`, `KH`, `KI`, `KM`, `KN`, `KP`, `KR`, `KW`, `KY`, `KZ`, `LA`, `LB`, `LC`, `LI`, `LK`, `LR`, `LS`, `LT`, `LU`, `LV`, `LY`, `MA`, `MC`, `MD`, `ME`, `MF`, `MG`, `MH`, `MK`, `ML`, `MM`, `MN`, `MO`, `MP`, `MQ`, `MR`, `MS`, `MT`, `MU`, `MV`, `MW`, `MX`, `MY`, `MZ`, `NA`, `NC`, `NE`, `NF`, `NG`, `NI`, `NL`, `NO`, `NP`, `NR`, `NU`, `NZ`, `OM`, `PA`, `PE`, `PF`, `PG`, `PH`, `PK`, `PL`, `PM`, `PN`, `PR`, `PS`, `PT`, `PW`, `PY`, `QA`, `RE`, `RO`, `RS`, `RU`, `RW`, `SA`, `SB`, `SC`, `SD`, `SE`, `SG`, `SH`, `SI`, `SJ`, `SK`, `SL`, `SM`, `SN`, `SO`, `SR`, `SS`, `ST`, `SV`, `SX`, `SY`, `SZ`, `TC`, `TD`, `TF`, `TG`, `TH`, `TJ`, `TK`, `TL`, `TM`, `TN`, `TO`, `TR`, `TT`, `TV`, `TW`, `TZ`, `UA`, `UG`, `UM`, `US`, `UY`, `UZ`, `VA`, `VC`, `VE`, `VG`, `VI`, `VN`, `VU`, `WF`, `WS`, `YE`, `YT`, `ZA`, `ZM`, `ZW` | no |  |
| issuingOffice | string | no |  |
| issuingDate | string (date-time) | no |  |
| dlClass | string | no |  |
| issuingSubdivision | string | no | Subdivision code where the document was issued. - This field is required only if the document type requires it (`hasIssuingSubdivision` = true) |
| documentNumber | string | no |  |

### DocumentNotification
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | url to download the attachment (this url must be public) |
| fileName | string | yes | friendly file's name |

### DocumentStatusReview
the new document status
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | string: `MISSING`, `VALID`, `INVALID`, `EXPIRED`, `PENDING_REVIEW` | yes | Document's status: * MISSING: initial status at the document's creation * VALID: Document reviewed and approved * INVALID: Document reviewed and not valid * EX… |
| reviewer | string | yes | UserID of the operator who has done the review |

### DocumentSummaryDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentTypes | DocumentTypeDTO[] | no |  |
| documents | DocumentFullDTO[] | no |  |
| documentByService | DocumentByServiceDTO[] | no |  |
| documentByFranchise | DocumentByFranchiseDTO[] | no |  |

### DocumentType
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

### DocumentTypeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
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

### DocumentUpdateDto
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

### DoorsRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | integer (int32): `0`, `1` | no | possible action: 0 - Unlock doors 1 - Lock doors |

### EnergyServiceAdditionalInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| unitPrice | number | yes |  |
| measureUnit | string: `LITER`, `KWH` | yes |  |
| energyType | string: `FUEL`, `ELECTRIC`, `HYBRID`, `GASOLINE`, `DIESEL`, `GAS`, `PHEV_GASOLINE`, `PHEV_DIESEL`, `HUMAN`, `HYDROGEN_FUEL_CELLS` | yes |  |
| id | string | no |  |
| serviceId | string | no |  |

### EnergyServiceAdditionalInfoRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| unitPrice | number | yes |  |
| measureUnit | string: `LITER`, `KWH` | yes |  |
| energyType | string: `FUEL`, `ELECTRIC`, `HYBRID`, `GASOLINE`, `DIESEL`, `GAS`, `PHEV_GASOLINE`, `PHEV_DIESEL`, `HUMAN`, `HYDROGEN_FUEL_CELLS` | yes |  |

### EnergyServiceAdditionalInfoUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| unitPrice | number | yes |  |
| measureUnit | string: `LITER`, `KWH` | yes |  |

### EntityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the entity's creation by the system |
| fleetId | string | yes | fleetId |
| name | string | no | Entity friendly name |
| entityName | string | no | see entityName |
| type | string: `Family`, `Business`, `Personal` | yes | entity type |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INCOMPLETE`, `OUTSTANDING_BALANCE` | yes | entity's status |
| isMasterEntity | boolean | yes | If this entity is the master entity of the fleet |
| mandatoryTripNotes | boolean | no | True if trip notes are mandatory for this entity |
| billingGroupId | string | no | If set the entity belongs to this billing group |
| billingGroup | BillingGroupDTO | no |  |
| services | ServiceFull[] | no |  |

### EntityPaymentMethodDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the entity's creation by the system |
| fleetId | string | yes | fleetId |
| type | string: `Family`, `Business`, `Personal` | yes | entity type |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INCOMPLETE`, `OUTSTANDING_BALANCE` | yes | entity's status |
| token | string | no | entity's payment token generated by the payment provider |
| paymentMethod | string | yes | Type of payment method |
| walletType | string | no | The type of the card wallet, one of apple_pay, google_pay |
| mopStatus | string | yes | Status of the payment method |
| email | string | no | deprecated |
| provider | string | no | deprecated |
| customer | string | no | deprecated |

### EntityPiDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the entity's creation by the system |
| fleetId | string | yes | fleetId |
| name | string | no | Entity friendly name |
| entityName | string | no | see entityName |
| type | string: `Family`, `Business`, `Personal` | yes | entity type |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INCOMPLETE`, `OUTSTANDING_BALANCE` | yes | entity's status |
| isMasterEntity | boolean | yes | If this entity is the master entity of the fleet |
| mandatoryTripNotes | boolean | no | True if trip notes are mandatory for this entity |
| billingGroupId | string | no | If set the entity belongs to this billing group |
| billingGroup | BillingGroupDTO | no |  |
| billingAddress | AddressDTO | no | Billing address of the entity which will be in the invoice |
| fiscalCode | string | no | fiscal code |
| services | ServiceFull[] | no |  |

### Error
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | number | no | Http error code |
| codeStr | string: `vehicleError - temporary issue in the box installed in the vehicle`, `conditionNotMatch - The command has been rejected by the box because one of the preconditions has not been fulfilled`, `unexpectedError - temporary malfunction of one of our components`, `invalidArgument - An argument of the request is invalid or missing, please refer to the message field for further information`, `forbidden - the request has been blocked, please refer to the message field for further information`, `carConnectionProblem - The box is not actively communicating with the server because its asleep or there is a connectivity issue`, `noBox - This vehicle cannot be remotely managed.`, `ongoingCommand - Another command is already running on the vehicle`, `invalidTripUseState -  Action rejected by the box because its current state forbid this action. It may happen if an app doesn't check the result of its previous action before sending a new one or send concurrent requests.`, `excessiveCancelation - The user has tried to book too many times the same vehicle. It's an option to prevent than a user books and cancels just before the expiration of his booking several time. To keep the vehicle for itself during several hours.`, `notImplemented - Error returned when a BLE admin token is requested on a box which doesn't support BLE` | no | Error Code |
| message | string | no | Detailed error message |
| extraInfo | object | no | Extra information |
| transactionId | string | no | error's uuid. This id can be used by the Vulog team to investigate the origin |

### ErrorMsg
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| errorMessage | string | no | The error message |

### EstimatedProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | no |  |
| price | number | no |  |

### EventDTO
The event to add
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

### EventV2OutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| boxId | string | no |  |
| vehicleId | string | no |  |
| userId | string | no |  |
| origin | string | no |  |
| transactionId | string | no |  |
| type | string | no |  |
| date | string (date-time) | no |  |
| insertionDate | string (date-time) | no |  |
| failed | boolean | no |  |
| errorCode | integer (int32) | no |  |
| hasAlerts | boolean | no |  |
| gpsFix | string | no |  |
| hdop | number (double) | no |  |
| altitude | number (double) | no |  |
| nbSat | integer (int32) | no |  |
| mileage | number (double) | no |  |
| speed | number (double) | no |  |
| auxBatteryVoltage | number (double) | no |  |
| doorsAndWindowsClosed | boolean | no |  |
| charging | boolean | no |  |
| secured | boolean | no |  |
| pileLockOn | boolean | no |  |
| spareLockOn | boolean | no |  |
| helmetBoxLockOn | boolean | no |  |
| engineOn | boolean | no |  |
| plugged | boolean | no |  |
| immobilized | boolean | no |  |
| getcard1Present | boolean | no |  |
| getcard2Present | boolean | no |  |
| keyPresent | boolean | no |  |
| ckhOk | boolean | no |  |
| startSpeed | number (double) | no |  |
| endSpeed | number (double) | no |  |
| accelRate | number (double) | no |  |
| boxStatus | string | no |  |
| primaryFuelTank | object | no |  |
| secondaryFuelTank | object | no |  |
| tractionBattery | object | no |  |
| secondaryTractionBattery | object | no |  |
| doors | DetailedDoorStatus | no |  |
| windows | DetailedWindowStatus | no |  |
| extraInformation | CustomInfo[] | no |  |
| aima | object | no |  |
| message | string | no |  |
| duration | integer (int32) | no |  |
| errorMessage | string | no |  |
| locked | boolean | no |  |
| longitude | number (double) | no |  |
| latitude | number (double) | no |  |
| sessionId | string | no |  |

### ExpertRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cmd | string | yes | list of expert commands available |

### ExpiredDocumentsPerUserDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| userId | string | yes | userid of the document owner |
| documentId | integer (int64) | yes | DocumentId generated by the system at the document creation |
| documentType | string | no | type of document |
| expirationDate | string (date-time) | no | Expiration date of the document |

### FeeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| id | string | no |  |
| occurrences | integer (int32) | no |  |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | no |  |
| net | number | no |  |
| gross | number | no |  |
| taxes | Tax[] | no |  |
| percentage | number | no |  |

### FGResponse
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | integer (int32) | no | the response status (0 \| 1). |
| alert | string | no | the response message. |

### FileUrlDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| url | string | no |  |
| name | string | no |  |

### FilterProvider
Type: object

### FinancialInformationDTO
Here there is a rappresentation of the financial information
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pecAddress | string (email) | no | it's the legal email address for the italian market |
| personalVatNumber | string | no | it's the VAT number that can be assigned to a freelance or a professional figure |
| sdi | string | no | it's the 7 digit code for connect the electronic invoicing with the italian tax agency |
| marketReference | string: `ITALY`, `FRANCE`, `GERMANY`, `SPAIN`, `UK` | yes | The market of reference of these informations |

### FiscalInformationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fiscalCode | string | no | The fiscal code of the user |
| personalVatNumber | string | no | The personal VAT number of the user |
| sdi | string | no | The SDI of the user |
| pecAddress | string | no | The PEC address of the user |
| marketReference | string | no | The market reference of the user |

### FleetAdminFleetConfigurationAdminDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| maxTickets | integer | no |  |
| maxVehicles | integer | no |  |
| maxVehiclesModelInfo | integer | no |  |
| maxGroups | integer | no |  |
| maxUsers | integer | no |  |
| includeVehicleInUse | boolean | no |  |

### FleetAdminServiceDeskTicketAttachmentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| ticketId | string | no |  |
| attachmentId | string | no |  |
| uploadUrl | string | no |  |

### FleetAdminTicketAttachmentRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| filename | string | no |  |

### FlexibleCalendarResponseDto
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stationId | string | no |  |
| modelId | integer (int64) | no |  |
| availability | ScheduleTimeIntervalDto[] | no |  |

### ForceEndTripRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | no | Optional tripId/orderId for validation against the vehicle's active trip |
| cancel | boolean | no | Whether to cancel the trip instead of ending it normally |

### FreeTimeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| freeMinutes | integer (int32) | no |  |
| freeMinutesFrequency | string | no |  |

### GetAllPois
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetAllPoisFeature[] | no |  |

### GetAllPoisFeature
Type: object[]

### GetAllPoisGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetAllPoisGeoFeature[] | no |  |

### GetAllPoisGeoFeature
Type: object[]

### GetAllZones
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetAllZonesFeature[] | no |  |

### GetAllZonesFeature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | The zone name |
| version | integer (int32) | no | The zone version number |
| type | string: `allowed`, `forbidden`, `parking`, `operational` | no | The zone type (should be allowed or forbidden) |
| zoneId | string | no | The Zone unique ID |

### GetAllZonesGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetAllZonesGeoFeature[] | no |  |

### GetAllZonesGeoFeature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `Feature` | no | Feature type, will be 'Feature' |
| properties | object | no |  |
| geometry | object | no |  |

### GetGroupIdByGeolocVehicleResponse
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| groupId | integer (int32) | no |  |

### GetPoisGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetPoisGeoFeature[] | no |  |

### GetPoisGeoFeature
Type: object[]

### GetZoneGeo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `FeatureCollection` | no | Feature collection type, will be 'FeatureCollection' |
| features | GetZoneGeoFeature[] | no |  |

### GetZoneGeoFeature
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `Feature` | no | Feature type, will be 'Feature' |
| properties | object | no |  |
| geometry | object | no |  |

### GiftCard
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| email | string | no |  |
| amount | number | yes |  |
| expiryDate | string (date-time) | yes |  |
| usage | string: `PRIVATE`, `SHARED` | yes |  |
| message | string | no |  |

### Group2VehiclesDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| type | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | yes |  |
| intervalName | string | no |  |
| vehicleIds | string[] | no |  |

### GroupOfVehicleDTO
A group classify a list of vehicle. It's currently used for the dynamic pricing where you can assign a pricing strategy to a group.
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Group Unique Id |
| type | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | yes | Group type: * PRICING : group used for the dynamic pricing * CUSTOM: other type of group |
| intervalName | string | no | name of the interval used by the dynamic pricing engine |

### GroupsZonesByFleetIdResponse
Type: object

### GroupsZonesByZoneIdResponse
Type: object

### IdsDTOString
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ids | string[] | yes |  |

### IdsListRequest
the list of ids
Type: string[]

### IncentiveThreshold
Threshold for the incentive to recharge feature.
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| lowAutonomyLevel | number | yes | Autonomy level (km/miles or %) of the vehicle bellow which the system credit will be granted. |
| systemCreditAmount | number | yes | Amount of system credit to grant |

### IncludeNonNull
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | yes | The id of the business invoice |
| sequence | integer (int64) | yes | The number of the business invoice generated for a fleet by year (First invoice of a fleet of a given year will have a sequence number equal to 0, the second o… |
| invoiceDate | string (date-time) | yes | Invoice's creation date |
| updateDate | string (date-time) | yes | Invoice's update date |
| fleetId | string | yes | fleetId (cannot be updated) |
| invoiceYear | integer (int32) | yes | Invoice's year of creation |
| invoicesStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's current status |
| amount | number | yes | Invoice's total amount |
| total | PriceDTO | yes | Invoice's total amount with net, gross and taxes details |
| currency | string | yes | The currency of the invoice |
| entityId | string | yes | The id of the entity linked to the invoice |
| entityName | string | yes | The name of the entity linked to the invoice |
| attempts | integer (int32) | yes | The number of attempts done to pay the invoice |
| pspName | string | no | The last Payment Service Provider's name used to pay the invoice |
| pspReference | string | yes | The reference of payment of the invoice |
| tripExpensesCumulativeId | string | yes | The id to the list of trip expense for this invoice |
| type | string: `PRODUCT`, `TRIP` | yes | The type of the invoice (TRIP or PRODUCT) |
| pspIdempotency | string | yes | Payment Service Provider idempotency (security against double payment) |
| invoiceNumber | string | no |  |
| paymentInProgress | boolean | yes | Invoice's payment is on going |
| paymentDate | string (date-time) | no | Invoice's payment date |
| cancellationDate | string (date-time) | no | cancellation date |
| cancellationSequence | integer (int64) | no |  |

### InitialDuration
Contains the initial duration
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingDuration | number | no |  |
| pauseDuration | number | no |  |
| drivingDuration | number | no |  |
| duration | number | no |  |

### InstantRangeCursorRequestString
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| size | integer (int32) | no | page size (required for the first round) |
| direction | string: `ASC`, `DESC` | no | sort direction (required for the first round) |
| token | string | no | encrypted token used to retrieve a given page (required for the following rounds) |
| from | string (date-time) | no | creation date range start (required for the first round) |
| to | string (date-time) | no | creation date range end (required for the first round) |

### InvitationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| userId | string | no |  |
| inviteePromocodeId | integer (int64) | no |  |
| refereePromocodeId | integer (int64) | no |  |
| referralCode | string | no |  |

### Invoice
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the invoice |
| sequence | integer (int64) | yes | The number of the invoice generated for a fleet by year (First invoice of a fleet of a given year will have a sequence number equal to 0, the second one will b… |
| refundSequence | integer (int64) | no | The number of the invoice refunded for a fleet by year (First invoice of a fleet of a given year will have a refund sequence number equal to 0, the second one… |
| userId | string | yes | The id of the user linked to the invoice |
| pricingId | string | no | The id of the pricing used to calculate this invoice, can be null in case of invoice for a non-trip related product |
| tripId | string | no | The id of the trip linked to the invoice, can be null in case of invoice for non-trip related product |
| invoiceDate | string (date-time) | yes | Invoice's creation date |
| updateDate | string (date-time) | yes | Invoice's last update date |
| fleetId | string | yes | fleetId (cannot be updated) |
| invoiceYear | integer (int32) | yes | Invoice's year of creation |
| invoicesStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's current status |
| amount | number | yes | Invoice's total amount |
| productId | string | no | Invoice's related product id, for non trip related invoices only |
| currency | string | yes | The invoice currency |
| serviceId | string | no | The id of the service used to make a trip (for trip invoices only) |
| tokenId | string | no | Token used to pay the invoice |
| entityId | string | yes | The id of the entity linked to the invoice |
| amountPayWithSystemCredit | number | no | Amount of the invoice paid with system credits |
| walletId | string | no | *(deprecated)* The id of the wallet used to pay part of the invoice |
| attempts | integer (int32) | yes | The number of attempts done to pay the invoice |
| pspName | string | no | The last Payment Service Provider's name used to pay the invoice |
| pspReference | string | yes | The reference of payment of the invoice |
| withTaxRefundAmount | number | yes | Invoice's amount refunded with tax included |
| isRefunded | boolean | no | Invoice is refunded or not |
| paymentInProgress | boolean | yes | Invoice's payment is on going |
| subscriptionId | string | no | The subscription id linked to the invoice, for trip related invoice only |
| paymentDate | string (date-time) | no | Invoice's payment date |
| externalPaymentRequesterId | string | no | The id of the user who requested a payment externally |
| externalPaymentNotes | string | no | Notes about the external payment issued on the invoice |
| isPaidExternally | boolean | no | Invoice was paid externally or not |
| refundInProgress | boolean | no | Refund of the invoice is in progress |
| originId | string | no | User id who created the invoice (For non-trip related product invoices) |
| originRole | string | no |  |
| pspIdempotency | string | yes | Payment Service Provider idempotency (security against double payment) |
| paidExternally | boolean | no |  |
| refunded | boolean | no |  |
| productTaxIncluded | boolean | no |  |
| pspReferencePreAuth | string | no | Invoice's Payment Service Provider reference for Pre-Authorized payment |
| amountPreAuth | number | no | Amount used for Pre-Authorized payment |
| preAuthEnabled | boolean | no | Pre-Authorize active |

### InvoiceCumulative
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the business invoice |
| sequence | integer (int64) | yes | The number of the business invoice generated for a fleet by year (First invoice of a fleet of a given year will have a sequence number equal to 0, the second o… |
| invoiceDate | string (date-time) | yes | Invoice's creation date |
| updateDate | string (date-time) | yes | Invoice's update date |
| fleetId | string | yes | fleetId (cannot be updated) |
| invoiceYear | integer (int32) | yes | Invoice's year of creation |
| invoicesStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's current status |
| amount | number | yes | Invoice's total amount |
| currency | string | yes | The currency of the invoice |
| tokenId | string | no | Token used to pay the invoice |
| entityId | string | yes | The id of the entity linked to the invoice |
| attempts | integer (int32) | yes | The number of attempts done to pay the invoice |
| pspName | string | no | The last Payment Service Provider's name used to pay the invoice |
| pspReference | string | yes | The reference of payment of the invoice |
| tripExpensesCumulativeId | string | yes | The id to the list of trip expense for this invoice |
| type | string: `PRODUCT`, `TRIP` | yes | The type of the invoice (TRIP or PRODUCT) |
| startPeriod | string (date-time) | yes | The start date of the period of the business invoice |
| endPeriod | string (date-time) | yes | The end date of the period of the business invoice |
| paymentInProgress | boolean | yes | Invoice's payment is on going |
| paymentDate | string (date-time) | no | Invoice's payment date |
| externalPaymentRequesterId | string | no | The id of the user who requested a payment externally |
| refundInProgress | boolean | yes | Invoice's refund is on going |
| pspIdempotency | string | yes | Payment Service Provider idempotency (security against double payment) |
| originId | string | no |  |
| refundSequence | integer (int64) | no |  |
| withTaxRefundAmount | number | no |  |
| cancellationSequence | integer (int64) | yes | The number of the credit note business invoice generated for a fleet by year (First invoice of a fleet of a given year will have a sequence number equal to 0,… |
| cancellationDate | string (date-time) | no | Invoice's cancellation date |
| paidExternally | boolean | no |  |
| refunded | boolean | no |  |
| isPaidExternally | boolean | yes | Invoice was paid externally or not |

### InvoiceCumulativeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | yes | The id of the business invoice |
| sequence | integer (int64) | yes | The number of the business invoice generated for a fleet by year (First invoice of a fleet of a given year will have a sequence number equal to 0, the second o… |
| invoiceDate | string (date-time) | yes | Invoice's creation date |
| updateDate | string (date-time) | yes | Invoice's update date |
| fleetId | string | yes | fleetId (cannot be updated) |
| invoiceYear | integer (int32) | yes | Invoice's year of creation |
| invoicesStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's current status |
| amount | number | yes | Invoice's total amount |
| total | PriceDTO | yes | Invoice's total amount with net, gross and taxes details |
| currency | string | yes | The currency of the invoice |
| entityId | string | yes | The id of the entity linked to the invoice |
| entityName | string | yes | The name of the entity linked to the invoice |
| attempts | integer (int32) | yes | The number of attempts done to pay the invoice |
| pspName | string | no | The last Payment Service Provider's name used to pay the invoice |
| pspReference | string | yes | The reference of payment of the invoice |
| tripExpensesCumulativeId | string | yes | The id to the list of trip expense for this invoice |
| type | string: `PRODUCT`, `TRIP` | yes | The type of the invoice (TRIP or PRODUCT) |
| pspIdempotency | string | yes | Payment Service Provider idempotency (security against double payment) |
| invoiceNumber | string | no |  |
| paymentInProgress | boolean | yes | Invoice's payment is on going |
| paymentDate | string (date-time) | no | Invoice's payment date |
| cancellationDate | string (date-time) | no | cancellation date |
| cancellationSequence | integer (int64) | no |  |

### InvoiceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | yes | Invoice id (generated by the system) |
| productId | string | no | deprecated |
| currency | string | yes | currency |
| amountPayWithSystemCredit | number | yes | Invoice amount which has been payed using the system credits of the entity |
| walletId | string | yes | the id of the system credit wallet used |
| pspName | string | yes | Provider used to paid this invoice |
| pspReference | string | yes | Payment transaction id generated by the payment provider |
| paymentInProgress | boolean | no | True if the payment of this invoice is in progress (payment like wire transfer) can take several hours to be executed) |
| refundInProgress | boolean | no | True if the refund of this invoice is in progress (refundd like wire transfer) can take several hours to be executed) |
| paymentDate | string (date-time) | no | Date of the payment |
| externalPaymentRequesterId | string | no | UserId of the operator who has declared the external payment (if this invoice has been paid externally) |
| externalPaymentNotes | string | no | Details about the external payment |
| paidExternally | boolean | no |  |
| refunded | boolean | no |  |
| productTaxIncluded | boolean | no |  |
| billingDate | string (date-time) | yes | Invoice's creation date |
| billingStatus | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | yes | Invoice's Status |
| isPaidExternally | boolean | no | True if paid externally |
| reference | string | yes | Invoice reference |

### InvoiceHistoryByStatusesDTO
Contains the changes of the invoice status for every single invoiceId
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | yes | The invoiceId for the history changes |
| statusUpdateBreakdown | StatusChangeDTO[] | yes | The list of changes for this invoice |

### InvoiceStatusHistory
Contains the changes of the invoice status
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no |  |
| userRole | string | no |  |
| statusBefore | string | no |  |
| statusAfter | string | no |  |
| changeDate | string (date-time) | no |  |

### ItemAreaDTO
ItemAreaDTO object
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | id of area |

### ItemCommentDTO
ItemComment
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| description | string | yes |  |

### items
ItemDTO object
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

### JSONObject
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| empty | boolean | no |  |

### JsonPatch
Thejson patch to update the cancellation policy product
Type: object

### JsonSegmentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pricingId | string | no | unique ID of the pricing policy |
| pricingParameters | PricingParameters | no | 'level' that will use this pricing policy (fleet, model/service, ...) |
| product | object | no | not used |
| taxRates | TaxRatesDTO[] | no | the list of used tax rates |
| stopOver | UnitPrice[] | no | The stopover part of the basic pricing (with booking / driving) |
| overMileage | OverMileageDTO | no | The over mileage part (basic or interval) |
| mileageAllowanceStrategyDTO | MileageAllowanceStrategyDTO | no | The mileage allowance strategy (ranges) |
| percentageAllowanceStrategyDTO | PercentageAllowanceStrategyDTO | no | The percentage discount applied on a Trip duration |
| booking | UnitPrice[] | no | The booking part of the basic pricing (with stopOver / driving) |
| driving | UnitPrice[] | no | The driving part of the basic pricing (with stopOver / booking) |
| stopoverDrivingCap | UnitPrice[] | no |  |
| unlockFee | UnlockFeeDTO | no | The unlock fee pricing part (basic or interval) |
| bookingFee | BookingFeeDTO | no | The Booking fee duration (X minutes before the expire time) |
| pricingPackage | PricingPackageElementDTO[] | no | The pricing interval configuration (this one or basic pricing with stopOver / booking / driving) |
| pricingPackageWithDrivingStopover | PricingIntervalsElementDTO[] | no |  |
| plans | SubscriptionPlanDTO[] | no |  |
| taxIncluded | boolean | no |  |

### LabelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | yes | label id |
| name | string | yes | name |
| creationDate | string (date-time) | yes | creation date |

### LabelDTOGeoloc
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| labelId | string | no | The unique identifier of the label |
| fleetId | string (string) | no | The unique identifier of the fleet |
| name | string (string) | no | The dedicated name of the label |
| publicName | string (string) | no | The dedicated name of the label which will be available in the geojson of the zone |
| lastUpdateDate | string (date-time) | no | The last date time when the label has been updated. |
| createDate | string (date-time) | no | The last date time when the label has been updated. |

### ListLabels
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| data | LabelDTOGeoloc | no |  |

### Location
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| latitude | number (double) | no |  |
| longitude | number (double) | no |  |
| cap | number (double) | no | Heading in degree |
| gpsDate | string (date-time) | no | date of the latest position update sent by the vehicle's GPS |
| lastMovingDate | string (date-time) | no | date of the last time the vehicle has been detected as moving |
| geohash | string | no | geohash of the vehicle position |

### LockVehicleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| stationId | string | no |  |
| vehicleId | string | no |  |
| userId | string | no |  |
| keyInRedis | string | no |  |
| locked | boolean | no |  |

### LockVehicleWithTimersDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| stationId | string | no |  |
| vehicleId | string | no |  |
| userId | string | no |  |
| keyInRedis | string | no |  |
| locked | boolean | no |  |
| timeWindowLockInMinutes | integer (int32) | no |  |
| maximumTimeForReservationInMin | integer (int32) | no |  |
| remainingTimeBeforeTtlOverInMin | integer (int32) | no |  |

### LTRRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| boxId | string | yes | unique id of the box |
| tripReport | string | yes | Light trip report |
| version | number | no | Protocol's version the light trip report (currently 2) |

### ManualApprovalFileURLDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| url | string | no |  |
| name | string | no |  |
| uploadURL | string | no |  |

### ManualInvoiceUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| notes | string | no | The note for a manual invoice update |
| requesterId | string | yes | The id of the user making the update request |
| paymentMethod | string | yes | The mean of payment used |

### ManualPaymentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requiresActionReturnURL | string | no | return url passed to the payment provider, used at the end of a 3ds flow |
| online | boolean | no | true to specify that the shopper is online |
| scope | string: `DEPOSIT`, `RENTAL` | yes | return url passed to the payment provider, used at the end of a 3ds flow |
| amountType | string: `FIXED,PERCENTAGE` | no | Payment amount type, can be a fixed amount of a percentage |
| amountValue | number | no | amount that must override the payment parameter configuration (can be a percentage of a fixed value depending on installed configuration) |
| preferredPaymentMethods | PreferredPaymentMethod[] | no | list of payment method psp reference to use first for payment |

### MappingJacksonValue
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| value | object | no |  |
| filters | FilterProvider | no |  |

### MileageAllowanceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| allowancePerDay | number | no |  |
| totalAllowance | number | no |  |
| pricePerExceedingUnit | number | no |  |

### MileageAllowanceElementDTO
A rappresentation of a single strategy for a specific duration
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| lowRange | integer (int32) | yes | is the lowerbound value for this range |
| overValue | number | yes | is the allowed mileage/km for this range |
| overPrice | number | yes | is the price to be paid for the exceedence |

### MileageAllowanceStrategyDTO
Here a representation of the strategy allowance for the mileage
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | A name to be assigned at this strategy |
| hashForOvermileage | string | yes | An hash sha-256 for recognize the content of this strategy |
| ranges | MileageAllowanceElementDTO[] | yes | Contains a set of strategies to be applied by day |

### Model
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

### ModelCategory
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| name | string | no |  |
| description | string | no |  |
| imageUrl | string | no |  |
| enabled | boolean | no |  |

### ModelCategoryRequestDTO
Model category request body for create and update. Contains name, description, imageUrl, and optional enabled (on update, omit enabled to leave it unchanged). New categories default to enabled=true. fleetId is provided by the endpoint path, not the request body.
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Category name |
| description | string | no | Category description |
| imageUrl | string | no | URL to S3 image resource representing the category |
| enabled | boolean | no | When false, the category is kept for historical data but should not be offered for new use. On create, defaults to true if omitted. On update, omit to keep the… |

### ModelCategoryResponseDTO
Model category response. Categories can be optionally assigned to vehicle models. fleetId is exposed in the response but is not part of the request (it comes from the endpoint path).
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Category name |
| description | string | no | Category description |
| imageUrl | string | no | URL to S3 image resource representing the category |
| enabled | boolean | no | When false, the category is kept for historical data but should not be offered for new use. On create, defaults to true if omitted. On update, omit to keep the… |
| id | string | yes | Category Unique Id |
| fleetId | string | no | Fleet id this category belongs to |

### ModelDTO
Model object. Mainly used by the app to filter the vehicle's list based on criterias. If you update this resource, you can include only the fields which need to be updated
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

### ModelOverviewDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| vehicles | string[] | no |  |

### ModelScopeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelId | integer (int64) | yes | The model id of the association |

### ModifyTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pauseDuration | number | yes | The duration of the stop over part of the trip |
| bookingDuration | number | yes | The duration of the booking part of the trip |
| drivingDuration | number | yes | The duration of the driving part of the trip |
| notes | string | no | Notes related to the trip |

### MyProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | caller's userId |
| status | string: `CREATED`, `INCOMPLETE`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INACTIVE` | yes | caller's account status |
| lastName | string | yes | caller's last name |
| username | string | yes | caller's username/login |
| firstName | string | yes | caller's first name |
| language | string | yes | caller's prefered locale |
| roles | object | yes | List of caller's role per fleetId |
| services | object | yes | List of serviceId's that the caller is used to access (if empty all the services can be accessed) |
| timeZones | object | yes | List of cities with their timezone |
| vulogAdmin | boolean | no |  |

### NotifierBusinessRule
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| eventType | string | no |  |
| bearerType | string: `EMAIL`, `PUSH_NOTIFICATION`, `SMS`, `EMAIL_AND_SMS`, `FIREBASE`, `EMAIL_AND_SMS_AND_PUSH_NOTIFICATION`, `EMAIL_PUSH_NOTIFICATION`, `SMS_PUSH_NOTIFICATION` | no |  |
| dispatchType | string: `USER`, `GROUP`, `USER_AND_GROUP` | no |  |
| status | string: `ACTIVE`, `DISABLED` | no |  |
| dispatchToId | NotifierDispatchToId[] | no |  |
| dispatchBccId | NotifierDispatchToId[] | no |  |
| b2bSkip | boolean | no |  |

### NotifierBusinessRuleAddUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| bearerType | string: `EMAIL`, `PUSH_NOTIFICATION`, `SMS`, `EMAIL_AND_SMS`, `FIREBASE`, `EMAIL_AND_SMS_AND_PUSH_NOTIFICATION`, `EMAIL_PUSH_NOTIFICATION`, `SMS_PUSH_NOTIFICATION` | yes |  |
| dispatchType | string: `USER`, `GROUP`, `USER_AND_GROUP` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| dispatchToId | NotifierDispatchToId[] | yes |  |
| dispatchBccId | NotifierDispatchToId[] | yes |  |
| b2bSkip | boolean | no |  |

### NotifierBusinessRuleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| bearerType | string: `EMAIL`, `PUSH_NOTIFICATION`, `SMS`, `EMAIL_AND_SMS`, `FIREBASE`, `EMAIL_AND_SMS_AND_PUSH_NOTIFICATION`, `EMAIL_PUSH_NOTIFICATION`, `SMS_PUSH_NOTIFICATION` | yes |  |
| dispatchType | string: `USER`, `GROUP`, `USER_AND_GROUP` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| dispatchToId | NotifierDispatchToId[] | yes |  |
| dispatchBccId | NotifierDispatchToId[] | yes |  |
| b2bSkip | boolean | no |  |
| id | string | no |  |
| fleetId | string | no |  |

### NotifierConfigurationOption
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

### NotifierConfigurationOptionAddDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| defaultCategory | string | yes |  |
| defaultPriority | string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | yes |  |
| defaultSubject | string | yes |  |
| defaultTicketingGroup | integer (int32) | yes |  |

### NotifierConfigurationOptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | yes |  |
| defaultCategory | string | yes |  |
| defaultPriority | string: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | yes |  |
| defaultSubject | string | yes |  |
| defaultTicketingGroup | integer (int32) | yes |  |
| id | integer (int32) | yes |  |
| fleetId | string | yes |  |

### NotifierDispatchToId
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| brId | NotifierBusinessRule | no |  |
| idToDispatch | string | no |  |

### NotifierResponseMsg
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| message | string | no |  |

### NotifierTemplate
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes |  |
| fleetId | string | yes |  |
| templateType | string: `HTML`, `TEXT`, `JSON` | no |  |
| status | string: `ACTIVE`, `DISABLED` | no |  |
| language | string | no |  |
| body | string (byte) | yes |  |
| bodyFileName | string | yes |  |
| subject | string | no |  |
| eventType | string | no |  |

### NotifierTemplateAddUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| templateType | string: `HTML`, `TEXT`, `JSON` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| language | string | yes |  |
| subject | string | yes |  |
| eventType | string | yes |  |

### NotifierTemplateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| templateType | string: `HTML`, `TEXT`, `JSON` | yes |  |
| status | string: `ACTIVE`, `DISABLED` | yes |  |
| language | string | yes |  |
| subject | string | yes |  |
| eventType | string | yes |  |
| id | string | yes |  |
| fleetId | string | yes |  |

### OnGoingTripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| id | string | yes | Trip id (orderId) |
| fleetId | string | yes | fleetId |
| profileId | string | yes | ProfileId of the user who did the trip |
| vehicleId | string | yes | Vehicle used in the trip |
| serviceId | string | yes | service id |
| startDate | string (date-time) | yes | effective start date |

### Option
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| name | string | no |  |
| type | string | no |  |
| startDate | string | no |  |
| endDate | string | no |  |
| description | string | no |  |

### OptionDTO
Option object. Mainly used by the app to filter the vehicle's list based on criterias. An Option is an attribute which can be removed from the vehicle at anytime, like a baby seat or snow tires. If you update this resource, you can include only the fields which need to be updated
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | yes | Option Unique Id |
| fleetId | string | no | fleetId (cannot be updated) |
| name | string | yes | Option's name which will appears in the list of options (must be unique, and include only ascii characters) |
| type | string | no | Free text Used to group options (used in the app to display options with the same type on the same line) |
| startDate | string | no | not used, reserved for future use |
| endDate | string | no | not used, reserved for future use |
| description | string | yes | Free field to store any extra information (returned in the option's list of the mobile api) |

### OverMileageDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| distanceIncluded | number (double) | no | The distance included in the pricing (in km) |
| pricePerUnit | number (double) | no | The price charged for 1 km over the limit |

### OverriddenTripInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| duration | TripDurationDTO | no |  |
| customDiscount | CustomDiscountDTO | no |  |
| customBillingGroup | CustomBillingGroupDTO | no |  |
| additionalCharges | AdditionalChargesDTO | no |  |
| customEndDate | string (date-time) | no | The adjusted end date of the trip, computed from the edit trip duration |
| timingAdjustmentReason | string | no |  |

### Pageable
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| page | integer (int32) | no |  |
| size | integer (int32) | no |  |
| sort | string[] | no |  |

### PasswordDTO
json body including the password field
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| password | string | yes | user's password |

### PastSubscriptionBookingRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | yes |  |
| profileId | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| creationDate | string (date-time) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| cityId | string | no |  |
| pricingId | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| journeyId | string | no |  |
| station | string | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| returnedDate | string (date-time) | no |  |
| products | string[] | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| cancellationDate | string (date-time) | no |  |
| rollingContract | boolean | no |  |
| planDurationInMonths | integer (int32) | no |  |
| planName | string | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| parentId | string | no |  |
| previous | string | no |  |
| bookingReferenceId | string | no |  |

### PatchOperationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| op | string: `add`, `remove`, `replace` | no |  |
| path | string | no |  |
| value | object | no |  |

### PaymentBreakdownDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | payment receipt id |
| number | integer (int64) | yes | payment receipt number |
| date | string (date-time) | yes | Date of prepayment |
| paymentMethodType | string: `CREDIT_CARD,SEPA` | yes | related payment method type used for the payment |
| paymentMethodPspReference | string | yes | related payment method psp reference used for the payment |
| type | string | yes | Type of the payment |
| gross | number | yes | The amount of the payment (gross) |
| net | number | no | The amount of the payment (net) |
| taxes | Tax[] | no | Taxes of the payment |

### PaymentDetail
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | string | no | Payment token generated by the payment provider |
| holderName | string | no | Holder name declared in the psp (Cardholder namer) |
| fleetId | string | yes | fleetId |
| entityId | string | yes | Id of the entity on which the payment method is attached |
| pspName | string | yes | name of psp |
| customerPspReference | string | no | customer psp reference |
| entityStatus | string | yes | Status of the entity on which the payment method is attached |
| profileId | string | yes | Id of the profile on which the payment method is attached |
| profileName | string | yes | Profile name on which the payment method is attached |
| profileType | string | yes | Profile type on which the payment method is attached |
| paymentMethod | string: `SEPA`, `IDEAL`, `PAYPAL`, `CREDIT_CARD`, `WIRE_TRANSFER`, `EXTERNAL`, `SYSTEM_CREDIT` | yes | Type of payment method |
| mopStatus | string: `MOP_VALID`, `MOP_MISSING`, `MOP_EXPIRED`, `MOP_INVALID`, `MOP_UPDATING`, `MOP_UPDATE_FAILED`, `MOP_UNKNOWN` | yes | Status of the payment method |
| paymentCurrency | string | no | Payment currency |
| paymentType | string: `CARD`, `BANK`, `PAYPAL`, `SEPA`, `EXTERNAL` | no |  |

### PaymentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | payment object identifier |
| pspName | string | yes | related psp name |
| pspReference | string | yes | related psp reference |
| pspPublishableKey | string | no | related psp public key (available only when status is at 'REQUIRES_CONFIRMATION' or 'REQUIRES_ACTION') |
| amount | number | yes | related amount value |
| currency | string | yes | related Three-letter ISO currency code (https://www.iso.org/iso-4217-currency-codes.html) |
| date | string (date-time) | yes | related effective date |
| captureBefore | string (date-time) | yes | When using manual capture, a future timestamp at which the charge will be automatically refunded if uncaptured. |
| status | string: `AUTHORIZED, PAID, REFUSED, REFUNDED, CANCELLED` | yes | related status |
| paymentMethodType | string: `CREDIT_CARD, SEPA` | yes | related payment method type used for the payment |
| paymentMethodPspReference | string | yes | related payment method psp reference used for the payment |
| paymentIntentPspReference | string | no | related payment intent psp reference (for refund receipt) |
| number | integer (int64) | yes | unique receipt number |
| code | string | no | error code in case of status 'REFUSED' |
| declineCode | string | no | decline code in case of status 'REFUSED' |
| pspClientSecret | string | no | the client secret of this PaymentIntent. Used for client-side retrieval using a publishable key. The client secret can be used to complete a payment from your… |
| reason | string | no | a human-readable message in case of status 'REFUSED' |
| note | string | no | note in case of status 'REFUNDED' |
| nextAction | PaymentNextAction | no | if present, this property tells you what actions you need to take in order for your customer to fulfill a payment using the provided source (in case of status… |
| metadatas | object | no | related Set of key-value pairs attached to the payment object |

### PaymentEvent
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string: `payment_intent.succeeded,payment_intent.canceled,payment_intent.processing,payment_intent.requires_action,payment_intent.amount_capturable_updated,setup_intent.succeeded,setup_intent.canceled,setup_intent.setup_failed,setup_intent.requires_action,refund.updated,customer.updated` | yes | event type |
| data | object | yes | event object, can be a Customer, a Payment Intent, a Setup Intent or a PaymentRefund |
| previousAttributes | object | no | attributes changes that trigger this event. list of (key,value) pair where key is the name of updated attribute and value its previous value (new value is alre… |

### PaymentNextAction
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| nextActionRedirectUrl | PaymentNextActionRedirectUrl | yes | requires action redirect in case of status 'REQUIRES_ACTION' |
| type | string: `redirect_to_url` | yes | type of the next action to perform |

### PaymentNextActionRedirectUrl
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | string | yes | the URL you must redirect your customer in order to authenticate the intent |
| method | string: `POST,GET` | yes | the HTTP method to use |
| data | object | no | pair of (key,value) to pass as a form if method is set to POST |

### PaymentsTotalDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amountWithoutTax | number | yes | The net amount total |
| amountWithTax | number | yes | The gross amount total |
| taxAmount | number | yes | The tax amount total |

### PdfStreamingResponseBody
Type: object

### PercentageAllowanceElementDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| lowRange | integer (int32) | yes | is the lower_bound value for the element |
| percentageValue | number | yes | is the percentage price reduction applied for the element |

### PercentageAllowanceStrategyDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| ranges | PercentageAllowanceElementDTO[] | no |  |
| hash | string | no |  |

### PersonalCompanyDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| companyName | string | no | The company name of the user |
| companyVat | string | no | The company VAT of the user |
| companyAddress | AddressDTO | no | The company address of the user |

### PersonalInformationBirthDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| birthDate | string (date-time) | no | The birth date of the user |
| countryBirth | string | no | The country of birth of the user |
| provinceBirth | string | no | The province of birth of the user |
| cityBirth | string | no | The city of birth of the user |

### PersonalInformationDocumentDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no | The fleetId of the entity |
| userId | string | no | The id of the related user |
| documentId | integer (int64) | yes | DocumentId generated by the system at the document creation |
| documentNumber1 | string | no | The document number |
| updateDate | string (date-time) | no | The date of last update |

### PersonalInformationForUserIdsRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userIds | string[] | no |  |

### PersonalInformationForUserIdsResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | PersonalInformationUserDTO[] | no |  |
| data | PersonalInformationUserDTO[] | no |  |

### PersonalInformationIdentityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | string | no | The first name of the user |
| lastName | string | no | The last name of the user |
| middleName | string | no | The middle name of the user |
| preferredName | string | no | The preferred name of the user |

### PersonalInformationProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | userId |
| fleetId | string | yes | fleetId |
| profileId | string | no | The ID of the profile |
| idNumber | string | no | The ID number of the user |
| phoneNumber | string | no | The phone number of the user |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| billingAddress | AddressDTO | no | The billing address of the user |
| updateDate | string (date-time) | no | The date of last update |

### PersonalInformationSearchRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| username | string | no |  |
| phoneNumber | string | no |  |
| email | string | no |  |

### PersonalInformationSearchResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | PersonalInformationUserDTO[] | no |  |
| data | PersonalInformationUserDTO[] | no |  |

### PersonalInformationUserDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no | The fleetId of the entity |
| userId | string | no | The id of the related user |
| userName | string | no | The user name of the user |
| identity | PersonalInformationIdentityDTO | no | user's identity lastname, firstname... |
| birth | PersonalInformationBirthDTO | no | Birth information |
| nationality | string | no | Nationally of the user |
| notes | string | no | Notes for the user info |
| gender | string: `MALE`, `FEMALE`, `UNDEFINED` | no |  |
| personalCompany | PersonalCompanyDTO | no | The company of the user |
| fiscalInformation | FiscalInformationDTO | no | The fiscal information of the user |
| address | AddressDTO | no | The address of the user |
| membership | string | no | The membership of the user |
| updateDate | string (date-time) | no | The date of last update |

### PinCodeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pinCode | string | no |  |

### PlanCityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cityId | string | no |  |
| serviceIds | string[] | no |  |

### PlanRequestDTO
PlanDTOCreateOrUpdate object
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

### PlanResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| name | string | no |  |
| fleetId | string | no |  |
| period | string: `WEEK`, `MONTH`, `ANNUAL` | no |  |
| productId | string | no |  |
| systemCreditIncluded | number | no |  |
| systemCreditFrequencyMonthlyRenewal | boolean | no |  |
| billingGroupId | string | no |  |
| billingGroupDiscount | number | no |  |
| milesIncluded | integer (int32) | no |  |
| price | number | no |  |
| cities | PlanCityDTO[] | no |  |
| status | string: `ACTIVE`, `INACTIVE` | no |  |
| periodicTimeWallet | FreeTimeDTO | no |  |
| services | string[] | no |  |

### Position
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| latitude | number (double) | no |  |
| longitude | number (double) | no |  |

### PossibleExtensionDateResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| possibleExtensionDate | string (date-time) | yes | Date until when the current booking might by extended |

### PreallocatedVehiclesDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingRequestId | string | no |  |
| vehicleId | string | no |  |

### PreferredPaymentMethod
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pspReference | string | yes |  |
| amount | number | no |  |

### PrePaymentEstimationRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| extensionDate | string (date-time) | yes | Date until when the current booking might by extended |
| extensionStartDate | string (date-time) | no | Date until when the current booking might by extended from start date |

### PrePaymentEstimationResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| extensionDate | string (date-time) | yes | Date until when the current booking might by extended |
| extensionStartDate | string (date-time) | no | Date until when the current booking might by extended from start date |
| estimatedPrice | number | no | An estimation of the price for this extension |
| estimatedPrepaymentAmount | number | no | An estimation of the amount to be prepaid for this extension |

### PriceAmount
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | yes | The net amount |
| gross | number | yes | The gross amount |
| taxes | Tax[] | yes | The list of taxes |
| breakdownDetails | BreakdownDetails[] | no | The detailed breakdown of all the price amount applied with extended information |
| pricingBreakdowns | PricingBreakdown \| PricingOverMileageBreakdown \| PricingPackagesBreakdown[] | no | The pricing breakdown applied |
| percentage | number | no | The percentage applied |
| cappedPercentage | number | no | The capped percentage |
| walletOrigin | string | no | The wallet origin |

### PriceBreakdown
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | no |  |
| gross | number | no |  |
| taxAmount | number | no |  |
| taxes | Tax[] | no |  |

### PriceBreakdownDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripPrice | number | no |  |
| productsPrice | number | no |  |
| productDetails | EstimatedProductDTO[] | no |  |
| deductiblePrice | number | no |  |

### PriceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| gross | number | yes | The gross amount |
| net | number | yes | The net amount |
| taxes | Tax[] | yes | The list of taxes applied on the net amount |

### PriceIntervalElementDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| trip | number (float) | no |  |
| driving | number (float) | no |  |
| stopover | number (float) | no |  |

### PricingBreakdown
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| priceBreakdown | PriceBreakdown | no |  |
| quantity | number | no |  |
| pricePerUnit | number | no |  |

### PricingCatalogueArchiveDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | no | ID of user who is performing the action |
| archived | boolean | yes | true if the pricing catalog must be archived |

### PricingCatalogueRequestDTO
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

### PricingCatalogueResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The pricing catalog unique ID |
| fleetId | string | yes | The ID of the fleet |
| name | string | no | The pricing catalog name |
| operatorId | string | no | The ID of user who made the last update of the pricing catalog |
| archived | boolean | no | true if the pricing catalog is archived |
| updateDate | string (date-time) | no | the last update date (format yyyy-MM-dd'T'HH:mm:ss.SSSXXX) |
| creationDate | string (date-time) | no | the creation date (format yyyy-MM-dd'T'HH:mm:ss.SSSXXX) |
| taxRates | TaxRatesDTO[] | no | the list of used tax rates |
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

### PricingDetails
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pricingId | string | no |  |
| providerType | string: `TIMERANGE`, `CALENDAR`, `CUSTOM_PRICE`, `DEFAULT` | no |  |

### PricingInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pricingId | string | no |  |
| type | string | no |  |
| priceBreakdown | PriceBreakdownDTO | no |  |

### PricingIntervalsElementDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| duration | integer (int32) | no |  |
| name | string | no |  |
| price | PriceIntervalElementDTO | no |  |

### PricingOverMileageBreakdown
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| priceBreakdown | PriceBreakdown | no |  |
| quantity | number | no |  |
| pricePerUnit | number | no |  |
| capKm | number | no |  |
| pricePerUnitAfterFuel | number | no |  |

### PricingPackageElementDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| duration | integer (int32) | yes | the interval max duration in minutes |
| lowerIntervalDuration | integer (int32) | no | the interval minimum duration in minutes |
| name | string | yes | the interval mame |
| price | number (float) | yes | the interval price |
| distanceIncluded | number (double) | no | The distance included in the pricing (in km) |
| pricePerUnit | number (float) | no | The price charged for 1 km over the limit |

### PricingPackagesBreakdown
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| priceBreakdown | PriceBreakdown | no |  |
| quantity | number | no |  |
| pricePerUnit | number | no |  |
| duration | number | no |  |
| intervalName | string | no |  |
| lowerIntervalDuration | number | no |  |

### PricingParameter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| pricing | SegmentJson | no |  |
| fleetId | string | no |  |
| entityId | string | no |  |
| modelId | string | no |  |
| serviceId | string | no |  |
| planId | string | no |  |
| groupId | string | no |  |
| vehicles | Vehicle[] | no |  |
| operatorId | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |

### PricingParameterRequestDTO
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

### PricingParameterResponseDTO
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
| id | string | no | The Pricing parameter unique ID |
| fleetId | string | no | The ID of the fleet |
| creationDate | string (date-time) | no | The Pricing parameter creation date (yyyy-MM-dd'T'HH:mm:ss'Z') |
| updateDate | string (date-time) | no | The Pricing parameter last update date (yyyy-MM-dd'T'HH:mm:ss'Z') |

### PricingParameters
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelId | integer (int64) | no | The ID of vehicle model linked to the pricing policy |
| serviceId | string | no | The ID of service linked to the pricing policy |
| vehicleId | string | no | The ID of vehicle linked to the pricing policy (NOTICE: this should disappear) |
| planId | string | no | The ID of subscription plan linked to the pricing policy |
| groupId | string | no | The ID of the vehicle group linked to the pricing policy |
| entityId | string | no | The ID of the entity linked to the pricing policy |

### PricingVehicleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | no | ID of vehicle concerns by the pricing |
| pricingId | string | no | ID of pricing tu use for this vehicle |
| type | string | no | the type of pricing : vehicle \| model \| service \| fleet \| group \| group_model (legacy) |
| defaultPricingType | string | no | the type of default pricing |
| groupName | string | no | the group name (if any) |
| groupId | string | no | the group Id (if any) |
| groupType | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | no | the group type (if any) |
| defaultPricing | string | no | the default pricing ID |

### PricingVehicleInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no | ID of service concerned |
| vehicles | PricingVehicleDTO[] | no | list of pricing for each vehicle assigned to the current service |

### Product
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| price | number | yes |  |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes |  |
| name | string | no |  |
| taxName | string | no |  |
| taxRate | number | no |  |
| taxIncluded | boolean | no |  |
| expirationDate | string (date-time) | no |  |
| walletPayable | boolean | no |  |

### ProductDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the product |
| fleetId | string | yes | The id of the fleet |
| modelIdsByServiceId | object | yes | The Map of model by service associated with the product |
| serviceIds | string[] | yes | The list of services associated with the product |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes | The type of the product |
| price | number | yes | The price amount of the product |
| name | string | yes | The name of the product |
| taxIncluded | boolean | yes | Is the tax included in the price amount |
| expirationDate | string (date-time) | yes | The expiration date of the product of the product |
| taxName | string | yes | The name of the tax applied on the product |
| taxRate | number | yes | The rate of the tax applied on the product |
| taxes | TaxDTO | yes | The list of taxes applied to the product |
| priceRate | number | no |  |
| pricePerUnitExceedingAllowance | number | no |  |
| distanceIncluded | number | no |  |
| active | boolean | no |  |
| systemCreditsAvailable | number | no |  |
| isGlobalWallet | boolean | no |  |
| validityDays | integer (int32) | no |  |
| getxMinutesBefore | integer (int32) | no | Mandatory for scheduled booking cancellation fee, it's the number of minutes the customer is allowed before having to pay the cancellation fee |
| percentage | number | no | If the product supports a percentage amount, this property provides the value of the percentage |
| walletPayable | boolean | no | Defines the possibility to pay the product by system credits |
| pricePerHour | number | no | Price per hour |
| pricePerDay | number | no | Price per hour |
| pricePerTrip | number | no | Price per Trip |
| freeMinutes | integer (int32) | no | Free Minutes to apply with system credits packages |
| extensionTime | integer (int32) | no | Extension Time in MINUTES to apply to the booking expiration date |

### ProductGroup
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | yes |  |
| name | string | yes |  |
| status | string: `ACTIVE`, `ARCHIVED` | yes |  |

### ProductGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Id of the group of produts |
| name | string | yes | Name of the group of products |
| productIds | string[] | yes | list of product ids |
| status | string | no | Status of the group of product |

### ProductRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| price | number | no |  |
| serviceIds | string[] | no |  |
| type | string: `EXCESS_MILEAGE_PACKAGE`, `INSURANCE`, `ADD_ON`, `TRIP_RELATED`, `REGISTRATION_FEE`, `CUSTOM`, `FEE_START_ZONE`, `FEE_END_ZONE`, `DEPOSIT`, `SCHEDULED_TRIP_CANCELLATION_FEE`, `SCHEDULED_TRIP_EARLY_CANCELLATION_FEE`, `SCHEDULED_TRIP_FEE`, `SUBSCRIPTION`, `PVRT`, `BC_PVRT`, `SUBSCRIPTION_CUSTOM_FEE`, `SYSTEM_CREDITS_PACKAGES`, `SCHEDULED_BOOKING_CANCELLATION_FEE`, `SCHEDULED_BOOKING_ONE_WAY_FEE`, `DAMAGE_WAIVER`, `SUBSCRIPTION_MVS_FEE`, `DELIVERY_FEE`, `FUEL`, `CANCELLATION_POLICY`, `GIFT_CARD`, `BOOKING_EXTENSION_FEE` | yes |  |
| name | string | yes |  |
| taxRate | number | no |  |
| taxName | string | no |  |
| taxIncluded | boolean | yes |  |
| expirationDate | string (date-time) | no |  |
| zones | string[] | no |  |
| priceRate | number | no |  |
| pricePerUnitExceedingAllowance | number | no |  |
| distanceIncluded | number | no |  |
| active | boolean | no |  |
| isGlobalWallet | boolean | no |  |
| getxMinutesBefore | integer (int32) | no |  |
| percentage | number | no |  |
| walletPayable | boolean | no |  |
| pricePerHour | number | no |  |
| pricePerDay | number | no |  |
| pricePerTrip | number | no |  |
| freeMinutes | integer (int32) | no |  |
| systemCreditsAvailable | number | no |  |
| validityDays | integer (int32) | no |  |
| extensionTime | integer (int32) | no |  |

### ProductScopeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | no | The ID of the product |
| modelId | string | no | The ID of the vehicle model linked to this Product |
| serviceId | string | no | The ID of the service linked to this Product |

### ProductUpdateDTO
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

### ProfileBasicDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| userId | string | yes | userId |
| fleetId | string | yes | fleetId |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | no | This status can be used to block a certain profile without impacting the other. |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| entity | EntityPiDTO | no |  |
| isBillingInProgress | boolean | no | Used with some specific payment providers (Alipay, wechat pay) to block any new booking until the payment of the latest trip haas been confirmed |

### ProfilePiDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| userId | string | yes | userId |
| fleetId | string | yes | fleetId |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | no | This status can be used to block a certain profile without impacting the other. |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| entity | EntityPiDTO | no |  |
| isBillingInProgress | boolean | no | Used with some specific payment providers (Alipay, wechat pay) to block any new booking until the payment of the latest trip haas been confirmed |
| phoneNumber | string | no | Phonenumber links to the profile |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| identificationNumber | string | no | *(deprecated)* deprecated |
| financialInformation | FinancialInformationDTO | no | Contains the eventual financial information related to this profile |

### ProfileServiceRegistrationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profileId | string | yes | Profile Id where the services are registered |
| profileType | string | yes | Type of profile: Business or Single |
| profileStatus | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | yes | Status of the profile |
| services | ServicesRegistrationListDTO | yes | List of services breakdown by registration status |
| reasonsForChange | ServiceRegistrationWithReasonDTO[] | yes | List of services linked to a reason why the status changed |

### ProfileStatusDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| phoneNumber | string | no | Phonenumber links to the profile |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| entityId | string | no |  |
| entityName | string | no |  |
| fiscalCode | string | no |  |
| billingGroup | BillingGroupDTO | no |  |
| status | string: `APPROVED`, `OUTSTANDING_BALANCE`, `MOP_MISSING`, `MOP_EXPIRED`, `MOP_INVALID`, `ENTITY_PENDING`, `ENTITY_SUSPENDED`, `ENTITY_REJECTED`, `ENTITY_ARCHIVED`, `SUSPENDED`, `ARCHIVED`, `REJECTED`, `INACTIVE`, `MOP_UPDATING`, `MOP_UPDATE_FAILED`, `UNKNOWN` | no | Composite status build based on the status of the entity attached to this profile |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| services | ServiceStatusDTO[] | yes | List of services registered on this profile |
| financialInformation | FinancialInformationDTO | no | Contains the eventual financial information related to this profile |
| billingInProgress | boolean | no |  |

### ProfileWithEntityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique id generated at the profile's creation by the system |
| fleetId | string | yes | fleetId |
| phoneNumber | string | no | Phonenumber links to the profile |
| email | string (email) | no | The user must have at least one profile with an email set to receive the reset password email |
| emailConsent | boolean | no | The user accepts to receive emails from the operator |
| identificationNumber | string | no | *(deprecated)* deprecated |
| creationDate | string (date-time) | no | Creation date |
| updateDate | string (date-time) | no | update date |
| rfid | string | no | RF id of the badge associated to this profile. This information is used to authentify the user when it tries to book a vehicle |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `INACTIVE`, `ARCHIVED`, `PENDING_REGISTRATION` | no | This status can be used to block a certain profile without impacting the other. |
| name | string | no | Friendly name of the profile |
| type | string: `Family`, `Business`, `Single`, `ALL` | no | Type of profile |
| entity | EntityPiDTO | no |  |
| isBillingInProgress | boolean | no | Used with some specific payment providers (Alipay, wechat pay) to block any new booking until the payment of the latest trip haas been confirmed |
| financialInformation | FinancialInformationDTO | no | Contains the eventual financial information related to this profile |

### PromoCode
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no | PromocodeId |
| fleetId | string | no | fleetId |
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
| usages | PromoCodeUsage[] | yes | promoCodeUsages |

### PromoCodeCsvLine
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reference | string | no |  |
| effectiveDate | string | no |  |
| expiryDate | string | no |  |
| validityDuration | string | no |  |
| validityEndDate | string | no |  |
| amount | string | no |  |
| walletUsage | string | no |  |
| isOneTime | string | no |  |
| reason | string | no |  |

### PromoCodeCsvUploadReport
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| totalSubmittedRows | integer (int32) | no |  |
| totalInsertedRows | integer (int32) | no |  |
| alreadyExists | PromoCodeWithCsvLine[] | no |  |
| missingReference | PromoCodeWithCsvLine[] | no |  |
| otherCause | PromoCodeWithCsvLine[] | no |  |

### PromoCodeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | The promo code name |
| percentageDiscount | number | no | The discount rate of the promo code used |
| cappedPercentage | number | no | The capped percentage of the promo code |
| discountCategory | string: `CREDITS`, `PERCENTAGE` | no | The discount category : PERCENTAGE or CREDITS |
| net | number | yes | The net amount of the promo code used |
| gross | number | yes | The gross amount of the promo code used |
| taxes | TaxDto[] | yes | The list of taxes of the promo code used |

### PromoCodeHistory
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| entity id  | string | yes | entity who redeemed the promo code |
| usageDate | string (date-time) | yes | date used - date the user redeemed the promo |

### PromoCodeRequestDTO
PromoCode Request Object
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

### PromoCodeResponseDTO
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
| id | integer (int64) | no | PromocodeId |
| fleetId | string | no | fleetId |
| registration | boolean | no |  |
| usages | PromoCodeUsageDTO[] | yes | promoCodeUsages |

### PromoCodeUsage
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| walletUsage | string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL` | yes | wallet usage |
| discountCategory | string: `CREDITS`, `PERCENTAGE` | no | Promocode usage type |
| percentage | number | no | percentage - rate of the promo code to trip price |
| amount | number | no | amount Notes: amount of the promo code to redeem |
| cappedPercentage | number | no |  |
| isOneTimeUsage | boolean | no | isOneTimeUsage if this usage is one time only |
| productGroup | ProductGroup | no |  |

### PromoCodeUsageDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| walletUsage | string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL` | no |  |
| discountCategory | string: `CREDITS`, `PERCENTAGE` | no |  |
| percentage | number | no |  |
| amount | number | no |  |
| cappedPercentage | number | no | Maximum discount limit for percentage-based calculations, The value must be positive and is expressed in monetary units, not as a percentage. Represents the up… |
| isOneTimeUsage | boolean | no |  |
| productGroup | ProductGroupDTO | no | productGroup Notes:ProductGroup used to group products for whitelisting, it can be null in case a wallet can be used to pay all kinds of products |

### PromoCodeWithCsvLine
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no | PromocodeId |
| fleetId | string | no | fleetId |
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
| lineNumber | integer (int32) | no |  |
| registration | boolean | no |  |
| usages | PromoCodeUsage[] | yes | promoCodeUsages |

### RateRefundableDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxRate | number | no | Normalized VAT rate, same normalization as the refs |
| refundableAmount | number | no | Validation cap: the POST rejects a per-rate refunded sum above this amount |

### RedeemDTO
RedeemDTO object
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | userId |
| entityId | string | no | entityId |
| invitationId | string | no | invitationId |

### ReferralInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| referralUserId | string | no | UserId of user |
| referralCode | string | yes | referal code |
| referralPromocodeId | integer (int64) | no |  |
| refereePromocodeId | integer (int64) | no |  |

### RefundableAmountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| invoiceId | string | yes | The id of the invoice |
| fleetId | string | yes | fleetId (cannot be updated) |
| refundableAmount | number | yes | The maximum amount refundable for the invoice |
| currency | string | yes | The currency |
| refundablePaymentReceipts | PaymentDTO[] | no |  |
| refundedPaymentReceipts | PaymentDTO[] | no |  |
| refundableItems | RefundableItemDTO[] | no | refundable lines, one per (category x tax rate), purely informative (no per-item cap) |
| refundableByRate | RateRefundableDTO[] | no | per-rate validation caps (1:1 with the POST checks), for client-side pre-validation only; not summable amounts |

### RefundableItemDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ref | string | no | Natural line key: {segmentType\|productName}-{normalizedTaxRate} |
| name | string | no | Display name: the segmentType or productName |
| taxRates | number[] | no | Normalized VAT rates of the line — several entries only for a multi-tax line (the electronicInvoice groups by each numeric rate, Factur-X BG-23) |
| originalPrice | number | no | Original gross price of the line, before discounts/credits — display guideline only, NOT the maximum refundable amount |
| multiTax | boolean | no | True when the line carries several coupled taxes (refunded together via the combined ref) |

### RefundAmountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | no | Amount to refund |
| note | string | no | Note related to the refund |
| refundItems | RefundItemDTO[] | no | lines selected by the operator to refund, each as a natural ref (echoed from GET .../refundableAmount) plus the TTC amount to refund. When present, drives the… |
| paymentIntentPspReference | string | no | Payment Intent psp reference |

### RefundItemDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ref | string | no | Natural line key echoed from GET .../refundableAmount: {segmentType\|productName}-{normalizedTaxRate} |
| amount | number | no | Gross amount (TTC) to refund for this line |

### ReleaseRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | id of trip to release |

### Report
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | id of report |
| userId | string | yes | User Id |
| vehicleId | string | yes | Vehicle Id |
| tripId | string | no | The id of the vehicle |
| serviceId | string | no | The id of the service used |
| fleetId | string | yes | fleetId |
| latitude | number (double) | no | Latitude |
| longitude | number (double) | no | Longitude |
| timeline | string: `AFTER_TRIP`, `BEFORE_TRIP`, `DURING_TRIP` | no |  |
| creationDate | string (date-time) | no |  |

### ReportDTO
ReportDTO object
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

### ReportTemplateDTO
ReportTemplateDTO object
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no | template name |
| modelId | string | no | template modelId |
| baseUrl | string | no | template baseUrl |

### RequiredChangeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| changeKey | string | no |  |
| changeValue | string | no |  |
| previousValue | string | no |  |
| type | string: `UPDATE`, `DELETE` | no |  |
| fleetId | string | no |  |

### ResponseSummaryDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| requests | integer (int32) | no |  |
| timeElapsed | integer (int64) | no |  |

### Result
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| result | string | no | the result of the command |

### RFIDCardDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| tag | string | yes | tag |
| vehicleId | string | no | vehicleId |
| description | string | no | description |
| pinCode | string | no | pinCode |
| updateDate | string (date-time) | no | updateDate |

### ScheduledNotification
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| bookingRequest | BookingRequest | no |  |
| dateToNotify | string (date-time) | no |  |
| notificationType | string | no |  |
| userId | string | no |  |
| locale | string | no |  |
| notifLastDt | string (date-time) | no |  |
| notifCount | integer (int32) | no |  |

### ScheduledNotificationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingRequestId | string | no | Booking request |
| userId | string | no |  |
| stationId | string | no |  |
| minutesLeft | integer (int32) | no | Minutes left for the trip |
| vehiclePlate | string | no | The plate of the vehicle |
| vehicleModelName | string | no | The model name of the vehicle |
| bookingReferenceId | string | no | Booking reference id |
| serviceName | string | no | service Name |
| serviceType | string | no | service type |
| firstName | string | no | User's first name |
| lastName | string | no | User's last name |
| endDate | string | no | Booking end date in ISO-8601 UTC format |
| timeZone | string | no | Timezone for date formatting (city timezone from service) |
| email | string | no | User's email address (from profile - Business or Single based on booking context) |
| phoneNumber | string | no | User's phone number (from profile - Business or Single based on booking context) |

### ScheduleTimeIntervalDto
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| from | string (date-time) | yes | Start date of interval |
| to | string (date-time) | yes | Start date of interval |

### SearchVehicle
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| latitude | number (double) | yes | latitude of the centre of the circle. |
| longitude | number (double) | yes | longitude of the centre of the circle. |
| radius | integer (int32) | yes | radius of the circle in kilometers/miles |
| userId | string | no | id of the user who search vehicles. |
| vehicleIds | string[] | no |  |

### SecurityMarginDTO
Contains all the information about a security margin
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | name of the security margin |
| combinations | SecurityMarginDTO[] | no | list of combinations (service/model) |
| bookingSecurityMarginMinutes | integer (int32) | yes | value in minutes of the security margin (upper bound is configurable via the booking.securityMargin.maxMinutes property, default 10080 min = 7 days) |

### SegmentJson
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| jsonSegment | string | yes |  |
| fleetId | string | yes |  |
| version | integer (int32) | yes |  |
| enable | boolean | no |  |
| userId | string | no |  |
| name | string | no |  |
| updateDate | string (date-time) | no |  |
| creationDate | string (date-time) | no |  |
| deleteConfig | boolean | no |  |

### Service
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| name | string | no |  |
| status | string: `ACTIVE`, `DISABLED` | no |  |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | no |  |
| maxConcurrentTrips | integer (int32) | no |  |
| bookingValidity | integer (int32) | no |  |
| visibility | string: `PUBLIC`, `PRIVATE` | no |  |
| autoApprovalStrategy | string: `MANUAL`, `CITY_SCOPED_STRICT`, `CITY_SCOPED`, `FRANCHISE_SCOPED_STRICT`, `FRANCHISE_SCOPED` | no |  |
| tripPrivacyStrategy | string: `TRACKING`, `TRACKING_PAUSE`, `NO_TRACKING` | no |  |
| zoneFillColor | string | no |  |
| zoneOutlineColor | string | no |  |
| uxMode | string | no |  |
| highestRangeEnabled | boolean | no |  |
| scheduleAtripEnabled | boolean | no |  |
| zoneCheckEnabled | boolean | no |  |
| isCustomPricingEnabled | boolean | no |  |
| maxAdditionalDrivers | integer (int32) | no |  |
| nearEndThreshold | integer (int32) | no |  |
| nextOverdueReturnNotification | integer (int32) | no |  |
| maxOverdueReturnNotifications | integer (int32) | no |  |
| tripDurationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | no | Custom trip duration calculation options |
| handDeliveryEnabled | boolean | no |  |
| stationAvailableSpotCheckingEnabled | boolean | no |  |
| requiredManualApproval | boolean | no |  |
| extensionsBillingMode | string: `ON_TRIP`, `ON_EXTENSION` | no |  |
| dstManagement | boolean | no |  |
| excludeFromBilling | string: `Business`, `Single`, `ALL`, `NONE` | no |  |
| separateInvoice | boolean | no |  |
| gracePeriodInMinutes | integer (int32) | no |  |
| bleStartFlow | boolean | no |  |
| insuranceMandatory | boolean | no |  |
| depositRequired | boolean | no |  |
| endDuringPause | boolean | no |  |
| userStatusCheckAtBookingCreationAlsoRequiredForOperator | boolean | no |  |
| billingGroupOverrideEnabled | boolean | no |  |
| maxOccurrencesBookingExtension | integer (int32) | no |  |
| products | Product[] | no |  |
| customPricingEnabled | boolean | no |  |

### ServiceAdditionalInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| energyServiceInfo | EnergyServiceAdditionalInfoDTO[] | no | List of Fuel Service additional information: energy type, unit price |

### ServiceDTO
Service Json body
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

### ServiceFull
Full service description
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Service UID |
| name | string | yes | Service name (public name) |
| status | string: `ACTIVE`, `DISABLED` | yes | status (active or disabled) |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | yes | The service type will define the business rules applicable during the booking process: * Free Floating: the user can book any available vehicles even those whi… |
| fleetId | string | yes | FleetId |
| cityId | string | yes | City UUID |
| zones | string[] | yes | List of service operational zone's ids. It's the list of areas where the users are allowed/forbidden to end a trip |
| vehicles | string[] | yes | List of vehicle's ids. It's the list of vehicles which can be booked by a user on this service |
| stations | string[] | yes | List of station's ids. Only applicable for a service of type round trip booking. |
| pois | string[] | yes | List of point of interests ids. Can be parking, charging stations ... |
| bookingValidity | integer (int32) | yes | Booking Validity in seconds. Only applicable for Free Floating. The duration allowed before the automatic expiration of a booking. for round trip booking, the… |
| visibility | string: `PUBLIC`, `PRIVATE` | yes | Service visibility: * Public: every users registered can subscribe to those services * Private: accessible only if the user's profile is linked to an entity wh… |
| autoApprovalStrategy | string: `MANUAL`, `CITY_SCOPED_STRICT`, `CITY_SCOPED`, `FRANCHISE_SCOPED_STRICT`, `FRANCHISE_SCOPED` | no | AutoApproval strategy (MANUAL by default |
| tripPrivacyStrategy | string: `TRACKING`, `TRACKING_PAUSE`, `NO_TRACKING` | no | Trip privacy strategy (TRACKING by default if serviceType is SERVICE_TRIP otherwise TRACKING_PAUSE) |
| zoneFillColor | string | yes | Color code of graphic area used to represent the service's zones in the backoffice and the application |
| zoneOutlineColor | string | yes | Color code of outline used to represent the service's zones in the backoffice and the application |
| maxConcurrentTrips | integer (int32) | no |  |
| highestRangeEnabled | boolean | no | Enables the sorting of vehicles by range (autonomy1) |
| scheduleAtripEnabled | boolean | no | True if the service is SaT |
| zoneCheckEnabled | boolean | no | Default value TRUE, unless user changes it to false at service level |
| maxAdditionalDrivers | integer (int32) | no | Default value 0, means Additional Driver feature is disabled for adding any new driver |
| nearEndThreshold | integer (int32) | no | Default value NULL. It is the percentage of the trip after which the user should be notified |
| tripDurationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | no | it set the strategy used to calculate the trip duration |
| handDeliveryEnabled | boolean | no | Hand delivery enabled (false by default) the lock/unlock will be done with the physical key |
| serviceAdditionalInfo | ServiceAdditionalInfoDTO | no | service additional information |
| stationAvailableSpotCheckingEnabled | boolean | no | Station available spots check enabled (false by default) |
| requiredManualApproval | boolean | no | Will enable disable manual approval based on the value set, default it is false |
| extensionsBillingMode | string: `ON_TRIP`, `ON_EXTENSION` | no | Setting the billing mode on extensions |
| dstManagement | boolean | no | DST Management flag. false (default): User pays the real duration (DST excluded). true: User pays the calculated duration (DST included) |
| excludeFromBilling | string: `Business`, `Single`, `ALL`, `NONE` | no | Setting the profile types excluded from internal billing / reserved for external billing |
| timeZone | string | no | time zone of the city or the fleet linked to a service |
| separateInvoice | boolean | no | Invoices for business profile products should be cumulative if false or separate if true |
| gracePeriodInMinutes | integer (int32) | no | Grace period is in seconds. If greater than 0, service type must be FREE_FLOATING. |
| bleStartFlow | boolean | no | BLE start flow enabled (false by default) |
| insuranceMandatory | boolean | no | Whether insurance is mandatory for this service. |
| depositRequired | boolean | no | Whether a deposit is required for this service. |
| workFlowServiceProcessorIds | string[] | no | List of workflow service processors ids. |
| endDuringPause | boolean | no | End during pause enabled (false by default) |
| userStatusCheckAtBookingCreationAlsoRequiredForOperator | boolean | no | Indicates whether user status validation should be enabled during booking creation. When set to false, the service will bypass the default checks on the user's… |
| billingGroupOverrideEnabled | boolean | no | Billing Group Override Enabled (false by default): overriding billing group at ALLOCATION time |
| nextOverdueReturnNotification | integer (int32) | no | Delay in minutes between recurring overdue return notifications. 0 means feature disabled. |
| maxOverdueReturnNotifications | integer (int32) | no | Maximum number of overdue return notifications to send. 0 means feature disabled. |
| maxOccurrencesBookingExtension | integer (int32) | no | Maximum number of booking extension occurrences allowed for this service. 0 uses product default behavior. |
| uxMode | string | no | UX mode such as Okai. |
| customPricingEnabled | boolean | no |  |

### ServiceModelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceLevel | boolean | yes | If the product is at model level, then false, if the product is at service level, then true |
| models | integer (int64)[] | no | List of models linked to the service if product is at model level (serviceLevel == false) |

### ServiceModelVehiclesDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no |  |
| serviceVisibility | string: `PUBLIC`, `PRIVATE` | no |  |
| modelId | integer (int64) | no |  |
| vehicles | string[] | no |  |

### ServiceRegistrationBatchDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorProfileId | string | no | ProfileId of the operator who is doing the batch update. It's required from tracability to know who has granted or suspended a user |
| actions | ActionDTO[] | yes | List of actions to be done on the service registration |
| disableEmailNotification | boolean | no | Must be set to true if you don't want to generate an email notification to inform the user of this change (false by default) |

### ServiceRegistrationResultDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorProfileId | string | yes | UserID of the operator who is doing the service registration change |
| requestStatus | string: `APPROVED`, `PENDING`, `REJECTED`, `INCOMPLETE`, `SUSPENDED` | yes | Status: * APPROVED: the user can book a vehicle of the service * PENDING: the status when the user has just submit his registration (the user cannot book) * RE… |
| reasonForChange | string | no | Reason why the status of the service change |

### ServiceRegistrationValidationResultDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no |  |
| validationResult | string | no |  |
| serviceRegistrationStatus | string: `APPROVED`, `PENDING`, `REJECTED`, `INCOMPLETE`, `SUSPENDED` | no |  |

### ServiceRegistrationWithReasonDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no | serviceId |
| reason | string | no | reason why the status changed |
| status | string | no | service registration status |

### ServiceRightsPropagationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| service | ServiceSummaryResponse | yes | root service |
| givesRightsTo | ServiceSummaryResponse[] | yes | List of services which will be automatically registered if the root service is registered |

### ServicesOverviewResponse
List of services, breakdown by visibility type
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| public | ServiceSummaryResponse[] | yes | List of public services. Every users registered, can subscribe to those services |
| private | ServiceSummaryResponse[] | yes | List of private services. They are accessible only if the user's profile is linked to an entity which list them |

### ServicesRegistrationListDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| approved | string[] | no | list of service's registration approved |
| incomplete | string[] | no | list of service's registration incomplete |
| pending | string[] | no | list of service's registration pending |
| rejected | string[] | no | list of service's registration rejected |
| suspended | string[] | no | list of service's registration suspended |
| unregistered | string[] | no | list of service's registration unregistered |
| available | string[] | no |  |

### ServiceStatusDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Service UID |
| name | string | yes | Service name (public name) |
| status | string: `APPROVED`, `DOC_MISSING`, `DOC_EXPIRED`, `DOC_INVALID`, `DOC_PENDING_REVIEW`, `SERVICE_REG_UNREGISTERED`, `SERVICE_REG_PENDING`, `SERVICE_REG_SUSPENDED`, `SERVICE_REG_REJECTED`, `TOU_UNACCEPTED`, `UNKNOWN`, `SERVICE_REG_INCOMPLETE` | no |  |
| cityId | string | yes | City UUID |
| visibility | string: `PUBLIC`, `PRIVATE` | no |  |

### ServiceSummaryResponse
A Summary of a service
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Service UID |
| name | string | yes | Service name (public name) |
| status | string: `ACTIVE`, `DISABLED` | yes | status (ACTIVE or DISABLED) |
| type | string: `FREE_FLOATING`, `FREE_FLOATING_STRICT`, `SERVICE_TRIP`, `BOOKING`, `ROUND_TRIP_BOOKING`, `BY_PASS_FREE_FLOATING`, `BY_PASS_ROUND_TRIP_BOOKING`, `SUBSCRIPTION`, `SCHEDULED_BOOKING_STATION` | yes | The service type will define the business rules applicable during the booking process: * Free Floating: the user can book any available vehicles even those whi… |
| fleetId | string | yes | FleetId |
| cityId | string | yes | City UUID |
| zones | string[] | yes | Ids of zones associated to this service |
| vehicles | string[] | yes | Ids of Vehicles associated to this service |
| stations | string[] | yes | Ids of stations associated to this service |
| pois | string[] | yes | Ids of point of interest associated to this service |
| bookingValidity | integer (int32) | yes | Booking Validity in seconds. Only applicable for Free Floating. The duration allowed before the automatic expiration of a booking. for round trip booking, the… |
| visibility | string: `PUBLIC`, `PRIVATE` | yes | Service visibility: * Public: every users registered can subscribe to those services * Private: accessible only if the user's profile is linked to an entity wh… |
| autoApprovalStrategy | string: `MANUAL`, `CITY_SCOPED_STRICT`, `CITY_SCOPED`, `FRANCHISE_SCOPED_STRICT`, `FRANCHISE_SCOPED` | no | AutoApproval strategy (MANUAL by default |
| highestRangeEnabled | boolean | no | Enables the sorting of vehicles by range (autonomy1) |
| scheduleAtripEnabled | boolean | no | true if SaT is enabled |
| zoneCheckEnabled | boolean | no | Default value TRUE, unless user changes it to false at service level |
| maxAdditionalDrivers | integer (int32) | no | Default value 0, means Additional Driver feature is disabled for adding any new driver |
| handDeliveryEnabled | boolean | no |  |
| requiredManualApproval | boolean | no | Will enable disable manual approval based on the value set, default it is false |
| tripDurationStrategy | string: `DEFAULT`, `THEORETICAL_DATES` | no | Value about the trip duration strategy (DEFAULT, THEORETICAL_DATES) |
| extensionsBillingMode | string: `ON_TRIP`, `ON_EXTENSION` | no | Value about extensions billing mode (ON_TRIP, ON_EXTENSION) |
| dstManagement | boolean | no | DST Management flag. false (default): User pays the real duration (DST excluded). true: User pays the calculated duration (DST included) |
| excludeFromBilling | string: `Business`, `Single`, `ALL`, `NONE` | no | Setting the profile types excluded from internal billing / reserved for external billing |
| bleStartFlow | boolean | no | BLE start flow enabled (false by default) |
| endDuringPause | boolean | no | End during pause enabled (false by default) |
| billingGroupOverrideEnabled | boolean | no | Billing Group Override Enabled (false by default): overriding billing group at ALLOCATION time |

### ServiceVehiclePricingSubscriptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| serviceId | string | no |  |
| vehiclePricings | VehiclePricingSubscriptionDTO[] | no |  |

### SimpleProfileDTO
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

### SimpleUserDTO
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

### Station
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

### StationAvailabilityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stationId | string | yes | ID of the station |
| available | boolean | yes | Define if given station is available or not |
| unavailabilityReason | string: `NO_AVAILABLE_SPOTS`, `IS_CLOSED` | yes | The reason why the given station is unavailable |
| stationDTO | string | no |  |

### StationDescription
Contains some infos related to a station
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| stationId | string | no |  |
| infos | StationDescriptionInfo[] | yes |  |

### StationDescriptionInfo
Contains language to use and tag is the default language
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| language | string | yes | language |
| paragraphs | StationDescriptionParagraph[] | no |  |
| default | boolean | no |  |

### StationDescriptionParagraph
Contains subject and description
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subject | string | yes | subject |
| description | string | yes | description |

### StationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Station Unique Id (generated by the platform at the creation) |
| zoneId | string | yes | Id of the zone linked with the station, this is zone is the area where the user is allowed to drop the vehicle. |
| taxZoneId | string | no |  |
| poiId | string | yes | It's the position of the pin on the map and the information related to the station |
| models | BookingRequestModelDTO[] | yes | List of model of vehicle available in this station |
| cityId | string | no |  |
| serviceId | string | no |  |
| fleetId | string | no | fleetId (cannot be updated) |
| openTime | string | no |  |
| closeTime | string | no |  |

### StationServiceDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| station | StationSingleDTO | no |  |
| serviceId | string | no |  |
| stationTimetableDTO | StationTimetableDTO | no | Contains the whole station timetable (opening and closing hours by day of the week) |

### StationServiceOverviewDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stations | StationServiceDTO[] | no |  |

### StationSingleDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| models | ModelOverviewDTO[] | no |  |
| openTime | string | no |  |
| closeTime | string | no |  |
| maxAvailableSpots | integer (int32) | no |  |

### StationTimetableDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stationId | string | no |  |
| fleetId | string | no |  |
| alwaysOpen | boolean | no |  |
| timetable | object | no |  |

### StationWithTimetableDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Station Unique Id (generated by the platform at the creation) |
| zoneId | string | yes | Id of the zone linked with the station, this is zone is the area where the user is allowed to drop the vehicle. |
| taxZoneId | string | no |  |
| poiId | string | yes | It's the position of the pin on the map and the information related to the station |
| modificationDate | string (date-time) | no |  |
| fleetId | string | no | fleetId (cannot be updated) |
| openTime | string | no |  |
| closeTime | string | no |  |
| stationTimetableDTO | StationTimetableDTO | no | Contains the whole station timetable (opening and closing hours by day of the week) |
| description | StationDescription | no | Contains description of the station |
| maxAvailableSpots | integer (int32) | no | Maximum available vehicle parking spots allowed |

### StatusChangeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| changeDate | string (date-time) | no |  |
| status | string: `PENDING`, `PAID`, `REFUSED`, `ERROR`, `REFUNDED`, `CANCELLED`, `PENDING_EXTERNAL_PAYMENT`, `PENDING_MANUAL_PAYMENT`, `PENDING_AUTHENTICATION`, `MOP_MISSING` | no |  |

### StatusNote
Reason for change at service level
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reasonForChange | string | yes | Reason for change of status |

### StreamingResponseBody
Type: object

### SubscriptionBookingRequestCreationDTO
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

### SubscriptionBookingRequestHistoryDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |
| tripId | string | no |  |
| parentId | string | no |  |
| traveledDistance | number | no |  |
| energyLevelEnd | number | no |  |

### SubscriptionBookingRequestOutDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | yes |  |
| profileId | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| creationDate | string (date-time) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| cityId | string | no |  |
| pricingId | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| productIds | string[] | no |  |
| modelBasePrice | number | no |  |
| modelRate | number | no |  |
| vehicleResidualValue | number | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| notes | string | no |  |
| digitalContracts | DigitalContractDTO[] | no |  |
| rollingContract | boolean | no |  |
| planDurationInMonths | integer (int32) | no |  |
| planName | string | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| parentId | string | no |  |
| previous | string | no |  |
| manualApproval | BookingRequestRequiredActionOutDTO | no |  |
| additionalDrivers | AdditionalDriverOutputDTO[] | no |  |
| bookingReferenceId | string | no |  |
| stationId | string | no |  |

### SubscriptionBookingRequestPreviewDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| modelBrand | string | no |  |
| modelName | string | no |  |
| modelTransmission | string | no |  |
| modelVehicleType | string | no |  |
| modelEnergyType | string | no |  |
| vehicleVin | string | no |  |
| vehiclePlate | string | no |  |
| subscriptionStartDate | string (date) | no |  |
| subscriptionEndDate | string (date) | no |  |
| nbMonths | integer (int64) | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| userFirstName | string | no |  |
| userLastName | string | no |  |
| dateOfBirth | string (date) | no |  |
| email | string | no |  |
| phoneNumber | string | no |  |
| drivingLicenseNumber | string | no |  |
| drivingLicenseExpiration | string (date) | no |  |
| drivingLicenseIssueCountry | string | no |  |
| documentIdNumber | string | no |  |
| documentIdExpiration | string (date) | no |  |
| documentIdIssueCountry | string | no |  |
| cardHolderName | string | no |  |
| cardLastDigits | string | no |  |
| cardExpirationDate | string (date) | no |  |
| stationName | string | no |  |
| stationAddress | string | no |  |
| mileagePackage | string | no |  |
| excessMileageFee | string | no |  |
| excessMileageUnit | string | no |  |
| baseFee | string | no |  |
| baseFeeCurrency | string | no |  |
| insuranceName | string | no |  |
| insuranceFee | string | no |  |
| insuranceFeeCurrency | string | no |  |
| packageName | string | no |  |
| mileagePackageFee | string | no |  |
| mileagePackageCurrency | string | no |  |
| fleetId | string | no |  |
| options | Product[] | no |  |
| totalFee | string | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| mvsFee | string | no |  |

### SubscriptionBookingRequestWithPPUDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| startDate | string (date-time) | yes |  |
| endDate | string (date-time) | yes |  |
| profileId | string | no |  |
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| creationDate | string (date-time) | no |  |
| fleetId | string | no |  |
| userId | string | no |  |
| serviceId | string | no |  |
| cityId | string | no |  |
| pricingId | string | no |  |
| customPrice | CustomPriceDTO | no |  |
| status | string: `CONFIRMED`, `PENDING`, `CANCELLED`, `ALERT`, `COMPLETED`, `ONGOING`, `LATE_RETURN`, `UPCOMING_ALLOCATED`, `UPCOMING_NOT_ALLOCATED`, `PENDING_PAYMENT` | no |  |
| productIds | string[] | no |  |
| modelBasePrice | number | no |  |
| modelRate | number | no |  |
| vehicleResidualValue | number | no |  |
| deliveryAddress | string | no |  |
| deliveryAddressAdditionalInfo | string | no |  |
| deliveryCity | string | no |  |
| deliveryPostalCode | string | no |  |
| pricePerUnit | string | no |  |
| plannedReturnDate | string (date-time) | no |  |
| notes | string | no |  |
| modelName | string | no |  |
| vehiclePlate | string | no |  |
| journeyId | string | no |  |
| returnedDate | string (date-time) | no |  |
| cancellationDate | string (date-time) | no |  |
| cancellationRequestOutDTO | BookingRequestRequiredActionOutDTO | no |  |
| manualApproval | BookingRequestRequiredActionOutDTO | no |  |
| contractType | string: `SVS`, `MVS` | no |  |
| parentId | string | no |  |
| previous | string | no |  |
| type | string: `SINGLE`, `MASTER`, `SLAVE` | no |  |
| rollingContract | boolean | no |  |
| bookingReferenceId | string | no |  |
| completed | boolean | no |  |
| stationId | string | no |  |

### SubscriptionBreakdownDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subscriptionBreakdown | object | no | The list amounts for the subscription part |
| durationInMonths | number | no | The duration in months for the subscription |
| subId | string | no |  |
| contractType | string | no | the booking request contractType |

### SubscriptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profileId | string | no |  |
| plan | PlanResponseDTO | no |  |
| expiryDate | string (date-time) | no |  |
| unsubscribeDate | string (date-time) | no |  |
| activationDate | string (date-time) | no |  |
| invoiceIds | string[] | no |  |
| status | string: `ACTIVE`, `PAYMENT_PENDING`, `EXPIRED`, `ACTIVATION_PENDING`, `RENEWAL_ERROR` | no |  |

### SubscriptionPlanDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| distanceIncluded | number (double) | no |  |
| unit | string | no |  |
| pricePerUnit | number (double) | no |  |
| durationInMonths | integer (int32) | no |  |
| name | string | no |  |
| pricePerUnitExceedingAllowance | number (double) | no |  |
| ratePerUnit | number | no |  |
| rollingContract | boolean | no |  |

### SwitchWakeupCmd
Command to switch all the fleet from one wakeup provider to another
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| moveFrom | string | yes |  |
| moveTo | string | yes |  |

### SystemCreditsDiscountDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| net | number | yes | The net amount |
| gross | number | yes | The gross amount |
| taxes | Tax[] | yes | The list of taxes |
| breakdown | object | yes | The breakdown of all system credits applied |
| tripRelatedProductBreakdown | object | no | The breakdown of all system credits applied to trip related product only |
| percentageSystemCreditBreakdown | object | no | The percentage applied |
| prepaymentSystemCreditBreakdown | object | no | system credits applied to trip related |

### Tax
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | yes | The tax name |
| taxRate | number | yes | The tax rate |
| taxAmount | number | yes | The tax amount |

### TaxCreateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | yes | The name of the tax |
| taxRate | number | yes | The rate of the tax |
| zones | string[] | no |  |

### TaxDto
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxName | string | yes | The tax name |
| taxRate | string | yes | The tax rate |
| taxAmount | string | yes | The tax amount |

### TaxDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | The id of the tax |
| fleetId | string | yes | The id of the fleet |
| taxName | string | yes | The name of the tax |
| taxRate | number | yes | The rate of the tax |
| products | ProductDTO \| CancellationPolicyResponseDTO[] | yes | The list of products associated with the tax |
| zones | string[] | yes | The list of zones associated with the tax |

### TaxRatesDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxRate | number (double) | no | The tax rate as decimal number |
| taxName | string | no | The tax name |

### TaxUpdateDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taxRate | number | yes | The new tax rate to set to the existing tax |
| taxName | string | yes | The new tax name to set to the existing tax |

### TicketAttachMetaData
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| filename | string | yes |  |
| operatorId | string | yes |  |

### TicketAttachMetaDataResp
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| ticketId | string | no |  |
| attachmentId | string | no |  |
| uploadUrl | string | no |  |

### TicketBatchAssignRequest
Type: object

### TicketBatchAssignResponse
Type: object

### TicketInfo
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| categoryId | integer (int32) | no |  |
| groupId | integer (int32) | no |  |

### TicketSinglePropertyUpdateRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | yes |  |
| property | string | yes |  |
| value | string | yes |  |

### TicketToGroupBatchAssignRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operatorId | string | yes |  |
| ticketIds | string[] | yes |  |

### TicketToGroupBatchAssignResponse
Type: object

### TimeRangeDto
timeRangeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| startTime | string | yes | startTime |
| endTime | string | yes | endTime |
| type | string: `START_DATE`, `MULTI` | no |  |
| pricingCap | number | no |  |
| serviceId | string | no |  |
| modelId | integer (int64) | no |  |
| name | string | no |  |
| pricingId | string | no |  |

### Trip
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

### TripDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentIntents | PaymentDTO[] | no | Payment intents at non final status |
| paymentReceipts | PaymentDTO[] | no | Payment receipts |
| tripId | string | yes | Trip id (orderId) |
| vehicleId | string | yes | Vehicle used in the trip |
| tripEndDate | string (date-time) | yes | End Date |
| theorEndDate | string (date-time) | yes | Theoretical end date, it's end date requested by the user in schedule booking (not used in direct booking or free floating) |
| theorStartDate | string (date-time) | yes | Theoretical start date, it's start date requested by the user in schedule booking (not used in direct booking or free floating) |
| tripTotalWithoutTax | string | no | *(deprecated)* |
| tripTotalTaxAmount | string | no | *(deprecated)* |
| tripTotalWithTax | string | no | *(deprecated)* |
| tripTaxRate | string | no | *(deprecated)* |
| products | AccountingPdfProductDTO[] | no | Products associated with this trip |
| distance | number | yes | Mileage of the trip in Km or miles |
| duration | number | yes | Total duration in minutes of the trip including from the booking date to the end date |
| stopoverDuration | number | yes | Total duration in minutes of all the cumulated pause periods |
| bookingDuration | number | yes | Total duration in minutes between the booking date and the start trip date (first unlock) |
| tripDuration | number | yes | Total duration - Booking Duration |
| drivingDuration | number | yes | Total duration - (Booking Duration + Pause Duration + SettleDuration) |
| tripStartDate | string (date-time) | yes |  |

### TripDurationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| adjustedBookDuration | number | no |  |
| adjustedPauseDuration | number | no |  |
| adjustedDrivingDuration | number | no |  |

### TripEvent
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | string | no |  |
| timestamp | string (date-time) | no |  |
| parameters | string | no |  |

### TripEventFilter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| fromDate | string (date-time) | no |  |
| toDate | string (date-time) | no |  |
| dateRange | string | no |  |
| tripIds | string[] | yes |  |

### TripHistory
Contains the changes of the trip like the duration
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no |  |
| startTrip | string (date-time) | no |  |
| endTrip | string (date-time) | no |  |
| fleetId | string | no |  |
| tripId | string | no | TripId |
| initialDuration | InitialDuration | no |  |
| events | Changes[] | no |  |

### TripLocation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| latitude | number (double) | no |  |
| longitude | number (double) | no |  |

### TripManualPaymentDTO
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

### TripNoteDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| content | string | no |  |

### TripRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

### TripSessionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | Vehicle used in the trip |
| userId | string | no |  |
| fleetId | string | no |  |
| endDate | string (date-time) | yes | End Date |
| sessionId | string | yes | Session id (orderId) |
| creationDate | string (date-time) | no |  |
| mileage | number | yes | Mileage of the trip in Km or miles |
| duration | number | yes | Total duration in minutes of the trip including from the booking date to the end date |
| pauseDuration | number | yes | Total duration in minutes of all the cumulated pause periods |
| initDuration | number | yes | Total duration in minutes between the booking date and the start trip date (first unlock) |
| sessionDuration | number | yes | Total duration - Booking Duration |
| drivingDuration | number | yes | Total duration - (Booking Duration + Pause Duration + SettleDuration) |
| startLocation | Position | no |  |
| endLocation | Position | no |  |
| automaticallyEnded | boolean | no |  |
| endZones | TripZoneDTO[] | no |  |
| startZones | TripZoneDTO[] | no |  |
| cancelled | boolean | no |  |

### TripSessionFilter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| fromDate | string (date-time) | no |  |
| toDate | string (date-time) | no |  |
| dateRange | string | no |  |
| vehicleIds | string[] | no |  |
| fromEndDate | string (date-time) | no |  |
| toEndDate | string (date-time) | no |  |
| endDateRange | string | no |  |

### TripStartEndRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| orderId | string | yes | TripId/orderId |
| userId | string | yes | id of user |
| odometer | number (double) | no | the current value of the odometer (for no-box vehicles) |
| autonomyPercent | number (double) | no | the current energy level of the vehicle (for no-box vehicles) |
| start_date | string (date-time) | no | the actual date the trip has started (for no-box vehicles) |
| end_date | string (date-time) | no | the actual date the trip has ended (for no-box vehicles) |
| productIds | string[] | no | list of the productId which is subscribed by the user at the moment of starting the trip |

### TripV2DTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | Vehicle used in the trip |
| userId | string | yes | The user ID of the trip |
| fleetId | string | yes | FleetId |
| profileId | string | yes | ProfileId of the user who did the trip |
| profileType | string | yes | Profile of the user who did the trip (Single or Business) |
| pricingId | string | yes | pricing id |
| serviceId | string | yes | service id |
| endDate | string (date-time) | yes | End Date |
| theorEndDate | string (date-time) | yes | Theoretical end date, it's end date requested by the user in schedule booking (not used in direct booking or free floating) |
| theorStartDate | string (date-time) | yes | Theoretical start date, it's start date requested by the user in schedule booking (not used in direct booking or free floating) |
| tripId | string | yes | Trip id (orderId) |
| creationDate | string (date-time) | no |  |
| mileage | number | yes | Mileage of the trip in Km or miles |
| duration | number | yes | Total duration in minutes of the trip including from the booking date to the end date |
| pauseDuration | number | yes | Total duration in minutes of all the cumulated pause periods |
| initDuration | number | yes | Total duration in minutes between the booking date and the start trip date (first unlock) |
| tripDuration | number | yes | Total duration - Booking Duration |
| drivingDuration | number | yes | Total duration - (Booking Duration + Pause Duration + SettleDuration) |
| startLocation | Position | no |  |
| endLocation | Position | no |  |
| dynamicScore | integer (int32) | no | Dynamic driving score (0-100). Null when not reported by the vubox. |
| ecoScore | integer (int32) | no | Eco driving score (0-100). Null when not reported by the vubox. |
| accelEventCount | integer (int32) | no | Count of harsh acceleration events during the trip. |
| brakeEventCount | integer (int32) | no | Count of harsh braking events during the trip. |
| turnEventCount | integer (int32) | no | Count of harsh cornering events during the trip. |
| idleTotalSec | integer (int32) | no | Cumulative seconds idling (ignition ON, speed < 1 km/h). |
| endZones | TripZoneDTO[] | no |  |
| startZones | TripZoneDTO[] | no |  |
| billed | boolean | no |  |
| cancelled | boolean | no |  |
| suspicious | boolean | no |  |
| released | boolean | no |  |

### TripV2Filter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| fromDate | string (date-time) | no |  |
| toDate | string (date-time) | no |  |
| dateRange | string | no |  |
| cancelled | boolean | no |  |
| suspicious | boolean | no |  |
| billed | boolean | no |  |
| released | boolean | no |  |
| serviceIds | string[] | no |  |
| vehicleIds | string[] | no |  |
| fromEndDate | string (date-time) | no |  |
| toEndDate | string (date-time) | no |  |
| endDateRange | string | no |  |

### TripZoneDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| zoneId | string | yes | Id of the zone |
| type | string | yes | zone type (allowed, forbidden, parking) |
| sticky | boolean | no | if set the zone added manually will not be deleted by automatic the zone matching |

### UnavailabilityDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | no |  |
| modelId | integer (int64) | no |  |
| from | string (date-time) | no |  |
| to | string (date-time) | no |  |
| toWithMargin | string (date-time) | no |  |
| type | string: `BOOKING`, `MAINTENANCE` | no |  |
| id | string | no |  |
| userId | string | no |  |
| reason | string | no |  |
| serviceId | string | no |  |

### UnitPrice
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| timeUnit | string: `minute`, `hour`, `day`, `firstHour` | no | The time unit (minute \| hour \| day \| firstHour) |
| price | number | no | The price for the current time unit |

### UnlockFeeDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| price | number | no | the unlock fee amount |
| payableBySystemCredits | boolean | no | true if the unlock fee can be payed by system credits |

### updateConfigRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| autoRemoveAssignees | boolean | no |  |

### UpdateEntityXDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId |
| tokenId | string | no | entity's payment token generated by the payment provider |
| entityName | string | no | Entity friendly name |
| type | string: `Family`, `Business`, `Personal` | yes | Entity's type |
| status | string: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INCOMPLETE`, `OUTSTANDING_BALANCE` | yes | Entity's status |
| mandatoryTripNotes | boolean | no | True if trip notes are mandatory for this entity |
| fiscalCode | string | no | fiscal code |

### UpdateGroupRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | no |  |
| maxNbHoursAssigned | integer | no |  |

### UpdateLabelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string (string) | no | The dedicated name of the label |
| publicName | string (string) | no | The dedicated name of the label which will be available in the geojson of the zone |

### UpdateOptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | no |  |
| fleetId | string | no |  |
| description | string | no |  |
| name | string | no |  |
| type | string | no |  |
| startDate | string (date-time) | no |  |
| endDate | string (date-time) | no |  |

### UpdateRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| out-of-service-reason | string | no | out of service reason |
| cleanliness-status | boolean | no | If true the vehicle will need to be cleaned |
| needs-redistribution | boolean | no | If true the vehicle hasn't moved since a while |
| automaticallyRecoverVehicle | boolean | no | Deprecated |

### UpdateServiceDTO
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

### updateticketRequest
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

### UploadWsDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| attachmentId | string | yes | The ID of the attachment that need to be updated |
| url | string | yes | URL of the resource |
| s3FileName | string | yes | The name of the resource |
| filename | string | yes | The original name of the file |

### UserAgreementDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | yes | fleetId of the recorded agreement. This might be a different fleetId than the fleetId off the user's account. If the fleet is in a franchise |
| cityId | string | yes | cityId of the recorded agreement. This might be a cityId from another fleet if the fleet is in a franchise |
| userId | string | yes | userId |
| date | string (date-time) | yes | Date of when the user has accepted the agreement |
| hasAcceptedLatest | boolean | no |  |

### UserAndProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| fleetId | string | no |  |
| userName | string | no |  |
| lastName | string | no |  |
| firstName | string | no |  |
| middleName | string | no |  |
| preferredName | string | no |  |
| accountStatus | string: `CREATED`, `INCOMPLETE`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`, `INACTIVE` | no |  |
| gender | string: `MALE`, `FEMALE`, `UNDEFINED` | no |  |
| locale | string | no |  |
| registrationDate | string (date-time) | no |  |
| birthDate | string (date-time) | no |  |
| nationality | string | no |  |
| membershipNumber | string | no |  |
| notes | string | no |  |
| address | AddressDTO | no |  |
| dataPrivacyConsent | boolean | no |  |
| dateOfAgreements | string (date-time) | no |  |
| agreements | UserAgreementDTO[] | no |  |
| profile | ProfilePiDTO | no |  |
| oldCustomerId | string | no |  |

### UserBasicDTO
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

### UserByDocumentStatusDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no | unique user id generated at the user creation by the system |
| firstname | string | no | User first name |
| lastname | string | no | User last name |

### UserIndividualBusinessDTO
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

### UserIndividualBusinessOutputDTO
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
| fleetId | string | yes | fleetId (cannot be updated) |
| userId | string | yes | User id owner of the individual business |

### UserLabelDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer (int64) | yes | label id |
| name | string | yes | name |
| creationDate | string (date-time) | yes | creation date |

### userNoteHistory
Contains the history of user Note
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| note | string | no |  |
| operatorId | string | no |  |

### UserPIDTO
the user's body (only the attributes which need to be updated must be provided)
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

### UserServiceRegistrationDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | yes | Id of the user |
| catalog | ServiceSummaryResponse[] | yes | List of service registered by the user |
| profiles | ProfileServiceRegistrationDTO[] | yes | A breakdown of each registered services per profile of the user |

### UserServiceRegistrationNestedDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| userName | string | no |  |
| lastName | string | no |  |
| firstName | string | no |  |
| middleName | string | no |  |
| preferredName | string | no |  |
| accountStatus | string | no |  |
| gender | string | no |  |
| locale | string | no |  |
| registrationDate | string (date-time) | no |  |
| birthDate | string (date-time) | no |  |
| nationality | string | no |  |
| membershipNumber | string | no |  |
| notes | string | no |  |
| dataPrivacyConsent | boolean | no |  |
| dateOfAgreements | string (date-time) | no |  |
| dataPrivacyConsentUpdateDate | string (date-time) | no |  |
| profilingConsent | boolean | no |  |
| profilingConsentUpdateDate | string (date-time) | no |  |
| marketingConsent | boolean | no |  |
| marketingConsentUpdateDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |
| membershipStatus | string: `VALID`, `INVALID` | no |  |
| profiles | ProfileServiceRegistrationDTO[] | no |  |
| id | string | no |  |

### UserStatusDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique user id generated at the user creation by the system |
| fleetId | string | yes | fleetId |
| userName | string | no | username/login of the user. cannot be updated after the creation |
| lastName | string | no | User last name |
| firstName | string | no | User first name |
| middleName | string | no | User middle name |
| preferredName | string | no | User preferred name |
| accountStatus | string: `INCOMPLETE,PENDING,APPROVED,REJECTED,SUSPENDED,ARCHIVED` | no | Account status at the creation (INCOMPLETE by default) |
| gender | string | no | Gender |
| locale | string | no | User's locale used to personalize the language in the app (default en_US) |
| registrationDate | string (date-time) | no | Creation date of this account |
| birthDate | string (date-time) | no | User's birth date (yes you can be very precise on the birthdate) |
| nationality | string | no | nationality |
| address | AddressDTO | no | User's postal address (this field is managed by a dedicated end point |
| dataPrivacyConsent | boolean | no | The user accepts to share his private data with third partners of the operator |
| emailConsent | boolean | no |  |
| marketingConsent | boolean | no |  |
| dateOfAgreements | string (date-time) | no | *(deprecated)* Last date of the acceptation of agreements |
| agreements | UserAgreementDTO[] | no | List of all city agreement's acceptations. One Agreement per city (term of uses is per city) |
| profiles | ProfileStatusDTO[] | no |  |
| membershipNumber | string | no | Membership number |
| surveyConsent | boolean | no | The user accepts to be contacted for surveys |
| shareDataConsent | boolean | no | The user accepts to share his data to other associated companies |
| surveyConsentUpdateDate | string (date-time) | no | Last update date of this survey consent |
| shareDataConsentUpdateDate | string (date-time) | no | Last update date of this shareData consent |
| countryBirth | string | no | The country Of birth |
| provinceRegionBirth | string | no | The Province/Region Of birth |
| cityBirth | string | no | The City Of birth |
| profilingConsent | boolean | no | The user accepts to participate to data science processing |
| profilingConsentUpdateDate | string (date-time) | no | Date of the acceptation of the Profiling consent |
| userIndividualBusiness | UserIndividualBusinessOutputDTO | no | Individual business information |

### UserStatusNoteDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | string | no |  |
| fleetId | string | no |  |
| operatorId | string | no |  |
| reasonForChange | string | no |  |
| creationDate | string (date-time) | no |  |
| updateDate | string (date-time) | no |  |

### UserStatusNoteUpdateDTO
The note to be update related to status for change
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| reasonForChange | string | no |  |

### UserTicketGroup
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | integer | no |  |
| name | string | no |  |

### UserWithProfileDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | unique user id generated at the user creation by the system |
| fleetId | string | yes | fleetId |
| userName | string | no | username/login of the user. cannot be updated after the creation |
| lastName | string | no | User last name |
| firstName | string | no | User first name |
| middleName | string | no | User middle name |
| preferredName | string | no | User preferred name |
| accountStatus | string: `INCOMPLETE,PENDING,APPROVED,REJECTED,SUSPENDED,ARCHIVED` | no | Account status at the creation (INCOMPLETE by default) |
| gender | string | no | Gender |
| locale | string | no | User's locale used to personalize the language in the app (default en_US) |
| registrationDate | string (date-time) | no | Creation date of this account |
| birthDate | string (date-time) | no | User's birth date (yes you can be very precise on the birthdate) |
| nationality | string | no | nationality |
| membershipNumber | string | no | Membership number |
| notes | string | no | Free field to store any information about the user |
| address | AddressDTO | no | User's postal address (this field is managed by a dedicated end point |
| dataPrivacyConsent | boolean | no | The user accepts to share his private data with third partners of the operator |
| dataPrivacyConsentUpdateDate | string (date-time) | no |  |
| profilingConsent | boolean | no | The user accepts to participate to data science processing |
| profilingConsentUpdateDate | string (date-time) | no | Date of the acceptation of the Profiling consent |
| marketingConsent | boolean | no | The user accepts to receive marketing emails from the operator |
| marketingConsentUpdateDate | string (date-time) | no | Date of the acceptation of the Marketing consent |
| dateOfAgreements | string (date-time) | no | Last date of the acceptation of agreements |
| agreements | UserAgreementDTO[] | no | List of all city agreement's acceptations. One Agreement per city (term of uses is per city) |
| profiles | ProfileWithEntityDTO[] | no |  |
| oldCustomerId | string | no | When a user has been migrated from on old platform/crm it's old user id is referenced hee |
| updateDate | string (date-time) | no | Last update date of this account |
| membershipStatus | string: `VALID`, `INVALID` | no | Status of the membership |
| surveyConsent | boolean | no | The user accepts to be contacted for surveys |
| surveyConsentUpdateDate | string (date-time) | no | Last update date of this survey consent |
| shareDataConsent | boolean | no | The user accepts to share his data to other associated companies |
| shareDataConsentUpdateDate | string (date-time) | no | Last update date of this shareData consent |
| countryBirth | string | no | The country Of birth |
| provinceRegionBirth | string | no | The Province/Region Of birth |
| cityBirth | string | no | The City Of birth |
| userIndividualBusiness | UserIndividualBusinessOutputDTO | no | Individual business information |
| userLabels | UserLabelDTO[] | no | labels attached to this user |

### Vehicle
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

### Vehicle2GroupBatchDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | string: `add, delete` | yes |  |
| vehicles | string | yes |  |
| groupId | string | yes |  |
| deleteOn | string: `END_TRIP`, `NONE` | no |  |
| expireAt | string (date-time) | no |  |
| multipleGroupsOfSameTypeUniqueness | boolean | no |  |
| replaceAnyExistingGroup | boolean | no |  |

### Vehicle2GroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| deleteOn | string: `END_TRIP`, `NONE` | no |  |
| expireAt | string (date-time) | no |  |
| multipleGroupsOfSameTypeUniqueness | boolean | no |  |
| replaceAnyExistingGroup | boolean | no |  |

### VehicleAvailabilitySubscriptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bookingRequestsId | string[] | no |  |
| vehicleId | string | no |  |

### VehicleCalendarResponseDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| timezone | string | no |  |
| from | string (date-time) | no |  |
| to | string (date-time) | no |  |
| vehicleIds | string[] | no |  |
| unavailabilities | UnavailabilityDTO[] | no |  |

### VehicleDisableListRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subStatus | string | yes | Out of service reason |
| vehicleIds | string[] | yes | the list of vehicle ids to update |

### VehicleDTO
Vehicle object. If you update this resource, you can include only the fields which need to be updated
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Vehicle Unique Id |
| vin | string | yes | Vehicle Identification Number. In the case of vehicle without an official VIN like kickscooters, ebikes a specific format must be respected because it's used b… |
| name | string | yes | Vehicle's name returned in the list of a available vehicles. If you don't want to have a specific name per vehicle you can set this value with the plate number |
| plate | string | yes | Plate number returned in the list of a available vehicles. |
| model | ModelDTO | no | Vehicle's model |
| options | OptionDTO[] | no | List of options |
| createDate | string (date-time) | no | Date of creation (cannot be updated) |
| updateDate | string (date-time) | no | Date of last update |
| fleetId | string | no | fleetId (cannot be updated) |
| vuboxId | string | no | Unique id of the box installed in the vehicle., Can be empty if the vehicle has currently no box installed. In this case it cannot be controled by the platform |
| externalId | string | no | Id used to wakeup the box (if available). The format of this id depends of the box and the wakeup implementation. please check the dedicated documentation for… |
| wakeupProvider | string | no | WakeUp implementation which must be used for this vehicle. The format of this field depends of the box and the wakeup implementation. please check the dedicate… |
| serviceId | string | no | *(deprecated)* Must not be used as vehicle can be assigned to multiple services |
| msisdn | string | no | Box phone number. Could be mandatory depending of the wakeup implementation. please check the dedicated documentation for further information |
| iccid | string | no | ICCID of the simcard inside the box. Could be mandatory depending of the wakeup implementation. please check the dedicated documentation for further information |
| imsi | string | no | IMSI of the simcard inside the box. Could be mandatory depending of the wakeup implementation. please check the dedicated documentation for further information |
| stationId | string | no |  |
| published | boolean | no |  |
| noBox | boolean | no | Indicates that this vehicle is boxless (has no vubox at all) |
| residualValue | number | no |  |
| serviceIds | string[] | no |  |
| registrationDate | string (date) | no | Registration date of the vehicle (matriculation) |
| archived | boolean | no |  |
| groups | GroupOfVehicleDTO[] | no |  |

### VehicleEnableListRequest
the list of vehicle ids to update
Type: string[]

### VehicleEnableRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cancelDelayedDisable | boolean | no | cancel the out of service scheduled for vehicle in use |

### VehicleEventFilter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fleetId | string | no |  |
| fromDate | string (date-time) | no |  |
| toDate | string (date-time) | no |  |
| dateRange | string | no |  |
| vehicleIds | string[] | no |  |
| types | string[] | no |  |

### VehicleFM
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no | Unique id of the vehicle |
| plate | string | no | vehicle plate. This value is retrieved from the vehicles administrative database |
| name | string | no | vehicle name. This value is retrieved from the vehicles administrative database |
| vin | string | no | VIN of the vehicle. This value is retrieved from the vehicles administrative database |
| fleetid | string | no | Unique id of the fleet |
| boxid | string | no | Unique id of the box installed in the vehicle, can be empty if the vehicle is out of service or not integrated in the fleet. |
| vehicle_status | integer (int32) | no | vehicle status: 0 - Vehicle available for booking 1 - Vehicle in use. 2 - Vehicle out of service. 3 - Vehicle archived (definitely out of service). 4 - Box rea… |
| zones | Zones[] | no | List of zones which match the vehicle's position. Please note this match is done on all the zones of the fleet. And not only the zones from the services where… |
| releasable | boolean | no | true if trip can be finished. This information is computed based on the box's status and the zone's matched. Doors status is not taken into account. |
| box_status | integer (int32) | no | Box status.If the vehicle is equiped with a vubox it's the status of the state machine of the vubox. If it's a different model of box, it's the server which co… |
| energyLevel | number (double) | no | Composite level of the vehicle's energy always in percentage whatever the vehicle type (fuel, electric, hybrid) |
| energyLevelStart | number (double) | no | energyLevel at the start of the trip. Is null if the vehicle is not booked or the trip hasn't started yet. |
| autonomy | number (double) | no | vehicle autonomy. depending of the vehicle integration could be cruising range in kilometre/mile or battery level in percentage |
| autonomy2 | number (double) | no | vehicle autonomy. depending of the vehicle integration could be cruising range in kilometre/mile or battery level in percentage . |
| isCharging | boolean | no | true if the vehicle is charging |
| battery | number (double) | no | auxiliary battery voltage. |
| km | number (double) | no | vehicle's mileage. |
| speed | number (double) | no | vehicle's speed in Kmph or Mph |
| location | object | no |  |
| endZoneIds | string[] | no | list of the zoneIds where the vehicle might finish its trip. |
| productIds | string[] | no | list of the productId which has been subscribed by the user during the trip. |
| isDoorClosed | boolean | no | true if the vehicle's doors are closed |
| isDoorLocked | boolean | no | true if the vehicle's doors are closed |
| engineOn | boolean | no | true if the vehicle's engine is started |
| immobilizerOn | boolean | no | true if the vehicle's immobilizer is engaged |
| secureOn | boolean | no | true if the vehicle's parking break is engaged |
| spareLockOn | boolean | no | true if the bike lock is detected |
| pileLockOn | boolean | no | true if the pile lock is detected on scooter |
| helmetPresent | boolean | no | true if the first helmet is detected in the saddle for the moped or in the helmetBox for the bikes |
| helmet2Present | boolean | no | true if the secondary helmet is detected in the topcase for the moped |
| helmetBoxLockOn | boolean | no | true if the topcase (for mopped) or helmetBox for bikes is locked |
| helmet2LockOn | boolean | no | true if the helmet2 is locked to the moped |
| userId | string | no | Unique Id of the user who has booked the vehicle. Can be an AIMA userId or an external Id (Mobility Platform) |
| user_locale | string | no | user language by default en_US |
| rfid | string | no | rfid of the user who has booked the vehicle. If no rfid has been provided a virtual one if generated by the server |
| orderId | string | no | unique Id which identify the trip. If the orderId is null the vehicle is not booked |
| gatewayUrl | string | no | Url of the gateway which is communicating with the vehicle. null if the vehicle is not connected. |
| booking_status | integer (int32) | no | status of the booking on this vehicle: 0 - Vehicle available for booking 1 - Booking in progress 2 - Vehicle Booked. 3 - cancelling in progress. 4 - Vehicle ou… |
| booking_date | string (date-time) | no | Date of the booking. |
| expiresOn | string (date-time) | no | date when the booking will be automatically cancelled if the trip hasn't started before. |
| last_active_date | string (date-time) | no | date of the last time the server has received an update from the box |
| last_wakeUp_date | string (date-time) | no | date of the last wakekup message sent to the vehicle. |
| start_pause_date | string (date-time) | no | date of the beginning of the pause. null if the trip isn't in pause. |
| start_mileage | number (double) | no | mileage of the vehicle at the beginning of the trip |
| version | string | no | firmware version of the box (if available) |
| pricingId | string | no | unique Id of the pricing generated for the trip. |
| tripNotes | string | no | notes associated to the trip. This field is used to store the trip's notes added by the user during the trip. (max 255 characters) |
| start_date | string (date-time) | no | date of the beginning of the trip. null if the trip if the vehicle hasnt been unlocked yet |
| theorStartDate | string (date-time) | no | theoretical date of the start of the trip. filled when the vehicle has been allocated for a scheduled booking. |
| theorEndDate | string (date-time) | no | theoretical date of the end of the trip. filled when the vehicle has been allocated for a scheduled booking. |
| startZones | string[] | no | list of the zoneIds where the vehicle was located at the beginning of the trip. |
| outOfServiceReason | string | no | if the vehicle is disabled, this field indicate why it has been put ouf of service. |
| cleanlinessStatus | boolean | no | true if the vehicle needs to be cleaned. This flag is set based on the date when the vehicle has been cleaned for the last time (see last moving date). If it e… |
| needsRedistribution | boolean | no | true if the vehicle needs to be moved. This flag is set based on the date when the vehicle has moved for the last time. If it exceeds an interval defined in th… |
| ongoingCommand | string | no | if present, implies that the vehicle is sleeping or slow to reply; It contains a string indicating the action that was last sent to the vehicle, or the next on… |
| disabled | object | no | true if the vehicle is out of service. If true and the vehicle is currently booked the vehicle will be automatically put out of service after the end of the tr… |
| ignitionOffGeohash | object | no | Geohash of the position where the last ignitionOff event has been recorded type: string example: u33d9mhmqemf |
| batteryUnderThreshold | object | no | True if the Autonomie of the vehicle is under a threshold defined in the settings. This flag can be used to implement an incentive to refuel/recharge. type: bo… |
| isBeingTowed | object | no | True if the server has estimated that this vehicle has been towed (GPS drift without engine on). type: boolean example: false |
| automaticallyEnableVehicleAfterRangeRecovery | object | no | True if this vehicle will be automatically put in service after a certain level of autonmy has been reached. type: boolean example: false |
| key | object | no | BLE token (Vubox5 only) |
| startTripLocation | object | no | Location when the vehicle has been unlocked |
| endTripLocation | object | no | Location when a trip has been ended for the last time |
| serviceId | string | no | Id of the service where the vehicle has been booked |
| serviceType | string | no | Type of service where the vehicle has been booked |
| profileId | string | no | ProfileId of the user who booked the vehicle |
| profileType | string | no | ProfileType of the user who booked the vehicle (Single or Business) |
| entityId | string | no | EntityId of the user who booked the vehicle |
| releasedDate | string (date-time) | no | The last time the vehicle's booking has been released |
| username | string | no | Deprecated will be removed soon` |

### VehicleGroupDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes |  |
| type | string: `PRICING`, `CLEANLINESS`, `END_WITH_INCENTIVE` | yes |  |
| intervalName | string | no |  |
| vehicles | string[] | no |  |

### VehiclePricingSubscriptionDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | no |  |
| jsonSegments | JsonSegmentDTO[] | no |  |
| productDtos | ProductDTO \| CancellationPolicyResponseDTO[] | no |  |

### VehicleStatusRequest
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| subStatus | string | yes | Out of service reason |
| allowDelayedDisable | boolean | no | If true the vehicle will be put out of service after the end of the trip. If false and the vehicle is booked, this request will be rejected. |

### VehicleSubscriptionAttributes
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | no |  |
| registrationDate | string (date) | no |  |

### VehicleSubscriptionInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| residualValue | number | no |  |
| modelBasePrice | number | no |  |
| modelRate | number | no |  |
| minimumMonthlyPrice | number | no |  |

### VehicleToken
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | string | yes | vehicle token |
| key | string | yes | token key |
| fleetId | string | no | fleet id |
| vehicleId | string | no | vehicle id |
| boxId | string | yes | box id |
| type | string | yes | token type |
| scope | string | yes | token scope |
| externalId | string | yes | rfid |
| creationDate | string (date-time) | yes | creation date |
| expirationDate | string (date-time) | yes | expiration date |
| deletionDate | string (date-time) | yes | deletion date |

### VehicleUnavailabilityRequestDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cronExpression | string | no |  |
| vehicleIds | string[] | no |  |
| duration | integer (int32) | no |  |
| fleetId | string | no |  |

### VehicleWithLockedInfoDTO
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | Vehicle Unique Id |
| registrationDate | string (date) | no | Registration date of the vehicle (matriculation) |
| locked | boolean | no |  |

### WakeupResponse
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | integer | no | the response status (0 \| 1). |

### WalletRequestDTO
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

### WalletResponseDTO
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
| id | string | yes | Wallet UUID |
| promoCodeReference | string | no |  |
| availableAmount | number | no |  |
| usedAmount | number | no |  |
| originId | string | no |  |
| entityId | string | yes | EntityId (Single or Business) that the wallet belongs to |
| creditAlreadyUsed | boolean | no |  |
| date when a wallet has been changed | string (date-time) | yes | date when a wallet has been changed |
| type | string: `LOCAL`, `GLOBAL`, `PERIODIC` | yes | wallet type |
| usage | string: `TRIP`, `REGISTRATION`, `PRODUCTS`, `ALL` | yes | wallet use for |

### Zone
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| zoneId | string | yes | Id of the zone |
| version | integer (int32) | yes | zone version |
| type | string | yes | zone type (allowed, forbidden, parking) |
| sticky | boolean | no | if set the zone added manually will not be deleted by automatic the zone matching |

### ZoneDetails
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| zoneId | string | no | Unique id of the zone |
| occupiedSpots | integer (int32) | no | number of vehicles in the zone. |
| type | string: `allowed`, `forbidden`, `parking` | no | type of the zone : allowed - Vehicle available for booking. forbidden - Vehicle in use. parking - parking |
| vehicles | string[] | no |  |

### Zones
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| zoneId | string | no | Unique id of the zone |
| version | integer (int32) | no | each time a zone is updated (geometry or type update), its version number is incremented (deprecated) |
| type | string: `allowed`, `forbidden`, `parking` | no | type of the zone : allowed - The vehicle is in an operational area and can finish the trip except if the zone list contains a forbidden zone. forbidden - The v… |
