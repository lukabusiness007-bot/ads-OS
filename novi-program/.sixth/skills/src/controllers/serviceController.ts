import { Response } from 'express';
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const getAllServices = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const services = await prisma.service.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
        createdAt: true,
      },
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const getServiceById = async (
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

    const service = await prisma.service.findFirst({
      where: { id, userId },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

export const createService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, durationMinutes, price } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !durationMinutes || !price) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const service = await prisma.service.create({
      data: {
        userId,
        name,
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price),
      },
    });

    res.status(201).json(service);
  } catch (error: any) {
    console.error('Error creating service:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Service with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
};

export const updateService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, durationMinutes, price } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if service belongs to user
    const service = await prisma.service.findFirst({
      where: { id, userId },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
        ...(price && { price: parseFloat(price) }),
      },
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const deleteService = async (
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

    // Check if service belongs to user
    const service = await prisma.service.findFirst({
      where: { id, userId },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    await prisma.service.delete({ where: { id } });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
