// SMS Service - Optional using Twilio
// This service is optional and requires Twilio account setup
// Environment variables required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

let twilio: any = null;

// Lazy load Twilio only if available
try {
  twilio = require('twilio');
} catch (e) {
  console.warn('Twilio not installed. SMS service will be unavailable.');
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;

// Initialize Twilio client if credentials are available
if (twilio && accountSid && authToken && fromPhoneNumber) {
  client = twilio(accountSid, authToken);
}

interface SMSOptions {
  to: string;
  message: string;
}

export const sendSMS = async (options: SMSOptions): Promise<void> => {
  // Return silently if Twilio is not configured
  if (!client) {
    console.warn('Twilio is not configured. SMS service is disabled.');
    return;
  }

  try {
    const message = await client.messages.create({
      body: options.message,
      from: fromPhoneNumber,
      to: options.to,
    });

    console.log(`SMS sent to ${options.to}. SID: ${message.sid}`);
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw new Error('Failed to send SMS');
  }
};

export const sendAppointmentReminderSMS = async (
  clientPhone: string,
  clientName: string,
  serviceName: string,
  appointmentTime: string
): Promise<void> => {
  const message = `Podsjetnik: Imate termin za ${serviceName} u ${appointmentTime}. Molimo vas da stignet 10 minuta ranije. Hvala!`;

  await sendSMS({
    to: clientPhone,
    message,
  });
};

export const sendAppointmentConfirmationSMS = async (
  clientPhone: string,
  clientName: string,
  serviceName: string,
  appointmentTime: string
): Promise<void> => {
  const message = `Potvrda: Vaš termin za ${serviceName} je zakazan na ${appointmentTime}. Hvala što ste odabrali nas!`;

  await sendSMS({
    to: clientPhone,
    message,
  });
};

export const sendAppointmentCancellationSMS = async (
  clientPhone: string,
  clientName: string,
  serviceName: string,
  appointmentTime: string
): Promise<void> => {
  const message = `Otkazano: Termin za ${serviceName} koji je bio zakazan na ${appointmentTime} je otkazan. Slobodno nas kontaktirajte ako trebate drugom terminu.`;

  await sendSMS({
    to: clientPhone,
    message,
  });
};
