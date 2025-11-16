import { createPublicClient, http, type Address, type Hash } from 'viem';
import { base } from 'viem/chains';
import { CONFIG } from './config.js';

export interface PaymentAuthorization {
  scheme: 'eip3009';
  from: Address;
  to: Address;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  signature: Hash;
}

export interface PaymentVerification {
  verified: boolean;
  amount: number;
  payer: Address;
  transactionHash?: Hash;
  error?: string;
}

export interface PaymentRequirement {
  x402Version: number;
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: Address;
    maxTimeoutSeconds: number;
    asset: Address;
    outputSchema?: any;
  }>;
}

export class X402Payment {
  private client;
  private facilitatorUrl: string;

  constructor() {
    this.client = createPublicClient({
      chain: base,
      transport: http(CONFIG.network.rpcUrl),
    });
    this.facilitatorUrl = CONFIG.x402.facilitator;
  }

  createPaymentRequirement(
    amount: string,
    resource: string,
    description: string,
    outputSchema?: any
  ): PaymentRequirement {
    return {
      x402Version: CONFIG.x402.version,
      accepts: [
        {
          scheme: 'eip3009',
          network: CONFIG.network.name,
          maxAmountRequired: amount,
          resource,
          description,
          mimeType: 'application/json',
          payTo: CONFIG.wallets.base as Address,
          maxTimeoutSeconds: 60,
          asset: CONFIG.network.usdcAddress as Address,
          ...(outputSchema && { outputSchema }),
        },
      ],
    };
  }

  async verifyPayment(
    authorization: PaymentAuthorization,
    requiredAmount: string
  ): Promise<PaymentVerification> {
    try {
      if (!this.validateAuthorization(authorization, requiredAmount)) {
        return {
          verified: false,
          amount: 0,
          payer: authorization.from,
          error: 'Invalid authorization parameters',
        };
      }

      const result = await this.processFacilitatorPayment(authorization);

      if (!result.success) {
        return {
          verified: false,
          amount: 0,
          payer: authorization.from,
          error: result.error || 'Payment processing failed',
        };
      }

      return {
        verified: true,
        amount: parseFloat(authorization.value) / 1_000_000,
        payer: authorization.from,
        transactionHash: result.transactionHash,
      };
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        verified: false,
        amount: 0,
        payer: authorization.from,
        error: error.message || 'Verification failed',
      };
    }
  }

  private validateAuthorization(auth: PaymentAuthorization, requiredAmount: string): boolean {
    if (auth.scheme !== 'eip3009') {
      console.error('Invalid payment scheme:', auth.scheme);
      return false;
    }

    if (auth.to.toLowerCase() !== CONFIG.wallets.base.toLowerCase()) {
      console.error('Invalid payment recipient:', auth.to);
      return false;
    }

    const authAmount = BigInt(auth.value);
    const required = BigInt(requiredAmount);
    if (authAmount < required) {
      console.error('Insufficient payment amount:', authAmount, 'required:', required);
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const validAfter = parseInt(auth.validAfter);
    const validBefore = parseInt(auth.validBefore);

    if (now < validAfter || now > validBefore) {
      console.error('Payment timestamp out of valid range');
      return false;
    }

    if (!auth.nonce || auth.nonce.length < 32) {
      console.error('Invalid nonce');
      return false;
    }

    if (!auth.signature || !auth.signature.match(/^0x[a-fA-F0-9]{130}$/)) {
      console.error('Invalid signature format');
      return false;
    }

    return true;
  }

  private async processFacilitatorPayment(
    auth: PaymentAuthorization
  ): Promise<{ success: boolean; transactionHash?: Hash; error?: string }> {
    try {
      console.log('🔄 Processing payment through facilitator:', this.facilitatorUrl);

      const response = await fetch(`${this.facilitatorUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: CONFIG.network.name,
          authorization: auth,
          recipient: CONFIG.wallets.base,
          token: CONFIG.network.usdcAddress,
        }),
      });

      if (!response.ok) {
        if (CONFIG.server.nodeEnv === 'development') {
          console.warn('⚠️ Development mode: simulating facilitator response');
          return {
            success: true,
            transactionHash: `0x${Array(64).fill(0).map(() => 
              Math.floor(Math.random() * 16).toString(16)
            ).join('')}` as Hash,
          };
        }

        throw new Error(`Facilitator error: ${response.statusText}`);
      }

      const result = await response.json() as { transactionHash: string };
      return {
        success: true,
        transactionHash: result.transactionHash as Hash,
      };
    } catch (error: any) {
      if (CONFIG.server.nodeEnv === 'development') {
        console.warn('⚠️ Facilitator unavailable, using development mode');
        return {
          success: true,
          transactionHash: `0x${Array(64).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')}` as Hash,
        };
      }

      console.error('Facilitator processing error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  parsePaymentHeader(header: string): PaymentAuthorization | null {
    try {
      const payment = JSON.parse(header);
      
      if (!payment.scheme || !payment.from || !payment.to || !payment.value) {
        return null;
      }

      return payment as PaymentAuthorization;
    } catch (error) {
      console.error('Failed to parse payment header:', error);
      return null;
    }
  }
}

export const x402Payment = new X402Payment();
