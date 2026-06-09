import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { generateInvoicePDF } from "../utils/pdfService";
import { sendInvoiceEmail as sendInvoiceEmailUtil } from "../utils/emailService";
import { prisma } from "../lib/prisma";

export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {
      userId: req.user?.userId,
    };

    if (status) {
      where.status = status as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user?.userId,
      },
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, items, notes, dueDate } = req.body;

    if (!clientId || !items || items.length === 0) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user?.userId,
      },
    });

    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Calculate total
    let invoiceTotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const service = await prisma.service.findFirst({
        where: {
          id: item.serviceId,
          userId: req.user?.userId,
        },
      });

      if (!service) {
        res.status(404).json({ error: `Service ${item.serviceId} not found` });
        return;
      }

      const amount = service.price * (item.quantity || 1);
      invoiceTotal += amount;

      invoiceItems.push({
        serviceId: item.serviceId,
        quantity: item.quantity || 1,
        unitPrice: service.price,
        amount,
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user?.userId!,
        clientId,
        invoiceNumber: `INV-${Date.now()}`,
        status: "draft",
        total: invoiceTotal,
        items: {
          create: invoiceItems,
        },
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
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

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, notes, dueDate, items } = req.body;

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user?.userId,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Can only edit draft invoices
    if (invoice.status !== "draft" && status) {
      res.status(400).json({ error: "Can only edit draft invoices" });
      return;
    }

    let updateData: any = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    // Update items if provided
    if (items && items.length > 0) {
      let invoiceTotal = 0;

      // Delete existing items
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      for (const item of items) {
        const service = await prisma.service.findFirst({
          where: {
            id: item.serviceId,
            userId: req.user?.userId,
          },
        });

        if (!service) {
          res.status(404).json({ error: `Service ${item.serviceId} not found` });
          return;
        }

        const amount = service.price * (item.quantity || 1);
        invoiceTotal += amount;

        await prisma.invoiceItem.create({
          data: {
            invoiceId: id,
            serviceId: item.serviceId,
            quantity: item.quantity || 1,
            unitPrice: service.price,
            amount,
          },
        });
      }

      updateData.total = invoiceTotal;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Verify invoice belongs to user and is draft
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user?.userId,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    if (invoice.status !== "draft") {
      res.status(400).json({ error: "Can only delete draft invoices" });
      return;
    }

    // Delete invoice items first
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    // Delete invoice
    await prisma.invoice.delete({ where: { id } });

    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

export const sendInvoiceEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: req.user?.userId,
      },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Send email
    try {
      const invoiceLink = `${process.env.FRONTEND_URL}/invoices/${id}`;
      await sendInvoiceEmailUtil(
        invoice.client.email,
        invoice.client.fullName,
        invoice.invoiceNumber,
        invoice.total,
        invoiceLink
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Continue with status update even if email fails
    }

    // Update invoice status to sent
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
      include: {
        client: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json({
      message: "Invoice sent successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send invoice" });
  }
};

export const generatePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
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

    // Get user name for invoice
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
    });

    const pdfStream = generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate || undefined,
      total: invoice.total,
      client: {
        name: invoice.client.fullName,
        email: invoice.client.email,
        phone: invoice.client.phone,
      },
      saloonName: user?.email || "Salon",
      items: invoice.items.map((item) => ({
        service: {
          name: item.service.name,
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );

    pdfStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
