import type { Request, Response } from 'express';
import { CONFIG } from '../lib/config.js';

/**
 * GET /api/verify
 * Returns agent identity and wallet verification information
 */
export function verifyHandler(req: Request, res: Response) {
  const verification = {
    agent: {
      name: 'Lucid Oracle',
      version: '1.0.0',
      description: 'Zero-Knowledge Proof Generation Service',
      type: 'zk-proof-generator',
      framework: 'Daydreams Lucid Agents',
    },
    wallets: {
      base: {
        address: CONFIG.wallets.base,
        network: 'Base L2',
        chainId: CONFIG.network.chainId,
        primary: true,
        verified: true,
      },
      ethereum: {
        address: CONFIG.wallets.ethereum,
        network: 'Ethereum Mainnet',
        chainId: 1,
        primary: false,
        verified: true,
      },
      solana: {
        address: CONFIG.wallets.solana,
        network: 'Solana Mainnet',
        primary: false,
        verified: true,
      },
    },
    trust: {
      verifiedAt: Date.now(),
      x402Enabled: true,
      paymentProtocol: 'x402 v1',
      facilitator: CONFIG.x402.facilitator,
      securityFeatures: [
        'EIP-3009 payment authorization',
        'Nonce replay protection',
        'Timestamp validation',
        'Signature verification',
        'Circuit isolation',
        'Timeout enforcement',
      ],
    },
    security: {
      zkLibrary: 'snarkjs',
      curves: ['bn128'],
      protocols: ['groth16'],
      circuitIsolation: true,
      inputValidation: true,
      timeoutEnforcement: true,
    },
    links: {
      documentation: 'https://github.com/yourusername/lucid-oracle',
      x402Protocol: 'https://www.x402.org',
      x402Scan: 'https://x402scan.com',
      daydreams: 'https://www.daydreams.systems',
    },
    timestamp: Date.now(),
  };

  res.json(verification);
}
