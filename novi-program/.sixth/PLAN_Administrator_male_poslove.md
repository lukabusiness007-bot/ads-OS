# Plan: Administrator za male poslove - Sistem upravljanja biznisom

## TL;DR
Napraviti web aplikaciju za manje uslužne djelatnosti (frizeri, zubari, mehaničari) koja omogućava upravljanje klijentima, zakazivanjem termina, fakturiranjem, prikupljanjem plačanja i generisanjem izvještaja. Frontend će biti React + TypeScript, backend Node.js/Express sa PostgreSQL bazom. Fokus na jednostavnost i brzinu implementacije - MVP sa 6 критичких funkcionalnosti.

## Arhitektura na visokom nivou

**Frontend:** React 18 + TypeScript + Tailwind CSS (ili Shadcn UI komponente)
**Backend:** Node.js + Express.js + PostgreSQL
**Authentication:** JWT tokeni (email/password)
**Payment:** Stripe API integracija
**Notifications:** SendGrid (emails) + SMS (Twilio opciono)
**Hosting:** Frontend na Vercel/Netlify, Backend na Render/Railway/DigitalOcean

## Faze implementacije

### Faza 1: Backend infrastruktura i baza podataka (Blokira sve ostalo)
1. Inicijalizacija Node.js projekta sa Express.js
   - Instalacija: `npm init`, express, typescript, dotenv, cors
   - Konfiguracija: .env fajl za environment varijable
   
2. Postavljanje PostgreSQL baze
   - Korisni alati: pg (Node client) ili TypeORM/Prisma ORM
   - Preporuka: **Prisma ORM** - lakši je za brz razvoj i dobija se typed client
   
3. Database schema (koristeći Prisma migrations):
   - **User** tabela: users (id, email, password_hash, role, salon_name, created_at)
   - **Client** tabela: clients (id, userId, fullName, phone, email, createdAt, updatedAt)
   - **Service** tabela: services (id, userId, name, duration_minutes, price, created_at)
   - **Appointment** tabela: appointments (id, clientId, serviceId, start_time, end_time, status, notes, createdAt)
   - **Invoice** tabela: invoices (id, clientId, total, status, paid_at, due_date, created_at)
   - **InvoiceItem** tabela: invoiceItems (id, invoiceId, serviceId/description, quantity, price)
   - **Payment** tabela: payments (id, invoiceId, amount, method, status, stripePaymentId, created_at)

4. Postavljanje autentifikacije:
   - JWT secret u .env
   - Endpoint: POST /api/auth/register (sa validacijom email-a)
   - Endpoint: POST /api/auth/login (vraća JWT token)
   - Endpoint: POST /api/auth/logout
   - Middleware za zaštitu ruta: `verifyToken()`

5. CORS konfiguracija za frontend lokaciju

**Verifikacija Faze 1:**
- Pokrenuta PostgreSQL baza, sve migracije uspješne
- Möžete se registrirati i prijaviti (JWT token primljen)
- Swagger/Postman testiranje dostupnih endpoints

---

### Faza 2: Frontend osnovna struktura + Upravljanje klijentima i terminima (*paralelno-dijelomično sa Fazom 1*)
**Počinje:** čim je auth backend spreman

1. Inicijalizacija React projekta
   - `create-react-app` ili `vite` (preporuka: Vite - brže)
   - Instalacija: React Router, Axios, TailwindCSS (ili ShadcnUI)
   
2. Osnovna routing struktura:
   - `/login` - Login stranica
   - `/register` - Registracija
   - `/dashboard` - Glavna kontrolna tabla
   - `/clients` - Управљање klijentima
   - `/appointments` - Календар termina
   - `/invoices` - Fakture
   
3. Autentifikacijski komponente:
   - Login forma sa JWT token storage (localStorage)
   - ProtectedRoute komponenta koja provjerava token
   - Logout funkcionalnost

4. Klijent menadžment:
   - **Client lista stranica:**
     - Tabela sa klijentima (name, phone, email, broj termina)
     - Dodaj novog klijenta (modal forma)
     - Uredi klijenta
     - Obriši klijenta
   - **Backend endpoints:**
     - GET /api/clients (lista)
     - GET /api/clients/:id (detalji)
     - POST /api/clients (kreiraj)
     - PUT /api/clients/:id (ažuriraj)
     - DELETE /api/clients/:id (obriši)

