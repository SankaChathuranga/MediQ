# MediQueue LK

## Project Title
MediQueue LK — Pharmacy Medicine Availability Checker for Sri Lanka

## Problem
<!-- Describe the problem this project solves -->

## Solution
<!-- Describe your solution and how it addresses the problem -->

## Features
<!-- List the key features of MediQueue LK -->
- Medicine Catalog — browse and search all medicines
- Pharmacy Stock — view real-time stock levels across pharmacies
- Pharmacy Directory — find pharmacies by area and contact
- Patient Requests — post medicine requests when stock is unavailable

## Tech & AI Tools Used
<!-- List technologies and AI tools used in this project -->
- **Frontend:** React (Vite) + MUI v5 (Material Design 3)
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon/Supabase)
- **Validation:** Zod
- **Forms:** React Hook Form
- **AI Tools:** <!-- list AI tools used -->

## Team Contributions
| Member | Module | Contribution |
|--------|--------|-------------|
| Member 1 | Medicine Catalog | <!-- describe contribution --> |
| Member 2 | Pharmacy Stock | <!-- describe contribution --> |
| Member 3 | Pharmacy Directory | <!-- describe contribution --> |
| Member 4 (repo owner) | Patient Requests + matching | <!-- describe contribution --> |

## Install & Run Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL database (Neon or Supabase recommended)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd MediQ

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Environment Variables

Copy `.env.example` files and fill in your values:

```bash
# In /server
cp .env.example .env

# In /client
cp .env.example .env.local
```

### Database

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### Run Development Servers

```bash
# From repo root (runs both client & server)
npm run dev

# Or separately:
cd server && npm run dev   # http://localhost:3001
cd client && npm run dev  # http://localhost:5173
```

## Deployed Link
<!-- Add your deployed app URL here -->

## Demo Video
<!-- Add your demo video link here -->
