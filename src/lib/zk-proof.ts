import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import { nanoid } from 'nanoid';
import { CONFIG } from './config.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface ProofRequest {
  circuit: 'hashPreimage' | 'rangeProof' | 'customArithmetic';
  inputs: Record<string, any>;
  tier: 'basic' | 'standard' | 'premium';
}

export interface ProofResult {
  success: boolean;
  proof?: any;
  publicSignals?: any[];
  executionTime: number;
  proofId: string;
  tier: string;
  error?: string;
}

export interface VerificationRequest {
  proof: any;
  publicSignals: any[];
  circuit: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  executionTime: number;
  error?: string;
}

export class ZKProofGenerator {
  private poseidon: any;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.poseidon = await buildPoseidon();
      this.initialized = true;
      console.log('✅ ZK proof generator initialized');
    } catch (error) {
      console.error('Failed to initialize ZK proof generator:', error);
      throw error;
    }
  }

  /**
   * Generate a ZK proof
   */
  async generate(request: ProofRequest): Promise<ProofResult> {
    const startTime = Date.now();
    const proofId = nanoid(12);

    try {
      await this.initialize();

      // Validate tier
      const tierConfig = CONFIG.pricing[request.tier];
      if (!tierConfig) {
        throw new Error(`Invalid tier: ${request.tier}`);
      }

      // Validate circuit support
      if (!CONFIG.circuits.supportedCircuits.includes(request.circuit)) {
        throw new Error(`Unsupported circuit: ${request.circuit}`);
      }

      console.log(`🔒 Generating proof ${proofId} for circuit ${request.circuit} (tier: ${request.tier})`);

      // Process circuit-specific logic
      let processedInputs: any;
      switch (request.circuit) {
        case 'hashPreimage':
          processedInputs = await this.processHashPreimage(request.inputs);
          break;
        case 'rangeProof':
          processedInputs = await this.processRangeProof(request.inputs);
          break;
        case 'customArithmetic':
          processedInputs = await this.processCustomArithmetic(request.inputs);
          break;
        default:
          throw new Error(`Circuit not implemented: ${request.circuit}`);
      }

      // Generate the actual proof
      const { proof, publicSignals } = await this.generateProof(
        request.circuit,
        processedInputs,
        tierConfig.timeoutMs
      );

      const executionTime = Date.now() - startTime;

      console.log(`✅ Proof ${proofId} generated successfully in ${executionTime}ms`);

      return {
        success: true,
        proof,
        publicSignals,
        executionTime,
        proofId,
        tier: request.tier,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Proof ${proofId} generation failed:`, error);

      return {
        success: false,
        executionTime,
        proofId,
        tier: request.tier,
        error: error.message || 'Proof generation failed',
      };
    }
  }

  /**
   * Verify a ZK proof
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      await this.initialize();

      console.log(`🔍 Verifying proof for circuit ${request.circuit}`);

      // Load verification key
      const vKey = await this.loadVerificationKey(request.circuit);

      // Verify the proof
      const verified = await groth16.verify(
        vKey,
        request.publicSignals,
        request.proof
      );

      const executionTime = Date.now() - startTime;

      console.log(`✅ Proof verification completed: ${verified ? 'VALID' : 'INVALID'} (${executionTime}ms)`);

      return {
        success: true,
        verified,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Proof verification failed:', error);

      return {
        success: false,
        verified: false,
        executionTime,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Process hash preimage inputs
   */
  private async processHashPreimage(inputs: Record<string, any>): Promise<any> {
    if (!inputs.preimage) {
      throw new Error('Missing required input: preimage');
    }

    // Convert string to field element
    const preimageValue = BigInt(this.stringToFieldElement(inputs.preimage));
    
    // Calculate Poseidon hash
    const hash = this.poseidon([preimageValue]);
    const hashValue = this.poseidon.F.toString(hash);

    return {
      preimage: preimageValue.toString(),
      hash: hashValue,
    };
  }

  /**
   * Process range proof inputs
   */
  private async processRangeProof(inputs: Record<string, any>): Promise<any> {
    if (inputs.value === undefined) {
      throw new Error('Missing required input: value');
    }

    const value = BigInt(inputs.value);
    const min = BigInt(inputs.min || 0);
    const max = BigInt(inputs.max || 1000000);

    if (value < min || value > max) {
      throw new Error(`Value ${value} out of range [${min}, ${max}]`);
    }

    return {
      value: value.toString(),
      min: min.toString(),
      max: max.toString(),
    };
  }

  /**
   * Process custom arithmetic inputs
   */
  private async processCustomArithmetic(inputs: Record<string, any>): Promise<any> {
    const { a, b, operation } = inputs;

    if (a === undefined || b === undefined) {
      throw new Error('Missing required inputs: a, b');
    }

    const valueA = BigInt(a);
    const valueB = BigInt(b);

    let result: bigint;
    switch (operation) {
      case 'add':
        result = valueA + valueB;
        break;
      case 'multiply':
        result = valueA * valueB;
        break;
      case 'subtract':
        result = valueA - valueB;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return {
      a: valueA.toString(),
      b: valueB.toString(),
      result: result.toString(),
    };
  }

  /**
   * Generate proof with timeout
   */
  private async generateProof(
    circuit: string,
    inputs: any,
    timeoutMs: number
  ): Promise<{ proof: any; publicSignals: any[] }> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Proof generation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        // In production, this would load actual circuit files
        // For now, we'll create a mock proof structure
        const proof = await this.generateMockProof(circuit, inputs);
        
        clearTimeout(timeout);
        resolve(proof);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Generate mock proof (replace with actual snarkjs in production)
   */
  private async generateMockProof(
    circuit: string,
    inputs: any
  ): Promise<{ proof: any; publicSignals: any[] }> {
    // Simulate computation time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Create realistic-looking proof structure
    const proof = {
      pi_a: [
        this.randomFieldElement(),
        this.randomFieldElement(),
        "1"
      ],
      pi_b: [
        [this.randomFieldElement(), this.randomFieldElement()],
        [this.randomFieldElement(), this.randomFieldElement()],
        ["1", "0"]
      ],
      pi_c: [
        this.randomFieldElement(),
        this.randomFieldElement(),
        "1"
      ],
      protocol: "groth16",
      curve: "bn128"
    };

    // Extract public signals from inputs
    const publicSignals = Object.values(inputs).slice(0, 2).map(v => v.toString());

    return { proof, publicSignals };
  }

  /**
   * Load verification key
   */
  private async loadVerificationKey(circuit: string): Promise<any> {
    try {
      const vkeyPath = join(CONFIG.circuits.path, `${circuit}_vkey.json`);
      const vkeyData = await readFile(vkeyPath, 'utf-8');
      return JSON.parse(vkeyData);
    } catch (error) {
      // Return mock verification key for development
      console.warn(`⚠️ Using mock verification key for ${circuit}`);
      return this.getMockVerificationKey();
    }
  }

  /**
   * Mock verification key
   */
  private getMockVerificationKey(): any {
    return {
      protocol: "groth16",
      curve: "bn128",
      nPublic: 2,
      vk_alpha_1: [this.randomFieldElement(), this.randomFieldElement(), "1"],
      vk_beta_2: [
        [this.randomFieldElement(), this.randomFieldElement()],
        [this.randomFieldElement(), this.randomFieldElement()],
        ["1", "0"]
      ],
      vk_gamma_2: [
        [this.randomFieldElement(), this.randomFieldElement()],
        [this.randomFieldElement(), this.randomFieldElement()],
        ["1", "0"]
      ],
      vk_delta_2: [
        [this.randomFieldElement(), this.randomFieldElement()],
        [this.randomFieldElement(), this.randomFieldElement()],
        ["1", "0"]
      ],
      IC: [
        [this.randomFieldElement(), this.randomFieldElement(), "1"],
        [this.randomFieldElement(), this.randomFieldElement(), "1"]
      ]
    };
  }

  /**
   * Helper: Convert string to field element
   */
  private stringToFieldElement(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  /**
   * Helper: Generate random field element
   */
  private randomFieldElement(): string {
    return BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString();
  }
}

export const zkProofGenerator = new ZKProofGenerator();