5. Upravljanje terminima:
   - **Appointment stranica:**
     - Календар pregled (Google Calendar ili samo tabela sa vremenskim slotovima)
     - Forma za novu rezervaciju (odabir klijenta, servisa, vremena)
     - Pregled svih termina dane/sedmice/mjeseca
     - Uredi termin (izmjena vremena, statusa)
     - Obriši termin
   - **Status termina:** pending, confirmed, completed, cancelled
   - **Backend endpoints:**
     - GET /api/appointments (sa filterima za datum/status)
     - GET /api/appointments/:id
     - POST /api/appointments (kreiraj)
     - PUT /api/appointments/:id (ažuriraj)
     - DELETE /api/appointments/:id

6. Servis menadžment (priprema za fakturiranje):
   - Backend endpoints:
     - GET /api/services
     - POST /api/services
     - PUT /api/services/:id
     - DELETE /api/services/:id

**Verifikacija Faze 2:**
- Može se kreirati, ažurirati, brisati klijenti preko UI
- Može se zakazati, izmjena i otkazati termin
- Termini se pojavljuju na kalendaru
- Termini su povezani sa klijentima (1-na-više relacija)

---

### Faza 3: Fakturiranje i Payment integracija
**Počinje:** čim su Faza 2 i backend/services gotovi

1. Faktura menadžment:
   - **Invoice stranica:**
     - Tabela invoices sa statusom (draft, sent, paid, overdue)
     - Generiši fakturu od termina/servisa (odaberi klijenta, servise, količine)
     - Pregled detaljne fakture
     - Uredi fakturu (prije nego što je poslana)
     - Skidanje kao PDF
   - **Backend endpoints:**
     - GET /api/invoices (sa filterima)
     - GET /api/invoices/:id
     - POST /api/invoices (kreiraj)
     - PUT /api/invoices/:id (ažuriraj)
     - DELETE /api/invoices/:id
     - POST /api/invoices/:id/send (pošalji klijentu email)
     - GET /api/invoices/:id/pdf (generiši PDF - koristiti pdfkit ili puppeteer)

2. Payment integracija (Stripe):
   - Klijent klikne na "Pay" na faktturi
   - Preusmjeruje na Stripe Checkout
   - Nakon uspješnog plačanja, webhook ažurira invoice status na "paid"
   - Backend endpoints:
     - POST /api/payments/create-checkout-session (kreira Stripe sesiju)
     - POST /api/webhooks/stripe (webhook za ažuriranje invoice statusa)

3. Notifikacije okolo faktura:
   - Email se šalje kada se faktura kreira (SendGrid)
   - Email payment reminder (opciono za Fazu 2+)

**Verifikacija Faze 3:**
- Može se kreirati i pregledati faktura
- PDF download funkcioniše
- Stripe checkout radi i ažurira invoice status
- Email notifikacije stignu

---

### Faza 4: Notifikacije, izvještaji i napredne opcije

1. Email notifikacije (SendGrid) - expand na već postojeće:
   - Potvrda rezervacije: trenutno kad se kreira termin
   - Reminder: 24h prije termina (async job)
   - Otkazivanje: kad se termin otkaže
   - Faktura poslana: kad se faktura kreiraj
   
2. Izvještaji i statistika:
   - **Reports stranica:**
     - Ukupan prihod (period)
     - Broj termina/servisa (period)
     - Top servisi po broju/prihodu
     - Klijent statistika (novi klijenti, povraćeni, prosjek wydanja)
     - Grafici: linijske (revenue trend), pie (servisi), bar (klijenti po mjesecu)
   - **Backend:**
     - GET /api/reports/revenue (sa filterima za datum)
     - GET /api/reports/appointments-summary
     - GET /api/reports/services-summary

3. SMS notifikacije (Twilio - opciono):
   - Reminder SMS prije termina (ako je klijent dao broj)
   
4. Dashboard/Home stranica:
   - Skraćeni pregled: sledeći termini danas, novi klijenti ove sedmice, pending fakture
   - Quick actions: nova rezervacija, novi klijent, nova faktura

**Verifikacija Faze 4:**
- Notifikacije se šalju email
- Reports se mogu pogledati sa točnih brojevi
- Dashboard prikazuje relevantne informacije

---

## Relevantni fajlovi/gdje implementirati

