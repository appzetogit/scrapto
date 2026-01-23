import Coupon from '../models/CouponModel.js';
import CouponUsage from '../models/CouponUsageModel.js';

// @desc    Create a new coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            title,
            amount,
            applicableRole,
            usageType,
            limit,
            validFrom,
            validTo,
            isActive
        } = req.body;

        // Validate if code exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            title,
            amount,
            applicableRole,
            usageType,
            limit,
            validFrom,
            validTo,
            isActive
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
    }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
    }
};

// @desc    Toggle coupon status
// @route   PATCH /api/admin/coupons/:id/status
// @access  Private/Admin
export const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
            data: coupon
        });
    } catch (error) {
        console.error('Toggle Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update coupon status', error: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
    try {
        const usageCount = await CouponUsage.countDocuments({ couponId: req.params.id });
        if (usageCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete coupon that has been used. Deactivate it instead.' });
        }

        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
    }
}
