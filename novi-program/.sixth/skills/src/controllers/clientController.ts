import { Response } from 'express';
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const getAllClients = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const getClientById = async (
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

    const client = await prisma.client.findFirst({
      where: { id, userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

export const createClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { fullName, phone, email } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!fullName || !phone) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const client = await prisma.client.create({
      data: {
        userId,
        fullName,
        phone,
        email: email || null,
      },
    });

    res.status(201).json(client);
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Client with this email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
};

export const updateClient = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { fullName, phone, email } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if client belongs to user
    const client = await prisma.client.findFirst({
      where: { id, userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    });

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = async (
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

    // Check if client belongs to user
    const client = await prisma.client.findFirst({
      where: { id, userId },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    await prisma.client.delete({ where: { id } });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
