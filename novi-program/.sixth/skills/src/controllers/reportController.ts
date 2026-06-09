import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

// Get revenue report
export const getRevenueReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates or use default (last 30 days)
    let start = new Date();
    let end = new Date();
    start.setDate(start.getDate() - 30);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Include full last day
    }

    // Get all paid payments for this user in the date range
    const payments = await prisma.payment.findMany({
      where: {
        userId: req.user?.userId,
        status: "completed",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;

    // Group by date
    const revenueByDate: { [key: string]: number } = {};
    payments.forEach((payment) => {
      const dateKey = payment.createdAt.toISOString().split("T")[0];
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + payment.amount;
    });

    // Convert to array for charting
    const revenueData = Object.entries(revenueByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    res.json({
      totalRevenue,
      totalPayments,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      revenueData,
      payments,
    });
  } catch (error) {
    console.error("Revenue report error:", error);
    res.status(500).json({ error: "Failed to fetch revenue report" });
  }
};

// Get appointments summary
export const getAppointmentsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates or use default (last 30 days)
    let start = new Date();
    let end = new Date();
    start.setDate(start.getDate() - 30);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    }

    // Count appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ["status"],
      where: {
        userId: req.user?.userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get total appointments
    const totalAppointments = appointmentsByStatus.reduce(
      (sum, a) => sum + a._count.id,
      0
    );

    // Get appointments by service
    const appointmentsByService = await prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        userId: req.user?.userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get service names
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: req.user?.userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: true,
      },
    });

    const serviceMap: { [key: string]: string } = {};
    appointments.forEach((apt) => {
      serviceMap[apt.serviceId] = apt.service.name;
    });

    const appointmentServiceData = appointmentsByService.map((item) => ({
      serviceName: serviceMap[item.serviceId],
      count: item._count.id,
    }));

    // Get upcoming appointments
    const now = new Date();
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        userId: req.user?.userId,
        startTime: {
          gte: now,
        },
        status: {
          in: ["pending", "confirmed"],
        },
      },
      include: {
        client: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    });

    res.json({
      totalAppointments,
      appointmentsByStatus: appointmentsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      appointmentsByService: appointmentServiceData,
      upcomingAppointments,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Appointments report error:", error);
    res.status(500).json({ error: "Failed to fetch appointments report" });
  }
};

// Get services summary
export const getServicesSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates or use default (last 30 days)
    let start = new Date();
    let end = new Date();
    start.setDate(start.getDate() - 30);

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    }

    // Get all services with their appointment counts
    const services = await prisma.service.findMany({
      where: {
        userId: req.user?.userId,
      },
      include: {
        appointments: {
          where: {
            startTime: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    // Calculate statistics per service
    const servicesData = services.map((service) => {
      const revenue = service.appointments.length * service.price;
      return {
        name: service.name,
        price: service.price,
        duration: service.durationMinutes,
        bookingCount: service.appointments.length,
        totalRevenue: revenue,
      };
    });

    // Sort by booking count
    servicesData.sort((a, b) => b.bookingCount - a.bookingCount);

    const totalServices = services.length;
    const totalRevenue = servicesData.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalBookings = servicesData.reduce((sum, s) => sum + s.bookingCount, 0);

    res.json({
      totalServices,
      totalRevenue,
      totalBookings,
      services: servicesData,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Services report error:", error);
    res.status(500).json({ error: "Failed to fetch services report" });
  }
};

// Get dashboard statistics (high level overview)
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        userId: req.user?.userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        client: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // This week's new clients
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newClientsThisWeek = await prisma.client.count({
      where: {
        userId: req.user?.userId,
        createdAt: {
          gte: weekAgo,
        },
      },
    });

    // Pending invoices
    const pendingInvoices = await prisma.invoice.count({
      where: {
        userId: req.user?.userId,
        status: "sent",
      },
    });

    // Unpaid amount
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        userId: req.user?.userId,
        status: {
          in: ["sent", "overdue"],
        },
      },
    });

    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Total revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await prisma.payment.findMany({
      where: {
        userId: req.user?.userId,
        status: "completed",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const monthlyRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      todayAppointments,
      todayAppointmentCount: todayAppointments.length,
      newClientsThisWeek,
      pendingInvoices,
      unpaidAmount,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};
