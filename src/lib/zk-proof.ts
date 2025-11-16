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

export async function generateProofHandler(req: X402Request, res: Response) {
  try {
    const validation = ProofRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Request validation failed',
        details: validation.error.issues,
      });
    }

    const { circuit, inputs, tier } = validation.data;

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

export function generateProofInfoHandler(req: X402Request, res: Response) {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  res.status(402).json({
    error: "Payment Required",
    message: "Generate zero-knowledge proof",
    paymentRequirement: {
      maxAmountRequired: CONFIG.pricing.standard.priceUSDC,
      resource: fullUrl,
      payTo: CONFIG.wallets.base,
      asset: CONFIG.network.usdcAddress,
      network: CONFIG.network.name,
      scheme: "eip3009"
    }
  });
}
