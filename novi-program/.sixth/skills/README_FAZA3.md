# README - FAZA 3: Fakturiranje i Payment Integracija

## 🚀 Početak / Getting Started

### Preduslov (Prerequisites)
- Node.js >= 16
- PostgreSQL je instaliran i pokrenut
- Stripe nalog (https://stripe.com)
- SendGrid nalog (https://sendgrid.com)

---

## 🔧 Konfiguracija

### 1. Stripe Setup
1. Idi na https://dashboard.stripe.com/apikeys
2. Kopiraj **Secret Key** (počinje sa `sk_test_`)
3. Obriši `sk_test_YOUR_KEY_HERE` iz `.env` i zalijepi pravi ključ
4. Za webhooks, obriši `whsec_YOUR_KEY_HERE` i postavi kasnije

### 2. SendGrid Setup
1. Idi na https://app.sendgrid.com/settings/api_keys
2. Kreiraj **API Key**
3. Kopiraj ključ
4. Ažuriraj `.env`: `SENDGRID_API_KEY=SG.your_key_here`

### 3. Ažuriranje `.env` fajla
```
STRIPE_SECRET_KEY=sk_test_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
SENDGRID_API_KEY=SG.your_actual_key
SENDGRID_FROM_EMAIL=noreply@yoursalon.com
```

---

## 🔧 Pokretanje Aplikacije

### Terminal 1: Backend Server
```bash
cd c:\Users\PC\OneDrive\Desktop\Novi\ proram\.sixth\skills
npm run dev
```
✅ Server će biti dostupan na: **http://localhost:5000**

### Terminal 2: Frontend Dev Server
```bash
cd c:\Users\PC\OneDrive\Desktop\Novi\ proram\.sixth\skills\frontend
npm run dev
```
✅ Frontend će biti dostupan na: **http://localhost:5173**

---

## 📋 Uputstva za Korišćenje Faze 3

### 1. **Kreiranje Fakture**

1. Na Dashboard-u, klikni "Fakture" ili idi na `/invoices`
2. Klikni "+ Nova Faktura"
3. U formi:
   - **Izaberite klijenta** - dropdown lista svih dodanih klijenta
   - **Dodaj stavke** - Izaberi usluge i količinu:
     - Click "+ Dodaj stavku"
     - Isaberi uslugu iz liste
     - Unesi količinu
     - Iznos se automatski proračunava
   - **Napomene** (opciono) - više detalja za klijenta
   - **Rok plaćanja** (opciono) - datum do kada trebalo biti plaćeno
4. Klikni "Spremi fakturu"
5. Faktura će biti kreirana sa statusom **"draft" (nacrt)**

### 2. **Pregled Fakture**

1. U listi faktura, klikni na **"Pregled"** za specifičnu fakturu
2. Vidis:
   - Sve detalje (broj, datum, klijent, stavke)
   - Tabelu stavki sa cijenama
   - Ukupan iznos
3. Akcije na stranici:
   - **Preuzmi PDF** - Skida fakturu kao PDF dokument
   - **Plati sa Stripe** - Otvara Stripe Checkout za plaćanje
   - **Nazad** - Nazad na listu faktura

### 3. **Slanje Fakture Klijentu**

1. U listi faktura, nađi fakturu sa statusom **"draft"**
2. Klikni na **"Pošalji"** gumb (red sa fakturoum)
3. Faktura će biti:
   - Ažurirana na status **"sent"**
   - Poslana klijentu email-om sa linkom do pregleda
   - Klijent može pristupiti faktUri i platiti

### 4. **Plaćanje - Stripe Checkout**

#### Kao salon vlasnik (testiranje):
1. Otvori fakturu (Pregled → Detaljno)
2. Klikni **"Plati sa Stripe"** dugme
3. Bit će otvoren **Stripe Checkout** sa:
   - Listat stavki
   - Ukupnim iznosom
   - Email poljem (može se promenjiti)
4. Unesi test karticu:
   - **Broj:** `4242 4242 4242 4242`
   - **Expiracija:** `12/25` (eller bilo koji budući datum)
   - **CVC:** `123` (bilo koji 3-digitni kod)
5. Klikni "Pay"
6. Nakon uspješnog plaćanja:
   - Stripe će potvrditi transakciju
   - Webhook će ažurirati fakturu na **"paid"**
   - Potvrda plaćanja će biti poslana klijentu email-om

### 5. **Preuzimanje PDF-a**

Na detaljima fakture ili u listi:
1. Klikni **"PDF"** dugme
2. Fakturu će biti preuzeta kao:
   - `invoice-INV-1234567890.pdf`
3. Document sadrži profesionalni layout sa:
   - Naslovom salona
   - Informacijama o klijentu
   - Detaljima stavki
   - Ukupnim iznosom

### 6. **Filtriranje Faktura**

U listi faktura, na vrhu je **dropdown za filter**:
- **Svi statusu** - Prikazuje sve
- **Nacrt** - Samo draft fakture
- **Poslana** - Samo sent fakture
- **Plaćena** - Samo paid fakture
- **Istekla** - Samo overdue fakture

---

## 💳 Stripe Test Kartice

Za testiranje u Stripe Checkout-u:

| Status | Broj Kartice | Expiracija | CVC |
|--------|-------------|-----------|-----|
| ✅ Uspjeh | 4242 4242 4242 4242 | 12/25 | 123 |
| ❌ Odbijeno | 4000 0000 0000 0002 | 12/25 | 123 |
| ⚠️ Ponovna provjera | 4000 0000 0000 0127 | 12/25 | 123 |

---

## 📧 Email Notifikacije

### Kada se šalji Email?

1. **Kada se faktura šalje klijentu**
   - Status se promeni u "sent"
   - Sadržaj: Link do fakture, broj, iznos

2. **Kada je plaćanje procesiran**
   - Status se promeni u "paid"
   - Sadržaj: Potvrda plaćanja sa brojem fakture

### Troubleshooting Email-a

Ako email-ovi nisu stigli:

1. **Provjeri SENDGRID_API_KEY u .env**
   - Trebalo bi da počinje sa `SG.`

2. **Provjeri SENDGRID_FROM_EMAIL**
   - Trebalo bi da bude email koji ste registrovali na SendGrid-u

3. **Provjeri logs u backend terminal-u**
   - Trebalo bi da vidis grešku ako je bilo nešto krivo

---

## 🐛 Troubleshooting

### Problem: "Can't reach database server"
**Solucija:**
- Provjeri je li PostgreSQL pokrenut
- Provjeri `DATABASE_URL` u `.env` fajlu

### Problem: "Stripe API Key is not defined"
**Solucija:**
- Ažuriraj `.env` sa stvarnim Stripe ključem
- Restartiraj backend server (`npm run dev`)

### Problem: "SendGrid API Key is invalid"
**Solucija:**
- Registruj se na SendGrid (besplatno)
- Dobij API ključ iz Settings → API Keys
- Ažuriraj `.env`

### Problem: PDF ne skida se
**Solucija:**
- Provjeri da li je PDFKit pravilno instaliran (`npm install pdfkit`)
- Prestartiraj backend server

### Problem: Stripe Checkout ne otvara se
**Solucija:**
- Provjeri je li `STRIPE_SECRET_KEY` postavljen u `.env`
- Provjeri da li je frontend na `http://localhost:5173`
- Provjeri da `FRONTEND_URL` u `.env` odgovara

---

## 📊 Status Fakture - Dijagram

```
┌─────────────────────────────────────┐
│ Kreiraj fakturu                      │
│ Status: DRAFT                        │
└──────────────┬──────────────────────┘
               │
               ├─ Uredi/Obriši (samo draft)
               │
               ├─ Pošalji klijentu
               │         │
               ▼         │
        Status: SENT ◄───┘
               │
               ├─ Plati preko Stripe
               │         │
               ▼         │
        Status: PAID ◄───┘
```

---

## 🎯 API Endpoints Reference

### Invoice Endpoints
- `GET /api/invoices` - Sve fakture
- `POST /api/invoices` - Nova faktura
- `GET /api/invoices/:id` - Pregled
- `PUT /api/invoices/:id` - Ažuriranje
- `DELETE /api/invoices/:id` - Brisanje (draft samo)
- `POST /api/invoices/:id/send` - Slanje email
- `GET /api/invoices/:id/pdf` - PDF download

### Payment Endpoints
- `POST /api/payments/create-checkout-session` - Stripe session
- `POST /api/payments/webhook/stripe` - Webhook (Stripe)
- `GET /api/payments` - Pregled plaćanja

---

## ✅ Checklist - Testiranje Faze 3

- [ ] Login/Registracija radi
- [ ] Klijenti su kreirani (iz Faze 2)
- [ ] Usluge su kreirane (iz Faze 2)
- [ ] Kreiraj novu fakturu sa stavkama
- [ ] Preuzmi fakturu kao PDF
- [ ] Pošalji fakturu klijentu (email trebalo biti stignut)
- [ ] Plati fakturu sa Stripe test karticom
- [ ] Status se promeni na "paid"
- [ ] Payment confirmation email je stignut
- [ ] Filtriranje po statusu radi

---

**Faza 3 je između za upotrebu! Email notifikacije zahtijevaju pravi SendGrid ključ za production. 🚀**
