# SMS Notifications Setup (Optional - Twilio)

This is an **optional** feature for sending SMS reminders to clients. SMS is disabled by default.

## Prerequisites

1. **Twilio Account**: Sign up at https://www.twilio.com/
2. **Verified Phone Number**: Your business phone number for sending SMS
3. **Client's Phone Number**: Store customer phone numbers in the Client table

## Setup Instructions

### Step 1: Get Twilio Credentials

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID** and **Auth Token**
3. Get a **Phone Number** (Twilio will assign one for sending SMS)

### Step 2: Install Twilio Package

```bash
cd c:\Users\PC\OneDrive\Desktop\Novi proram\.sixth\skills
npm install twilio
npm install --save-dev @types/twilio
```

### Step 3: Update Environment Variables

Add to your `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

### Step 4: Add Phone Number to Clients

Update the Client model in `prisma/schema.prisma` to include phone number (if not already present):

```prisma
model Client {
  // ... existing fields
  phone     String    // Already exists - this is used for SMS
  // ...
}
```

### Step 5: Enable SMS in Appointment Controller

Uncomment the SMS imports in `src/controllers/appointmentController.ts`:

```typescript
import {
  sendAppointmentConfirmationSMS,
  sendAppointmentReminderSMS,
  sendAppointmentCancellationSMS,
} from '../utils/smsService';
```

Then use in the appointment creation/update/delete functions:

```typescript
// After sending email, send SMS
if (client.phone) {
  try {
    const appointmentTime = new Date(start_time).toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await sendAppointmentConfirmationSMS(
      client.phone,
      client.fullName,
      service.name,
      appointmentTime
    );
  } catch (smsError) {
    console.error('Failed to send SMS:', smsError);
  }
}
```

## Features Implemented

- ✅ `sendAppointmentConfirmationSMS()` - Confirmation when appointment is created
- ✅ `sendAppointmentReminderSMS()` - Reminder 24h before (scheduled separately)
- ✅ `sendAppointmentCancellationSMS()` - Notification when appointment is cancelled

## Scheduled SMS Reminders

For **24-hour reminders**, you'll need a job scheduler. Install `node-cron`:

```bash
npm install node-cron
```

Create `src/jobs/appointmentReminders.ts`:

```typescript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendAppointmentReminderSMS } from '../utils/smsService';

const prisma = new PrismaClient();

// Run every hour to check for appointments tomorrow
export const startReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    // Check at 9 AM every day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointmentsTomorrow = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: tomorrow,
          lt: nextDay,
        },
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        client: true,
        service: true,
      },
    });

    for (const appointment of appointmentsTomorrow) {
      if (appointment.client.phone) {
        try {
          const appointmentTime = appointment.startTime.toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit',
          });

          await sendAppointmentReminderSMS(
            appointment.client.phone,
            appointment.client.fullName,
            appointment.service.name,
            appointmentTime
          );
        } catch (error) {
          console.error('Failed to send reminder SMS:', error);
        }
      }
    }
  });

  console.log('Appointment reminder job started');
};
```

## Pricing

Twilio SMS is **pay-as-you-go**. Typical costs are $0.0075 per SMS in most countries.

## Testing

Without Twilio credentials, SMS service gracefully degrades and logs a warning. You can test locally without SMS enabled by checking logs.

## Troubleshooting

1. **"Twilio is not configured"** - Add environment variables to `.env` and restart server
2. **Phone number format** - Use international format: `+1234567890`
3. **Account suspended** - Verify your Twilio account is active and funded
4. **Message not received** - Check if client's phone number is correct and not blocked

## Disabling SMS

To disable SMS, simply don't set the Twilio environment variables. The smsService will gracefully handle the absence of credentials.
