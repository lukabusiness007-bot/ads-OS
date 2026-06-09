import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createCheckoutSession,
  handleStripeWebhook,
  getPayments,
} from "../controllers/paymentController";

const router = Router();

// Webhook route (doesn't need auth - must come first to use raw body)
router.post("/webhook/stripe", (req, res, next) => {
  handleStripeWebhook(req, res);
});

// All other routes require authentication
router.use(authMiddleware);

// CREATE checkout session
router.post("/create-checkout-session", createCheckoutSession);

// GET payments
router.get("/", getPayments);

export default router;
