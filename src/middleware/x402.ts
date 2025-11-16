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

export function requirePayment(options: PaymentOptions) {
  return async (req: X402Request, res: Response, next: NextFunction) => {
    try {
      const amountUSDC = typeof options.amount === 'number' 
        ? (options.amount * 1_000_000).toString()
        : options.amount.priceUSDC;

      const paymentHeader = req.headers['x-payment'] as string;

      if (!paymentHeader) {
        const protocol = req.protocol === 'http' && req.get('host')?.includes('railway.app') ? 'https' : req.protocol;
        const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
        
        return res.status(402).json({
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: CONFIG.network.name,
              maxAmountRequired: amountUSDC,
              resource: fullUrl,
              description: options.description,
              mimeType: "application/json",
              payTo: CONFIG.wallets.base,
              maxTimeoutSeconds: 60,
              asset: CONFIG.network.usdcAddress,
              ...(options.outputSchema && { outputSchema: options.outputSchema })
            }
          ]
        });
      }

      const authorization = x402Payment.parsePaymentHeader(paymentHeader);

      if (!authorization) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: 'Payment authorization format is invalid',
        });
      }

      console.log('💰 Verifying payment authorization...');
      const verification = await x402Payment.verifyPayment(authorization, amountUSDC);

      if (!verification.verified) {
        const protocol = req.protocol === 'http' && req.get('host')?.includes('railway.app') ? 'https' : req.protocol;
        const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
        
        return res.status(402).json({
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: CONFIG.network.name,
              maxAmountRequired: amountUSDC,
              resource: fullUrl,
              description: options.description,
              mimeType: "application/json",
              payTo: CONFIG.wallets.base,
              maxTimeoutSeconds: 60,
              asset: CONFIG.network.usdcAddress,
              ...(options.outputSchema && { outputSchema: options.outputSchema })
            }
          ]
        });
      }

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
