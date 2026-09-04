# DATABASE.md — MediQueue LK

## Schema Overview

All four modules share one PostgreSQL database and one `schema.prisma`.

```
medicines(id, name, generic_name, category, description)
pharmacies(id, name, address, area, contact, hours)
stock(id, pharmacy_id FK, medicine_id FK, quantity, price, last_updated)
requests(id, patient_contact, medicine_id FK, area, urgency, status, created_at)
```

---

## Tables

### `medicines`
| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | Auto-increment primary key |
| name | String | Brand/trade name of the medicine |
| generic_name | String | Generic/chemical name |
| category | String | Drug category (e.g. Antibiotic, Painkiller) |
| description | String? | Optional notes or usage description |

### `pharmacies`
| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | Auto-increment primary key |
| name | String | Pharmacy name |
| address | String | Street address |
| area | String | Area/district (used for location filtering) |
| contact | String | Phone or email |
| hours | String | Opening hours |

### `stock`
| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | Auto-increment primary key |
| pharmacy_id | Int (FK) | References pharmacies.id |
| medicine_id | Int (FK) | References medicines.id |
| quantity | Int | Current quantity in stock |
| price | Float | Price per unit |
| last_updated | DateTime | Auto-updated on every write |

### `requests`
| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | Auto-increment primary key |
| patient_contact | String | Patient phone or email |
| medicine_id | Int (FK) | References medicines.id |
| area | String | Patient's area for proximity matching |
| urgency | String | e.g. "urgent", "normal" |
| status | String | "open" (default), "fulfilled", "closed" |
| created_at | DateTime | Timestamp when request was created |

---

## Relationships

- `stock.medicine_id → medicines.id` (many-to-one)
- `stock.pharmacy_id → pharmacies.id` (many-to-one)
- `requests.medicine_id → medicines.id` (many-to-one)

---

## Migration & Seeding
<!-- Add notes here about migration strategy and seed data -->
