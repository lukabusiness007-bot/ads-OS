import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  generatePDF,
} from "../controllers/invoiceController";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET all invoices with filters
router.get("/", getAllInvoices);

// GET specific invoice
router.get("/:id", getInvoiceById);

// CREATE new invoice
router.post("/", createInvoice);

// UPDATE invoice
router.put("/:id", updateInvoice);

// DELETE invoice
router.delete("/:id", deleteInvoice);

// SEND invoice via email
router.post("/:id/send", sendInvoiceEmail);

// GET invoice as PDF
router.get("/:id/pdf", generatePDF);

export default router;
