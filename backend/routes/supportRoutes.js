import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
    createTicket,
    getAllTickets,
    getMyTickets,
    updateTicketStatus
} from '../controllers/supportController.js';

const router = express.Router();

// Public/Shared routes (some might need optional auth, but here we require auth for tracking for now)
router.post('/', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllTickets);
router.patch('/:id/status', protect, isAdmin, updateTicketStatus);

export default router;
