# ZK Circuit Files

This directory stores the compiled ZK circuit files used for proof generation and verification.

## Required Files

For each circuit, you need:
- `{circuit}_circuit.wasm` - WebAssembly circuit
- `{circuit}.zkey` - Proving key
- `{circuit}_vkey.json` - Verification key

## Supported Circuits

### hashPreimage
Prove knowledge of a preimage to a hash without revealing the preimage.

### rangeProof
Prove a value is within a specified range without revealing the exact value.

### customArithmetic
Prove arithmetic operations (addition, multiplication, subtraction).

## Generating Circuit Files

If you need to generate your own circuits using Circom and snarkjs:
```bash
# Install circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release

# Compile circuit
circom your_circuit.circom --r1cs --wasm --sym

# Generate proving key
snarkjs groth16 setup your_circuit.r1cs pot12_final.ptau your_circuit.zkey

# Export verification key
snarkjs zkey export verificationkey your_circuit.zkey your_circuit_vkey.json
```

## File Sizes

Circuit files can be large (100MB+). They are excluded from git via `.gitignore`.

## Development Mode

In development, the application uses mock proofs if circuit files are not present, allowing you to test the payment and API flow without actual circuits.

## Production Deployment

Ensure all required circuit files are present before deploying to production. You can:
1. Build circuits and include them in your deployment
2. Download pre-compiled circuits from a trusted source
3. Store circuits in cloud storage (S3, GCS) and download during deployment
```

## 📁 File 19: `circuits/.gitkeep`
```
# This file keeps the circuits directory in git
# Actual circuit files (.zkey, .wasm, .r1cs) are ignored
