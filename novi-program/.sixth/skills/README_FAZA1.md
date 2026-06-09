# Faza 1: Backend infrastruktura i baza podataka

## Gdje se nalazimo

✅ **Inicijalizirana Node.js + Express.js aplikacija**
✅ **Postavljeno TypeScript**
✅ **Konfiguriran Prisma ORM**
✅ **Kreirane sve potrebne tabele u schema.prisma**
✅ **Implementirana autentifikacija sa JWT tokenima**
✅ **Kreirani auth API endpoints**

## Šta je implementirano

### 1. Server konfiguracija (`src/server.ts`)
- Express server sa CORS podrškuom
- Konfiguracija za frontend URL
- Health check endpoint (`GET /api/health`)

### 2. Baza podataka - Prisma schema
Kreirane sljedeće tabele:
- **users** - Korisnici (salon vlasnici)
- **clients** - Klijenti salona
- **services** - Usluge koje salon nudi
- **appointments** - Zakazani termini
- **invoices** - Fakture
- **invoice_items** - Stavke na fakturama
- **payments** - Plaćanja

### 3. Autentifikacija
- **JWT token** autentifikacija sa 7-dnevnim expiresom
- **Password hashing** sa PBKDF2
- **Auth middleware** za zaštitu ruta

### 4. API Endpoints
```
POST /api/auth/register - Registracija korisnika
  Body: { email, password, salonName }
  Odgovor: { token, user }

POST /api/auth/login - Prijava korisnika
  Body: { email, password }
  Odgovor: { token, user }

POST /api/auth/logout - Odjava (zahtijeva token)
  Header: Authorization: Bearer <token>
```

## Kako nastaviti

### Korak 1: Postavi PostgreSQL bazu podataka

#### Opcija A: Koristi Prisma Data Platform (preporučuje se za brz razvoj)
```bash
npx create-db
```
Ovo će stvoriti besplatnu Prisma PostgreSQL bazu i popuniti `.env` sa `DATABASE_URL`.

#### Opcija B: Koristi lokalnu PostgreSQL instalaciju
Ako imaš PostgreSQL instaliran lokalno:
1. Ažuriraj `DATABASE_URL` u `.env` sa tvojom bazom
```
DATABASE_URL="postgresql://user:password@localhost:5432/biznis_admin_db"
```

#### Opcija C: Docker sa PostgreSQL
```bash
docker run --name postgres-biznis -e POSTGRES_PASSWORD=password -e POSTGRES_DB=biznis_admin_db -p 5432:5432 -d postgres
```
Zatim ažuriraj `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/biznis_admin_db"
```

### Korak 2: Primijeni bazu migracija
```bash
npm run prisma:migrate
```
Unesite naziv migracije, npr. `init` ili `create_tables`.

### Korak 3: Generiraj Prisma client
```bash
npm run prisma:generate
```

### Korak 4: Pokreni Development server
```bash
npm run dev
```
Server će biti dostupan na `http://localhost:5000`

## Testiranje endpoints-a

### Koristi Postman ili cURL

#### 1. Registracija
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vlasnik@salon.com",
    "password": "password123",
    "salonName": "Fensi Salon"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cuid123",
    "email": "vlasnik@salon.com",
    "salonName": "Fensi Salon"
  }
}
```

#### 2. Prijava
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vlasnik@salon.com",
    "password": "password123"
  }'
```

#### 3. Logout (sa tokenom)
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN_KOJI_JE_PRIMLJEN>"
```

#### 4. Health check
```bash
curl http://localhost:5000/api/health
```

## Struktura projekta
```
skills/
├── src/
│   ├── server.ts              # Main Express server
│   ├── middleware/
│   │   └── auth.ts            # JWT auth middleware
│   ├── controllers/
│   │   └── authController.ts  # Auth logic (register, login, logout)
│   ├── routes/
│   │   └── authRoutes.ts      # Auth API routes
│   └── utils/
│       ├── jwt.ts             # JWT token generation/verification
│       └── password.ts        # Password hashing/verification
├── prisma/
│   └── schema.prisma          # Database schema definition
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── README_FAZA1.md           # Ovaj file
```

## Sledeća faza (Faza 2)

Kada je Faza 1 potpuno gotova (baza je konfigurirana i auth radi), počinjem sa **Fazom 2: Frontend osnovna struktura + Upravljanje klijentima i terminima**.

To će uključiti:
- React aplikacija sa Vite
- Login/Register forme
- Clients management (CRUD)
- Appointments management (CRUD)
- Korak po korak integracijom sa backend API-jem

## Troubleshooting

### Problem: "Cannot find module 'jsonwebtoken'"
**Rješenje:** Pokrenite `npm install jsonwebtoken`

### Problem: "No database connection"
**Rješenje:** Provjerite da je `DATABASE_URL` ispravno postavljen u `.env` fajlu

### Problem: "Migration failed"
**Rješenje:** Obrisati `node_modules` folder, pokrenuti `npm install` i pokušati ponovo

## Environment varijable (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/biznis_admin_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

---

**Status Faze 1:** ✅ Gotovo
**Ideja:** Backend je spreman, čekamo konfiguraciju baze i onda možemo testirati endpoints prije nego što počnemo sa Fazom 2.