```
Backend struktura:
├── src/
│   ├── config/
│   │   └── database.ts (Prisma klijent)
│   │   └── stripe.ts (Stripe konfiguracija)
│   │   └── email.ts (SendGrid konfiguracija)
│   ├── middleware/
│   │   └── auth.ts (JWT verifikacija)
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.ts (login, register, logout)
│   │   ├── clients.ts (CRUD klijent)
│   │   ├── appointments.ts (CRUD termini)
│   │   ├── invoices.ts (CRUD fakture, PDF generate)
│   │   ├── payments.ts (Stripe integracija)
│   │   ├── services.ts (CRUD servisi)
│   │   ├── reports.ts (statistika)
│   │   └── webhooks.ts (Stripe webhook)
│   ├── services/
│   │   ├── emailService.ts (SendGrid)
│   │   ├── pdfService.ts (generisanje PDF)
│   │   └── stripeService.ts
│   └── app.ts (Express app setup)

Frontend struktura:
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── AppointmentsPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   └── ReportsPage.tsx
│   ├── components/
│   │   ├── ClientForm.tsx
│   │   ├── AppointmentCalendar.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── PaymentButton.tsx (Stripe)
│   │   └── DashboardCards.tsx
│   ├── hooks/
│   │   ├── useAuth.ts (auth context)
│   │   ├── useClients.ts (API calls)
│   │   └── useAppointments.ts (API calls)
│   ├── context/
│   │   └── AuthContext.tsx
│   └── App.tsx (routing)
```

## Verifikacija finalne implementacije

1. **Funkcionalnostna testiranja:**
   - [ ] Može se registrirati novi korisnik sa jedinstevnim email-om
   - [ ] Može se kreirati/uredi/obriši klijent
   - [ ] Može se zakazati/promjena/otkazati termin
   - [ ] Termin se pojavljuje na kalendaru
   - [ ] Može se generiši faktura od termina
   - [ ] Može se preuzeti faktura kao PDF
   - [ ] Stripe checkout radi i ažurira status
   - [ ] Email se šalje nakon kreiranja fakture
   - [ ] Izvještaji prikazuju točne brojeve

2. **Performanse:**
   - API response vrijeme < 500ms
   - Frontend stranica učitava < 3s
   
3. **Sigurnost:**
   - JWT token validan samo određeni sat
   - Korisnik može pristupiti samo svojim klijentima/terminima
   - Password je hashiran (bcrypt)
   - Stripe API secret nije izložen na frontend

4. **Deployment:**
   - Frontend je deployin na Vercel/Netlify
   - Backend je deployiran na Render/Railway
   - PostgreSQL baza je dostupna (RDS ili Heroku Postgres)

## Što je UKLJUČENO vs ISKLJUČENO

**Uključeno (MVP):**
- Email notifikacije
- Autentifikacija (email/password)
- CRUD za klijente, termine, fakture, servise
- PDF generiranje
- Stripe payment
- Osnovni izvještaji
- JWT auth

**Isključeno (za budućnost):**
- SMS notifikacije (osim prijedloga u Fazi 4)
- Multi-user/zaposlenik upravljanje (samo jedan admin po biznisu)
- Booking link za klijente (self-service zakazivanje)
- Invoicing od već dovršenih termina (samo ručno od servisa)
- Integracija sa Google Calendar/Outlook
- Mobile app
- Multi-language podrška (samo jedan jezik)
- Custom branding/whitelabel

## Estimirana vremenska skala
- Faza 1: 2-3 dana (DB + auth backend)
- Faza 2: 4-5 dana (frontend osnove)
- Faza 3: 2-3 dana (invoices + Stripe)
- Faza 4: 2-3 dana (notifikacije, reports)
- **Ukupno: ~2 sedmice** za jednog developera

## Kritičke odluke

1. **ORM izbor:** Prisma je odabran jer ima najbolje TypeScript podrške, lakši je za migracije, i idealan za brz razvoj.
2. **Database:** PostgreSQL jer je free (postoji besplatan tier na Render), robusna, i bolja od SQLite za production.
3. **Frontend framework:** React jer je najjednostavniji za ovakvu aplikaciju, ali Vue bi bila validna alternativa.
4. **Stilizacija:** TailwindCSS + ShadcnUI da se izbegne pisanje custom CSS-a.
5. **Payment:** Stripe jer je most mainstream, lako se интегрирал, i manje provizije od drugih.
6. **Hosting:** Vercel/Netlify za frontend (free tier), Render/Railway za backend (free tier dostupan).