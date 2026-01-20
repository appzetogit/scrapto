import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import HelpTicket from '../models/HelpTicket.js';
import logger from '../utils/logger.js';
import { PAGINATION } from '../config/constants.js';

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Public/Private
export const createTicket = asyncHandler(async (req, res) => {
    try {
        const { subject, message, type, priority, name, email, role } = req.body;

        const ticketData = {
            subject,
            message,
            type: type || 'general',
            priority: priority || 'medium',
            role: role || 'guest',
            name,
            email
        };

        // If authenticated, attach user/scrapper ID
        if (req.user) {
            if (req.user.role === 'scrapper') {
                ticketData.scrapper = req.user.id;
                ticketData.role = 'scrapper';
                ticketData.name = req.user.name;
                ticketData.email = req.user.email;
            } else {
                ticketData.user = req.user.id;
                ticketData.role = 'user';
                ticketData.name = req.user.name;
                ticketData.email = req.user.email;
            }
        }

        const ticket = await HelpTicket.create(ticketData);

        sendSuccess(res, 'Support ticket created successfully', { ticket }, 201);
    } catch (error) {
        logger.error('[Support] Error creating ticket:', error);
        sendError(res, 'Failed to create support ticket', 500);
    }
});

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin/all
// @access  Private (Admin)
export const getAllTickets = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }
        if (req.query.priority && req.query.priority !== 'all') {
            filter.priority = req.query.priority;
        }
        if (req.query.type && req.query.type !== 'all') {
            filter.type = req.query.type;
        }
        if (req.query.search) {
            filter.$or = [
                { subject: { $regex: req.query.search, $options: 'i' } },
                { message: { $regex: req.query.search, $options: 'i' } },
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const [tickets, total] = await Promise.all([
            HelpTicket.find(filter)
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(limit),
            HelpTicket.countDocuments(filter)
        ]);

        sendSuccess(res, 'Tickets retrieved successfully', {
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('[Support] Error fetching tickets:', error);
        sendError(res, 'Failed to fetch tickets', 500);
    }
});

// @desc    Get my tickets
// @route   GET /api/support/my-tickets
// @access  Private
export const getMyTickets = asyncHandler(async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'scrapper') {
            filter.scrapper = req.user.id;
        } else {
            filter.user = req.user.id;
        }

        const tickets = await HelpTicket.find(filter).sort({ createdAt: -1 });

        sendSuccess(res, 'My tickets retrieved successfully', { tickets });
    } catch (error) {
        logger.error('[Support] Error fetching my tickets:', error);
        sendError(res, 'Failed to fetch tickets', 500);
    }
});

// @desc    Update ticket status
// @route   PATCH /api/support/:id/status
// @access  Private (Admin)
export const updateTicketStatus = asyncHandler(async (req, res) => {
    try {
        const { status } = req.body;

        const ticket = await HelpTicket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!ticket) {
            return sendError(res, 'Ticket not found', 404);
        }

        sendSuccess(res, 'Ticket status updated successfully', { ticket });
    } catch (error) {
        logger.error('[Support] Error updating ticket status:', error);
        sendError(res, 'Failed to update status', 500);
    }
});
