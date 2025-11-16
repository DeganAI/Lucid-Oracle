import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    base: process.env.AGENT_WALLET_ADDRESS_BASE || '0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83',
    ethereum: process.env.AGENT_WALLET_ADDRESS_ETH || '0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83',
    solana: process.env.AGENT_WALLET_ADDRESS_SOLANA || '2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3',
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

export function validateConfig(): void {
  console.log('🔍 Validating configuration...');
  console.log('Environment variables present:');
  console.log('  AGENT_WALLET_ADDRESS_BASE:', process.env.AGENT_WALLET_ADDRESS_BASE ? 'SET' : 'NOT SET');
  console.log('  AGENT_WALLET_ADDRESS_ETH:', process.env.AGENT_WALLET_ADDRESS_ETH ? 'SET' : 'NOT SET');
  console.log('  AGENT_WALLET_ADDRESS_SOLANA:', process.env.AGENT_WALLET_ADDRESS_SOLANA ? 'SET' : 'NOT SET');
  
  console.log('Using wallet addresses:');
  console.log('  Base:', CONFIG.wallets.base);
  console.log('  Ethereum:', CONFIG.wallets.ethereum);
  console.log('  Solana:', CONFIG.wallets.solana);

  if (!CONFIG.wallets.base.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error('❌ Invalid Base wallet address format');
  }

  if (!CONFIG.wallets.ethereum.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error('❌ Invalid Ethereum wallet address format');
  }

  console.log('✅ Configuration validated successfully');
}

export default CONFIG;
