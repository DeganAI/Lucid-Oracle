import type { Response } from 'express';
import type { X402Request } from '../middleware/x402.js';
import { zkProofGenerator, type VerificationRequest } from '../lib/zk-proof.js';
import { CONFIG } from '../lib/config.js';
import { z } from 'zod';

const VerificationRequestSchema = z.object({
  proof: z.object({
    pi_a: z.array(z.string()),
    pi_b: z.array(z.array(z.string())),
    pi_c: z.array(z.string()),
    protocol: z.string(),
    curve: z.string(),
  }),
  publicSignals: z.array(z.string()),
  circuit: z.enum(['hashPreimage', 'rangeProof', 'customArithmetic']),
});

export async function verifyProofHandler(req: X402Request, res: Response) {
  try {
    const validation = VerificationRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Request validation failed',
        details: validation.error.issues,
      });
    }

    const { proof, publicSignals, circuit } = validation.data;

    if (!req.x402Payment?.verified) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Payment verification state invalid',
      });
    }

    console.log(`🔍 Verifying ZK proof for ${req.x402Payment.payer}`);
    console.log(`   Circuit: ${circuit}`);
    console.log(`   Payment: ${req.x402Payment.amount} USDC`);

    const verificationRequest: VerificationRequest = {
      proof,
      publicSignals,
      circuit,
    };

    const result = await zkProofGenerator.verify(verificationRequest);

    if (!result.success) {
      return res.status(500).json({
        error: 'Verification Failed',
        message: result.error || 'Failed to verify proof',
        executionTime: result.executionTime,
      });
    }

    const response = {
      success: true,
      verified: result.verified,
      metadata: {
        circuit: circuit,
        executionTime: result.executionTime,
        verifiedAt: Date.now(),
      },
      payment: {
        amount: req.x402Payment.amount,
        amountUSDC: CONFIG.pricing.basic.priceUSDC,
        payer: req.x402Payment.payer,
        transactionHash: req.x402Payment.transactionHash,
        network: CONFIG.network.name,
        token: CONFIG.x402.paymentToken,
      },
      result: {
        valid: result.verified,
        message: result.verified 
          ? 'Proof is valid and verified' 
          : 'Proof verification failed - invalid proof',
      },
    };

    console.log(`✅ Proof verification completed: ${result.verified ? 'VALID' : 'INVALID'} (${result.executionTime}ms)`);
    
    res.json(response);
  } catch (error: any) {
    console.error('Verify proof endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

export function verifyProofInfoHandler(req: X402Request, res: Response) {
  const protocol = req.protocol === 'http' && req.get('host')?.includes('railway.app') ? 'https' : req.protocol;
  const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
  
  res.status(402).json({
    error: "Payment Required",
    message: "Verify zero-knowledge proof",
    paymentRequirement: {
      maxAmountRequired: CONFIG.pricing.basic.priceUSDC,
      resource: fullUrl,
      payTo: CONFIG.wallets.base,
      asset: CONFIG.network.usdcAddress,
      network: CONFIG.network.name,
      scheme: "exact"
    }
  });
}
