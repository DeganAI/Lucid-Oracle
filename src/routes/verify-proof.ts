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

/**
 * POST /api/verify-proof
 * Verify a ZK proof with payment
 */
export async function verifyProofHandler(req: X402Request, res: Response) {
  try {
    // Validate request body
    const validation = VerificationRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Request validation failed',
        details: validation.error.issues,
      });
    }

    const { proof, publicSignals, circuit } = validation.data;

    // Verify payment was processed
    if (!req.x402Payment?.verified) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Payment verification state invalid',
      });
    }

    console.log(`🔍 Verifying ZK proof for ${req.x402Payment.payer}`);
    console.log(`   Circuit: ${circuit}`);
    console.log(`   Payment: ${req.x402Payment.amount} USDC`);

    // Verify the proof
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

    // Build response
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

/**
 * GET /api/verify-proof
 * Returns payment requirements and schema for proof verification
 */
export function verifyProofInfoHandler(req: X402Request, res: Response) {
  const outputSchema = {
    input: {
      type: 'http',
      method: 'POST',
      contentType: 'application/json',
      bodyFields: {
        proof: {
          type: 'object',
          required: true,
          description: 'The zk-SNARK proof to verify (Groth16 format)',
          properties: {
            pi_a: { type: 'array', description: 'Proof element A' },
            pi_b: { type: 'array', description: 'Proof element B' },
            pi_c: { type: 'array', description: 'Proof element C' },
            protocol: { type: 'string', description: 'groth16' },
            curve: { type: 'string', description: 'bn128' },
          },
        },
        publicSignals: {
          type: 'array',
          required: true,
          description: 'Public signals from proof generation',
        },
        circuit: {
          type: 'string',
          required: true,
          description: 'Circuit type used for proof generation',
          enum: ['hashPreimage', 'rangeProof', 'customArithmetic'],
        },
      },
    },
    output: {
      type: 'object',
      description: 'Verification result',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether verification completed successfully',
        },
        verified: {
          type: 'boolean',
          description: 'Whether the proof is valid',
        },
        metadata: {
          type: 'object',
          description: 'Verification metadata',
          properties: {
            circuit: { type: 'string', description: 'Circuit used' },
            executionTime: { type: 'number', description: 'Verification time in ms' },
            verifiedAt: { type: 'number', description: 'Unix timestamp' },
          },
        },
        payment: {
          type: 'object',
          description: 'Payment information',
        },
        result: {
          type: 'object',
          description: 'Human-readable result',
          properties: {
            valid: { type: 'boolean', description: 'Is the proof valid' },
            message: { type: 'string', description: 'Result message' },
          },
        },
      },
    },
  };

  res.status(402).json({
    x402Version: CONFIG.x402.version,
    accepts: [
      {
        scheme: 'eip3009',
        network: CONFIG.network.name,
        maxAmountRequired: CONFIG.pricing.basic.priceUSDC,
        resource: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        description: 'Verify zero-knowledge proof',
        mimeType: 'application/json',
        payTo: CONFIG.wallets.base,
        maxTimeoutSeconds: 30,
        asset: CONFIG.network.usdcAddress,
        outputSchema,
      },
    ],
  });
}
