import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

export interface PricingTier {
  name: string;
  price: number;
  priceUSDC: string;
  circuitSize: string;
  maxGates: number;
  timeoutMs: number;
  description: string;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  usdcAddress: string;
}

export interface WalletAddresses {
  base: string;
  ethereum: string;
  solana: string;
}

export interface CircuitConfig {
  path: string;
  timeout: number;
  supportedCircuits: string[];
}

export interface X402Config {
  facilitator: string;
  version: number;
  paymentToken: string;
  scheme: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
}

interface Config {
  server: ServerConfig;
  wallets: WalletAddresses;
  network: NetworkConfig;
  x402: X402Config;
  circuits: CircuitConfig;
  pricing: {
    basic: PricingTier;
    standard: PricingTier;
    premium: PricingTier;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

// Helper to convert USDC amount (6 decimals) to USD
const usdcToUSD = (usdc: string): number => {
  return parseInt(usdc) / 1_000_000;
};

export const CONFIG: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  wallets: {
    base: process.env.AGENT_WALLET_ADDRESS_BASE || '',
    ethereum: process.env.AGENT_WALLET_ADDRESS_ETH || '',
    solana: process.env.AGENT_WALLET_ADDRESS_SOLANA || '',
  },

  network: {
    name: process.env.NETWORK_NAME || 'base',
    chainId: parseInt(process.env.CHAIN_ID || '8453', 10),
    rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
    usdcAddress: process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },

  x402: {
    facilitator: process.env.X402_FACILITATOR || 'https://facilitator.daydreams.systems',
    version: parseInt(process.env.X402_VERSION || '1', 10),
    paymentToken: 'USDC',
    scheme: 'eip3009',
  },

  circuits: {
    path: process.env.CIRCUIT_PATH || './circuits',
    timeout: parseInt(process.env.CIRCUIT_TIMEOUT_MS || '60000', 10),
    supportedCircuits: ['hashPreimage', 'rangeProof', 'customArithmetic'],
  },

  pricing: {
    basic: {
      name: 'basic',
      price: usdcToUSD(process.env.PRICE_BASIC || '20000'),
      priceUSDC: process.env.PRICE_BASIC || '20000',
      circuitSize: 'small',
      maxGates: 10_000,
      timeoutMs: 10_000,
      description: 'Simple proofs (hash preimage, basic operations)',
    },
    standard: {
      name: 'standard',
      price: usdcToUSD(process.env.PRICE_STANDARD || '50000'),
      priceUSDC: process.env.PRICE_STANDARD || '50000',
      circuitSize: 'medium',
      maxGates: 50_000,
      timeoutMs: 30_000,
      description: 'Standard proofs (range proofs, arithmetic constraints)',
    },
    premium: {
      name: 'premium',
      price: usdcToUSD(process.env.PRICE_PREMIUM || '100000'),
      priceUSDC: process.env.PRICE_PREMIUM || '100000',
      circuitSize: 'large',
      maxGates: 100_000,
      timeoutMs: 60_000,
      description: 'Complex custom proofs (advanced circuits)',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validation
export function validateConfig(): void {
  const required = [
    'AGENT_WALLET_ADDRESS_BASE',
    'AGENT_WALLET_ADDRESS_ETH',
    'AGENT_WALLET_ADDRESS_SOLANA',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate addresses format
  if (!CONFIG.wallets.base.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid Base wallet address format');
  }

  if (!CONFIG.wallets.ethereum.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid Ethereum wallet address format');
  }

  console.log('✅ Configuration validated successfully');
}

export default CONFIG;
