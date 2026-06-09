# README - FAZA 2: Administrator za male poslove - Frontend i API

## 🚀 Početak / Getting Started

### Preduslov (Prerequisites)
- Node.js >= 16
- PostgreSQL je instaliran i pokrenut
- npm ili yarn

### Instalacija Database-a

1. **Kreiraj novu PostgreSQL bazu:**
   ```bash
   createdb biznis_admin_db
   ```

2. **Pokreni Prisma migracije (iz direktorijuma `skills`):**
   ```bash
   npm run prisma:migrate
   ```

---

## 🔧 Pokretanje Aplikacije

### Terminal 1: Backend Server

```bash
cd c:\Users\PC\OneDrive\Desktop\Novi\ proram\.sixth\skills
npm run dev
```

✅ Server će biti dostupan na: **http://localhost:5000**
✅ API endpoints dostupni na: **http://localhost:5000/api**

### Terminal 2: Frontend Dev Server

Frontend je već pokrenut i dostupan na: **http://localhost:5173**

(Ako nije, izvršite:)
```bash
cd c:\Users\PC\OneDrive\Desktop\Novi\ proram\.sixth\skills\frontend
npm run dev
```

---

## 📝 Prva Uputstva za Korišćenje

### 1. **Registracija Korisnika**

1. Idi na http://localhost:5173
2. Klikni na "Nemaš nalog? Registriraj se"
3. Uniesi:
   - **Email:** npr. `salon@example.com`
   - **Lozinka:** npr. `Test123!`
   - **Naziv salona:** npr. `Moj Salon`
4. Klikni "Registracija"
5. Automatski ćeš biti preusmjeren na Dashboard

### 2. **Setovanje Usluga**

1. Na Dashboard-u, klikni na karticu "Usluge" ili idi na `/services`
2. Klikni "+ Dodaj novu uslugu"
3. Uniesi:
   - **Naziv:** npr. "Rez"
   - **Trajanje:** npr. 30 (minute)
   - **Cijena:** npr. 20 (KM/EUR/USD)
4. Klikni "Spremi"
5. Dodaj nekoliko usluga (npr. Boja, Tretman, itd.)

### 3. **Dodavanje Klijenta**

1. Klikni na karticu "Klijenti" ili idi na `/clients`
2. Klikni "+ Dodaj novog klijenta"
3. Uniesi:
   - **Ime i prezime:** npr. "Marko Marković"
   - **Telefon:** npr. "+387 61 123 456"
   - **Email:** npr. "marko@example.com"
4. Klikni "Spremi"
5. Dodaj nekoliko test klijenta

### 4. **Zakazivanje Termina**

1. Klikni na karticu "Termini" ili idi na `/appointments`
2. Klikni "+ Dodaj novi termin"
3. Izaberi:
   - **Klijent:** npr. "Marko Marković"
   - **Usluga:** npr. "Rez"
   - **Vrijeme:** npr. "2026-04-08 10:00"
4. Uniesi napomene (opciono)
5. Klikni "Spremi"
6. Vrijeme završetka se automatski proračunava na osnovu trajanja usluge

---

## 🌐 API Endpoints (Backend)

### Authentication
- `POST /api/auth/register` - Registracija novog korisnika
- `POST /api/auth/login` - Login korisnika
- `POST /api/auth/logout` - Logout korisnika

### Clients
- `GET /api/clients` - Dohvati sve klijente
- `GET /api/clients/:id` - Dohvati specifičnog klijenta
- `POST /api/clients` - Kreiraj novog klijenta
- `PUT /api/clients/:id` - Ažuriraj klijenta
- `DELETE /api/clients/:id` - Obriši klijenta

### Services
- `GET /api/services` - Dohvati sve usluge
- `GET /api/services/:id` - Dohvati specifičnu uslugu
- `POST /api/services` - Kreiraj novu uslugu
- `PUT /api/services/:id` - Ažuriraj uslugu
- `DELETE /api/services/:id` - Obriši uslugu

### Appointments
- `GET /api/appointments` - Dohvati sve termine
  - Query params: `?startDate=ISO&endDate=ISO&status=pending`
- `GET /api/appointments/:id` - Dohvati specifičan termin
- `POST /api/appointments` - Kreiraj novi termin
- `PUT /api/appointments/:id` - Ažuriraj termin
- `DELETE /api/appointments/:id` - Obriši termin

---

## 🔐 Autentifikacija

Svi zahtjevi (osim regstracije i logovanja) trebaju **Authorization** header:

```
Authorization: Bearer <JWT_TOKEN>
```

Token se automatski sprema u `localStorage` nakon registracije/logovanja i automatski dodaje u sve zahtjeve kroz Axios interceptor.

---

## 📂 Struktura Projekta

### Backend (`/skills`)
```
skills/
├── src/
│   ├── controllers/      # Poslovni logic
│   ├── routes/          # API rute
│   ├── middleware/      # Auth middleware
│   ├── utils/           # JWT, Password utilities
│   └── server.ts        # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── .env                 # Environment varijable
└── package.json
```

### Frontend (`/skills/frontend`)
```
frontend/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── context/         # Auth context
│   ├── hooks/          # Custom hooks
│   ├── utils/          # API client
│   └── App.tsx         # Main app component
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🧪 Testiranje API-ja (Postman/Insomnia)

### 1. Registracija

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@salon.com",
  "password": "Test123!",
  "salonName": "Moj Salon"
}
```

Odgovor:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clu7...",
    "email": "test@salon.com",
    "salonName": "Moj Salon"
  }
}
```

### 2. Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@salon.com",
  "password": "Test123!"
}
```

### 3. Dodaj Klijenta

```http
POST http://localhost:5000/api/clients
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "fullName": "Marko Marković",
  "phone": "+387 61 123 456",
  "email": "marko@example.com"
}
```

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm install
npm run prisma:generate
```

### "PostgreSQL connection refused"
Provjeri da je PostgreSQL servis pokrenut i da je baza `biznis_admin_db` kreirana.

### "CORS error"
Provjeri da je `FRONTEND_URL` u `.env` setovan na `http://localhost:5173`

### "JWT token invalid"
Obriši `localStorage` i ponovo se registriraj/prijavi.

---

## 📋 Sljedeće Faze (Faza 3, 4, 5...)

- **Faza 3:** Invoice i Payment sistem
- **Faza 4:** Izvještaji i statistika
- **Faza 5:** Stripe integracija

---

## 📞 Support

Za pitanja ili probleme, kontaktiraj development team.

---

**Verzija:** 1.0.0  
**Status:** Faza 2 - Završena ✅  
**Datum:** April 8, 2026
