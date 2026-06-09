import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentCancellationEmail,
} from '../utils/emailService';

export const getAllAppointments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { startDate, endDate, status } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        client: true,
        service: true,
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { clientId, serviceId, start_time, end_time, notes } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!clientId || !serviceId || !start_time || !end_time) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Verify service belongs to user
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        userId,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        notes: notes || null,
        status: 'pending',
      },
      include: {
        client: true,
        service: true,
      },
    });

    // Send confirmation email to client if email exists
    if (client.email && service) {
      try {
        const appointmentDate = new Date(start_time).toLocaleDateString('sr-RS', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const appointmentTime = new Date(start_time).toLocaleTimeString('sr-RS', {
          hour: '2-digit',
          minute: '2-digit',
        });

        await sendAppointmentConfirmationEmail(
          client.email,
          client.fullName,
          service.name,
          appointmentDate,
          appointmentTime
        );
      } catch (emailError) {
        console.error('Failed to send appointment confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { startTime, endTime, status, notes } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if appointment belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        client: true,
        service: true,
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Check if status is being changed to 'cancelled'
    const isCancelling = status === 'cancelled' && appointment.status !== 'cancelled';

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
        ...(notes && { notes }),
      },
      include: {
        client: true,
        service: true,
      },
    });

    // Send cancellation email if status changed to cancelled
    if (isCancelling && appointment.client.email && appointment.service) {
      try {
        const appointmentDate = appointment.startTime.toLocaleDateString('sr-RS', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const appointmentTime = appointment.startTime.toLocaleTimeString('sr-RS', {
          hour: '2-digit',
          minute: '2-digit',
        });

        await sendAppointmentCancellationEmail(
          appointment.client.email,
          appointment.client.fullName,
          appointment.service.name,
          appointmentDate,
          appointmentTime
        );
      } catch (emailError) {
        console.error('Failed to send appointment cancellation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const deleteAppointment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if appointment belongs to user and fetch with client/service data
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        client: true,
        service: true,
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Send cancellation email before deleting
    if (appointment.client.email && appointment.service) {
      try {
        const appointmentDate = appointment.startTime.toLocaleDateString('sr-RS', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const appointmentTime = appointment.startTime.toLocaleTimeString('sr-RS', {
          hour: '2-digit',
          minute: '2-digit',
        });

        await sendAppointmentCancellationEmail(
          appointment.client.email,
          appointment.client.fullName,
          appointment.service.name,
          appointmentDate,
          appointmentTime
        );
      } catch (emailError) {
        console.error('Failed to send appointment cancellation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    await prisma.appointment.delete({ where: { id } });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
