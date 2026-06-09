import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Stripe from "stripe";
import { sendPaymentConfirmationEmail } from "../utils/emailService";
import { prisma } from "../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.body;

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: req.user?.userId,
      },
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Get user email for Stripe
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create Stripe line items from invoice items
    const lineItems = invoice.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.service.name,
          description: `Invoice ${invoice.invoiceNumber}`,
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/invoices/${invoiceId}?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/invoices/${invoiceId}?status=cancelled`,
      customer_email: invoice.client.email,
      metadata: {
        invoiceId,
        userId: req.user?.userId,
      },
    });

    // Store session in database for webhook verification
    await prisma.payment.create({
      data: {
        invoiceId: invoiceId,
        stripeSessionId: session.id,
        amount: invoice.total,
        status: "pending",
        userId: req.user?.userId || "",
      },
    });

    res.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed");
    res.status(400).send("Webhook Error");
    return;
  }

  // Handle checkout completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      try {
        // Get invoice data before updating
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: {
            client: true,
          },
        });

        // Update payment status
        await prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "completed" },
        });

        // Update invoice status to paid
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        // Send payment confirmation email
        if (invoice) {
          try {
            await sendPaymentConfirmationEmail(
              invoice.client.email,
              invoice.client.fullName,
              invoice.invoiceNumber,
              invoice.total
            );
          } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
          }
        }

        console.log(`Invoice ${invoiceId} marked as paid`);
      } catch (error) {
        console.error("Failed to update invoice status:", error);
      }
    }
  }

  res.json({ received: true });
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          userId: req.user?.userId,
        },
      },
      include: {
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};
