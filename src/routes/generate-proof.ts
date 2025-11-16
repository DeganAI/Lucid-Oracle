import type { Response } from 'express';
import type { X402Request } from '../middleware/x402.js';
import { zkProofGenerator, type ProofRequest } from '../lib/zk-proof.js';
import { CONFIG } from '../lib/config.js';
import { z } from 'zod';

const ProofRequestSchema = z.object({
  circuit: z.enum(['hashPreimage', 'rangeProof', 'customArithmetic']),
  inputs: z.record(z.any()),
  tier: z.enum(['basic', 'standard', 'premium']),
});

/**
 * POST /api/generate-proof
 * Generate ZK proof with payment verification
 */
export async function generateProofHandler(req: X402Request, res: Response) {
  try {
    // Validate request body
    const validation = ProofRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Request validation failed',
        details: validation.error.issues,
      });
    }

    const { circuit, inputs, tier } = validation.data;

    // Verify payment was processed
    if (!req.x402Payment?.verified) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Payment verification state invalid',
      });
    }

    console.log(`🔒 Generating ZK proof for ${req.x402Payment.payer}`);
    console.log(`   Circuit: ${circuit}`);
    console.log(`   Tier: ${tier}`);
    console.log(`   Payment: ${req.x402Payment.amount} USDC`);

    // Generate the proof
    const proofRequest: ProofRequest = {
      circuit,
      inputs,
      tier,
    };

    const result = await zkProofGenerator.generate(proofRequest);

    if (!result.success) {
      return res.status(500).json({
        error: 'Proof Generation Failed',
        message: result.error || 'Failed to generate proof',
        proofId: result.proofId,
        executionTime: result.executionTime,
      });
    }

    // Build response
    const response = {
      success: true,
      proof: result.proof,
      publicSignals: result.publicSignals,
      metadata: {
        proofId: result.proofId,
        circuit: circuit,
        tier: tier,
        executionTime: result.executionTime,
        generatedAt: Date.now(),
      },
      payment: {
        amount: req.x402Payment.amount,
        amountUSDC: CONFIG.pricing[tier].priceUSDC,
        payer: req.x402Payment.payer,
        transactionHash: req.x402Payment.transactionHash,
        network: CONFIG.network.name,
        token: CONFIG.x402.paymentToken,
      },
      verification: {
        canVerify: true,
        verificationEndpoint: '/api/verify-proof',
        verificationCost: CONFIG.pricing.basic.price,
      },
    };

    console.log(`✅ Proof ${result.proofId} generated successfully in ${result.executionTime}ms`);
    
    res.json(response);
  } catch (error: any) {
    console.error('Generate proof endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

/**
 * GET /api/generate-proof
 * Returns payment requirements and schema for proof generation
 */
export function generateProofInfoHandler(req: X402Request, res: Response) {
  const outputSchema = {
    input: {
      type: 'http',
      method: 'POST',
      contentType: 'application/json',
      bodyFields: {
        circuit: {
          type: 'string',
          required: true,
          description: 'Circuit type to use for proof generation',
          enum: ['hashPreimage', 'rangeProof', 'customArithmetic'],
          examples: ['hashPreimage'],
        },
        inputs: {
          type: 'object',
          required: true,
          description: 'Circuit-specific inputs',
          examples: [
            { preimage: 'secret_value' },
            { value: 500, min: 0, max: 1000 },
            { a: 10, b: 20, operation: 'add' },
          ],
        },
        tier: {
          type: 'string',
          required: true,
          description: 'Pricing tier (determines circuit complexity and timeout)',
          enum: ['basic', 'standard', 'premium'],
          examples: ['standard'],
        },
      },
    },
    output: {
      type: 'object',
      description: 'Generated ZK proof and metadata',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether proof generation succeeded',
        },
        proof: {
          type: 'object',
          description: 'The zk-SNARK proof (Groth16 format)',
          properties: {
            pi_a: { type: 'array', description: 'Proof element A' },
            pi_b: { type: 'array', description: 'Proof element B' },
            pi_c: { type: 'array', description: 'Proof element C' },
            protocol: { type: 'string', description: 'Proof protocol (groth16)' },
            curve: { type: 'string', description: 'Elliptic curve (bn128)' },
          },
        },
        publicSignals: {
          type: 'array',
          description: 'Public signals/outputs from the circuit',
        },
        metadata: {
          type: 'object',
          description: 'Proof metadata',
          properties: {
            proofId: { type: 'string', description: 'Unique proof identifier' },
            circuit: { type: 'string', description: 'Circuit used' },
            tier: { type: 'string', description: 'Pricing tier used' },
            executionTime: { type: 'number', description: 'Generation time in ms' },
          },
        },
        payment: {
          type: 'object',
          description: 'Payment information',
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
        maxAmountRequired: CONFIG.pricing.standard.priceUSDC,
        resource: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        description: 'Generate zero-knowledge proof',
        mimeType: 'application/json',
        payTo: CONFIG.wallets.base,
        maxTimeoutSeconds: 60,
        asset: CONFIG.network.usdcAddress,
        outputSchema,
      },
    ],
  });
}
