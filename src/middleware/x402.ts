import type { Request, Response, NextFunction } from 'express';
import { x402Payment, type PaymentAuthorization, type PaymentVerification } from '../lib/x402-payment.js';
import { CONFIG } from '../lib/config.js';

export interface X402Request extends Request {
  x402Payment?: PaymentVerification;
}

export interface PaymentOptions {
  amount: { priceUSDC: string } | number;
  description: string;
  outputSchema?: any;
}

/**
 * x402 payment middleware
 * Enforces payment requirement and verifies payment authorization
 */
export function requirePayment(options: PaymentOptions) {
  return async (req: X402Request, res: Response, next: NextFunction) => {
    try {
      // Get amount in USDC format
      const amountUSDC = typeof options.amount === 'number' 
        ? (options.amount * 1_000_000).toString()
        : options.amount.priceUSDC;

      // Check for X-PAYMENT header
      const paymentHeader = req.headers['x-payment'] as string;

      if (!paymentHeader) {
        // No payment provided - return 402 Payment Required
        const requirement = x402Payment.createPaymentRequirement(
          amountUSDC,
          `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          options.description,
          options.outputSchema
        );

        return res.status(402).json(requirement);
      }

      // Parse payment authorization
      const authorization = x402Payment.parsePaymentHeader(paymentHeader);

      if (!authorization) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: 'Payment authorization format is invalid',
        });
      }

      // Verify payment
      console.log('💰 Verifying payment authorization...');
      const verification = await x402Payment.verifyPayment(authorization, amountUSDC);

      if (!verification.verified) {
        return res.status(402).json({
          error: 'Payment Verification Failed',
          message: verification.error || 'Payment could not be verified',
          paymentRequirement: x402Payment.createPaymentRequirement(
            amountUSDC,
            `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            options.description,
            options.outputSchema
          ),
        });
      }

      // Payment verified - attach to request and continue
      req.x402Payment = verification;
      console.log(`✅ Payment verified: ${verification.amount} USDC from ${verification.payer}`);
      
      next();
    } catch (error: any) {
      console.error('Payment middleware error:', error);
      res.status(500).json({
        error: 'Payment Processing Error',
        message: error.message || 'An error occurred processing payment',
      });
    }
  };
}

/**
 * Optional payment middleware (for free-tier endpoints)
 */
export function optionalPayment(options: PaymentOptions) {
  return async (req: X402Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers['x-payment'] as string;

    if (paymentHeader) {
      const authorization = x402Payment.parsePaymentHeader(paymentHeader);
      
      if (authorization) {
        const amountUSDC = typeof options.amount === 'number'
          ? (options.amount * 1_000_000).toString()
          : options.amount.priceUSDC;

        const verification = await x402Payment.verifyPayment(authorization, amountUSDC);
        
        if (verification.verified) {
          req.x402Payment = verification;
        }
      }
    }

    next();
  };
}
