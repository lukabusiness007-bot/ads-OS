import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const message = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@salon.com',
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    await sgMail.send(message);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendInvoiceEmail = async (
  clientEmail: string,
  clientName: string,
  invoiceNumber: string,
  total: number,
  invoiceLink: string
): Promise<void> => {
  const html = `
    <h2>Faktura ${invoiceNumber}</h2>
    <p>Poštovani ${clientName},</p>
    <p>Primili ste novu fakturu.</p>
    
    <p><strong>Broj fakture:</strong> ${invoiceNumber}</p>
    <p><strong>Iznos:</strong> $${total.toFixed(2)}</p>
    
    <p><a href="${invoiceLink}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">Pogledaj fakturu</a></p>
    
    <p>Hvala na poverenju!</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Faktura ${invoiceNumber}`,
    html,
  });
};

export const sendPaymentConfirmationEmail = async (
  clientEmail: string,
  clientName: string,
  invoiceNumber: string,
  total: number
): Promise<void> => {
  const html = `
    <h2>Potvrda plaćanja</h2>
    <p>Poštovani ${clientName},</p>
    <p>Vaše plaćanje je uspješno procesiran.</p>
    
    <p><strong>Broj fakture:</strong> ${invoiceNumber}</p>
    <p><strong>Iznos:</strong> $${total.toFixed(2)}</p>
    
    <p>Hvala na poverenju!</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Potvrda plaćanja - ${invoiceNumber}`,
    html,
  });
};

export const sendAppointmentConfirmationEmail = async (
  clientEmail: string,
  clientName: string,
  serviceName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> => {
  const html = `
    <h2>Potvrda rezervacije</h2>
    <p>Poštovani ${clientName},</p>
    <p>Vaša rezervacija je potvrđena.</p>
    
    <p><strong>Servis:</strong> ${serviceName}</p>
    <p><strong>Datum:</strong> ${appointmentDate}</p>
    <p><strong>Vrijeme:</strong> ${appointmentTime}</p>
    
    <p>Ako trebate otkazati ili promijeniti vrijeme, molimo vas da nas kontaktirate.</p>
    <p>Hvala što ste odabrali nas!</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Potvrda rezervacije - ${serviceName}`,
    html,
  });
};

export const sendAppointmentReminderEmail = async (
  clientEmail: string,
  clientName: string,
  serviceName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> => {
  const html = `
    <h2>Podsjetnik za rezervaciju</h2>
    <p>Poštovani ${clientName},</p>
    <p>Ovo je podsjetnik da imate zakazanu rezervaciju sutra.</p>
    
    <p><strong>Servis:</strong> ${serviceName}</p>
    <p><strong>Datum:</strong> ${appointmentDate}</p>
    <p><strong>Vrijeme:</strong> ${appointmentTime}</p>
    
    <p>Molimo da stignet 10 minuta prije vremena početka.</p>
    <p>Hvala!</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Podsjetnik - Vaša rezervacija za ${serviceName}`,
    html,
  });
};

export const sendAppointmentCancellationEmail = async (
  clientEmail: string,
  clientName: string,
  serviceName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> => {
  const html = `
    <h2>Otkazivanje rezervacije</h2>
    <p>Poštovani ${clientName},</p>
    <p>Vaša rezervacija je otkazana.</p>
    
    <p><strong>Servis:</strong> ${serviceName}</p>
    <p><strong>Datum:</strong> ${appointmentDate}</p>
    <p><strong>Vrijeme:</strong> ${appointmentTime}</p>
    
    <p>Ako ste otkazali greškom ili trebate da se ponovno rezervujete, slobodno nas kontaktirajte.</p>
    <p>Hvala!</p>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Otkazana rezervacija - ${serviceName}`,
    html,
  });
};
