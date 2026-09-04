# Patient Requests & Matching Module — Explanation

This document provides a detailed breakdown of the **Patient Requests & Matching** module (Member 4's part) for the MediQueue LK project. Use this to prepare for questions from your lecturers.

---

## 1. Module Overview
The Patient Requests module bridges the gap when a patient cannot find a medicine they need. Instead of constantly refreshing the app, patients can post a **Request** specifying what they need, their contact info, and their location. 

The core feature of this module is the **Matching Logic**, which connects open patient requests with real-time pharmacy stock data to help patients secure their medicines.

## 2. Database Schema
Your module relies primarily on the `Request` table and its relationships.

```prisma
model Request {
  id              Int      @id @default(autoincrement())
  patient_contact String   // Phone or email of the patient
  medicine_id     Int      // Foreign key linking to the Medicine table
  area            String   // Used to match with Pharmacy locations
  urgency         String   // E.g., "urgent", "normal"
  status          String   @default("open") // "open", "fulfilled", "closed"
  created_at      DateTime @default(now())
  
  medicine        Medicine @relation(fields: [medicine_id], references: [id])
}
```
**Key Relationships:**
- **Many-to-One:** Many requests can be made for a single medicine (`medicine_id → Medicine.id`).
- **Implicit Link to Stock:** The `medicine_id` allows us to query the `Stock` table to see if any pharmacy has it available.

## 3. API Endpoints
Your backend routes (in `server/routes/requests.js`) handle CRUD operations. As per `CLAUDE.md`, all routes return a standardized response format: `{ success: true, data: ... }`.

- **`GET /api/requests`**: Fetches a list of patient requests. You will likely implement filtering here (e.g., filter by `area` or `status="open"`).
- **`GET /api/requests/:id`**: Fetches a single request. **Crucially, this endpoint runs the matching logic** and returns the request details along with available stock in pharmacies nearby.
- **`POST /api/requests`**: Creates a new request. Expects `patient_contact`, `medicine_id`, `area`, and `urgency`. Validated using Zod before touching Prisma.
- **`PUT /api/requests/:id`**: Updates a request, most commonly changing its `status` from `"open"` to `"fulfilled"` once the patient gets their medicine.
- **`DELETE /api/requests/:id`**: Removes a request (typically only if cancelled or created by mistake).

## 4. The Matching Logic (Core Feature)
The matching logic is the most advanced part of your module. 

**How it works conceptually:**
1. A patient looks at their request for `medicine_id = X` in `area = Y`.
2. The backend queries the `Stock` table where `medicine_id == X` and `quantity > 0`.
3. It joins the `Pharmacy` table to get the pharmacy's area.
4. It prioritizes or filters results where `Pharmacy.area == Request.area`.

**Prisma Implementation Example:**
When fetching a request, you would write a query like this to find matches:
```javascript
const matches = await prisma.stock.findMany({
  where: {
    medicine_id: request.medicine_id,
    quantity: { gt: 0 }, // Must be in stock
  },
  include: {
    pharmacy: true // Bring in pharmacy details for location/contact
  }
});
```
You can then sort these matches, placing the ones where `pharmacy.area === request.area` at the top.

## 5. Frontend Implementation
Your React frontend (`client/src/pages/PatientRequests.jsx`) needs two main views:
1. **Patient View:** 
   - A form to create a new request (using React Hook Form and Zod).
   - A list of their open requests, displaying matched pharmacies (if any stock has become available).
2. **Pharmacy/Admin View:**
   - A dashboard showing all open requests in their area so the pharmacy knows what medicines are currently in high demand.

**UI Components:**
- Uses Material UI (`@mui/material`).
- Status Chips: Green for `"fulfilled"`, Blue for `"open"`.
- Uses `theme.palette.primary.main` for buttons as dictated by `CLAUDE.md`.

---

## 6. Potential Lecturer Questions & Answers

**Q: How does the matching logic work in your system?**
**A:** "When a request is viewed, the backend takes the `medicine_id` from the request and queries the `Stock` table for any entries where `quantity > 0`. It includes the linked `Pharmacy` data and sorts the results so that pharmacies in the same `area` as the patient's request appear first."

**Q: How do you ensure data integrity when creating a request?**
**A:** "We use Zod for validation on both the frontend and backend. Before Prisma even touches the database, the Express route validates the request body to ensure all required fields (like `patient_contact` and `medicine_id`) are present and correctly formatted. If it fails, we return a 400 Bad Request."

**Q: How does your module interact with the modules built by your teammates?**
**A:** "My module ties everything together. A `Request` requires a `Medicine` (Member 1's module). To fulfill a request, I query the `Stock` table (Member 2's module), which in turn links to `Pharmacies` (Member 3's module). We share the same `schema.prisma` file, which makes defining these foreign key relationships straightforward."

**Q: Why don't you return raw Prisma objects to the frontend?**
**A:** "As outlined in our API contract, we use DTOs (Data Transfer Objects). We wrap all responses in a standard `{ success: true, data: { ... } }` object. This ensures the frontend doesn't break if our database schema changes, and it makes error handling uniform across all four modules."

**Q: What happens to a request once the patient gets the medicine?**
**A:** "The patient or pharmacy can hit the `PUT /api/requests/:id` endpoint to change the request status to 'fulfilled'. We don't delete the record so we can keep a history of demand, but it gets filtered out of the 'open requests' views."
