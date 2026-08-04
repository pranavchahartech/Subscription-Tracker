const { z } = require('zod');

const subscriptionSchema = z.object({
  name: z.string().min(1, 'Subscription name is required').trim(),
  cost: z.number().gt(0, 'Cost must be greater than 0'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  billing_cycle: z.enum(['monthly', 'annual'], { required_error: 'Billing cycle must be monthly or annual' }),
  category: z.string().trim().default('Other'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format'),
  next_renewal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next renewal date must be YYYY-MM-DD format'),
  last_used_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Last used date must be YYYY-MM-DD format').nullable().optional(),
  is_active: z.boolean().default(true),
});

module.exports = { subscriptionSchema };
