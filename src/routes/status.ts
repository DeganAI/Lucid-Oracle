import type { Request, Response } from 'express';
import { CONFIG } from '../lib/config.js';

/**
 * GET /api/status
 * Returns agent status, capabilities, and pricing information
 */
export function statusHandler(req: Request, res: Response) {
  const status = {
    agent: {
      name: 'Lucid Oracle',
      version: '1.0.0',
      description: 'Production-ready ZK proof generation service with x402 micropayments',
      status: 'online',
      uptime: process.uptime(),
    },
    network: {
      name: CONFIG.network.name,
      chainId: CONFIG.network.chainId,
      rpcUrl: CONFIG.network.rpcUrl,
      token: CONFIG.x402.paymentToken,
      tokenAddress: CONFIG.network.usdcAddress,
    },
    payment: {
      protocol: 'x402',
      version: CONFIG.x402.version,
      scheme: CONFIG.x402.scheme,
      facilitator: CONFIG.x402.facilitator,
      walletAddress: CONFIG.wallets.base,
    },
    pricing: {
      basic: {
        name: CONFIG.pricing.basic.name,
        price: CONFIG.pricing.basic.price,
        priceUSDC: CONFIG.pricing.basic.priceUSDC,
        circuitSize: CONFIG.pricing.basic.circuitSize,
        maxGates: CONFIG.pricing.basic.maxGates,
        timeoutMs: CONFIG.pricing.basic.timeoutMs,
        description: CONFIG.pricing.basic.description,
      },
      standard: {
        name: CONFIG.pricing.standard.name,
        price: CONFIG.pricing.standard.price,
        priceUSDC: CONFIG.pricing.standard.priceUSDC,
        circuitSize: CONFIG.pricing.standard.circuitSize,
        maxGates: CONFIG.pricing.standard.maxGates,
        timeoutMs: CONFIG.pricing.standard.timeoutMs,
        description: CONFIG.pricing.standard.description,
      },
      premium: {
        name: CONFIG.pricing.premium.name,
        price: CONFIG.pricing.premium.price,
        priceUSDC: CONFIG.pricing.premium.priceUSDC,
        circuitSize: CONFIG.pricing.premium.circuitSize,
        maxGates: CONFIG.pricing.premium.maxGates,
        timeoutMs: CONFIG.pricing.premium.timeoutMs,
        description: CONFIG.pricing.premium.description,
      },
    },
    circuits: {
      supported: CONFIG.circuits.supportedCircuits,
      path: CONFIG.circuits.path,
      timeout: CONFIG.circuits.timeout,
    },
    capabilities: [
      'zk-snark proof generation',
      'proof verification',
      'hash preimage proofs',
      'range proofs',
      'custom arithmetic proofs',
      'x402 micropayments',
      'multi-chain wallet support',
    ],
    endpoints: {
      status: 'GET /api/status (free)',
      verify: 'GET /api/verify (free)',
      generateProof: 'POST /api/generate-proof (paid)',
      verifyProof: 'POST /api/verify-proof (paid)',
    },
    timestamp: Date.now(),
  };

  res.json(status);
}
