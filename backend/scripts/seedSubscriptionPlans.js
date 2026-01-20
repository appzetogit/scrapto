import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import { connectDB } from '../config/database.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const seedPlans = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected');

    // Default subscription plans
    const plans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for getting started with scrap pickup services',
        price: 99,
        currency: 'INR',
        duration: 1,
        durationType: 'monthly',
        features: [
          'Receive pickup requests',
          'Basic support',
          'Standard priority',
          'Up to 50 pickups/month'
        ],
        maxPickups: 50,
        priority: 1,
        isActive: true,
        isPopular: false,
        sortOrder: 1
      },
      {
        name: 'Pro Plan',
        description: 'Best for professional scrappers with high volume',
        price: 199,
        currency: 'INR',
        duration: 1,
        durationType: 'monthly',
        features: [
          'Priority pickup requests',
          '24/7 Premium support',
          'Higher priority in queue',
          'Unlimited pickups',
          'Advanced analytics',
          'Early access to features'
        ],
        maxPickups: null, // Unlimited
        priority: 2,
        isActive: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        name: 'Quarterly Plan',
        description: 'Save money with 3-month subscription',
        price: 249, // 3 months for price of ~2.5 months
        currency: 'INR',
        duration: 3,
        durationType: 'monthly',
        features: [
          'Priority pickup requests',
          '24/7 Premium support',
          'Higher priority in queue',
          'Unlimited pickups',
          'Advanced analytics',
          'Early access to features',
          'Save 17% compared to monthly'
        ],
        maxPickups: null,
        priority: 2,
        isActive: true,
        isPopular: false,
        sortOrder: 3
      },
      {
        name: 'Yearly Plan',
        description: 'Best value - Save big with annual subscription',
        price: 1999, // 12 months for price of ~10 months
        currency: 'INR',
        duration: 12,
        durationType: 'monthly',
        features: [
          'Priority pickup requests',
          '24/7 Premium support',
          'Highest priority in queue',
          'Unlimited pickups',
          'Advanced analytics',
          'Early access to features',
          'Save 16% compared to monthly',
          'Free setup assistance'
        ],
        maxPickups: null,
        priority: 3,
        isActive: true,
        isPopular: false,
        sortOrder: 4
      }
    ];

    // Clear existing plans (optional - comment out if you want to keep existing)
    // await SubscriptionPlan.deleteMany({});
    // logger.info('🗑️  Cleared existing plans');

    // Insert or update plans
    for (const planData of plans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        // Update existing plan
        Object.assign(existingPlan, planData);
        await existingPlan.save();
        logger.info(`✅ Updated plan: ${planData.name}`);
      } else {
        // Create new plan
        await SubscriptionPlan.create(planData);
        logger.info(`✅ Created plan: ${planData.name}`);
      }
    }

    logger.info('✅ Subscription plans seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
};

// Run seed
seedPlans();





