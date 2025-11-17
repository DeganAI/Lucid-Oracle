import express from 'express';
import cors from 'cors';
import { CONFIG, validateConfig } from './lib/config.js';
import { requirePayment } from './middleware/x402.js';
import { statusHandler } from './routes/status.js';
import { generateProofHandler, generateProofInfoHandler } from './routes/generate-proof.js';
import { verifyProofHandler, verifyProofInfoHandler } from './routes/verify-proof.js';
import { verifyHandler } from './routes/verify.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  const host = req.get('host') || 'lucid-oracle-production.up.railway.app';
  const protocol = req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lucid Oracle - Zero-Knowledge Proof Generation Service</title>
  <meta name="description" content="Production-ready zero-knowledge proof generation with x402 micropayments on Base L2. Generate zk-SNARK proofs with instant USDC payments.">
  <meta property="og:title" content="Lucid Oracle - ZK Proof Generation Service">
  <meta property="og:description" content="Production-ready zero-knowledge proof generation with x402 micropayments on Base L2">
  <meta property="og:image" content="${baseUrl}/og-image.png">
  <meta property="og:url" content="${baseUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Lucid Oracle - ZK Proof Generation Service">
  <meta name="twitter:description" content="Production-ready zero-knowledge proof generation with x402 micropayments on Base L2">
  <meta name="twitter:image" content="${baseUrl}/og-image.png">
  <link rel="icon" type="image/png" href="${baseUrl}/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --neon-pink: #ff006e;
      --neon-cyan: #00f5ff;
      --neon-purple: #b026ff;
      --neon-green: #39ff14;
      --dark-bg: #0a0e27;
      --darker-bg: #050813;
    }
    
    @keyframes glitch {
      0% { text-shadow: 0.05em 0 0 var(--neon-cyan), -0.05em -0.025em 0 var(--neon-pink); }
      14% { text-shadow: 0.05em 0 0 var(--neon-cyan), -0.05em -0.025em 0 var(--neon-pink); }
      15% { text-shadow: -0.05em -0.025em 0 var(--neon-cyan), 0.05em 0.025em 0 var(--neon-pink); }
      49% { text-shadow: -0.05em -0.025em 0 var(--neon-cyan), 0.05em 0.025em 0 var(--neon-pink); }
      50% { text-shadow: 0.025em 0.05em 0 var(--neon-cyan), 0.05em 0 0 var(--neon-pink); }
      99% { text-shadow: 0.025em 0.05em 0 var(--neon-cyan), 0.05em 0 0 var(--neon-pink); }
      100% { text-shadow: -0.025em 0 0 var(--neon-cyan), -0.025em -0.025em 0 var(--neon-pink); }
    }
    
    @keyframes neon-flicker {
      0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
        text-shadow: 
          0 0 10px var(--neon-cyan),
          0 0 20px var(--neon-cyan),
          0 0 30px var(--neon-cyan),
          0 0 40px var(--neon-purple),
          0 0 70px var(--neon-purple),
          0 0 80px var(--neon-purple);
      }
      20%, 24%, 55% {
        text-shadow: none;
      }
    }
    
    @keyframes cyber-scan {
      0% { background-position: 0 0; }
      100% { background-position: 0 100%; }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    
    body {
      font-family: 'Share Tech Mono', monospace;
      background: var(--darker-bg);
      color: var(--neon-cyan);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow-x: hidden;
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        linear-gradient(transparent 50%, rgba(0, 245, 255, 0.03) 50%),
        linear-gradient(90deg, transparent 50%, rgba(255, 0, 110, 0.03) 50%);
      background-size: 4px 4px, 4px 4px;
      pointer-events: none;
      z-index: 1;
    }
    
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(0, 245, 255, 0.05) 50%,
        transparent 100%
      );
      background-size: 100% 200%;
      animation: cyber-scan 8s linear infinite;
      pointer-events: none;
      z-index: 2;
    }
    
    .container {
      max-width: 1000px;
      background: rgba(10, 14, 39, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 0;
      padding: 50px;
      box-shadow: 
        0 0 20px rgba(0, 245, 255, 0.3),
        0 0 40px rgba(176, 38, 255, 0.2),
        inset 0 0 60px rgba(0, 245, 255, 0.05);
      border: 2px solid var(--neon-cyan);
      position: relative;
      z-index: 3;
      clip-path: polygon(
        0 0, calc(100% - 20px) 0, 100% 20px,
        100% 100%, 20px 100%, 0 calc(100% - 20px)
      );
    }
    
    .container::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink));
      opacity: 0.3;
      filter: blur(10px);
      z-index: -1;
    }
    
    .llama-logo {
      font-size: 4rem;
      text-align: center;
      margin-bottom: 10px;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 0 20px var(--neon-green));
    }
    
    h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 3rem;
      font-weight: 900;
      margin-bottom: 10px;
      text-align: center;
      background: linear-gradient(90deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: glitch 3s infinite;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .subtitle {
      font-size: 1.1rem;
      text-align: center;
      color: var(--neon-green);
      margin-bottom: 40px;
      text-shadow: 0 0 10px var(--neon-green);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .status {
      background: rgba(0, 245, 255, 0.1);
      padding: 20px;
      margin-bottom: 30px;
      border-left: 4px solid var(--neon-cyan);
      border-right: 4px solid var(--neon-purple);
      position: relative;
    }
    
    .status::before {
      content: '>';
      position: absolute;
      left: 10px;
      color: var(--neon-pink);
      animation: neon-flicker 2s infinite;
    }
    
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: var(--neon-green);
      border-radius: 50%;
      margin-right: 8px;
      animation: neon-flicker 2s infinite;
      box-shadow: 0 0 10px var(--neon-green);
    }
    
    .endpoints {
      background: rgba(5, 8, 19, 0.8);
      padding: 25px;
      margin-bottom: 30px;
      border: 1px solid var(--neon-purple);
      box-shadow: inset 0 0 20px rgba(176, 38, 255, 0.1);
    }
    
    .endpoints h3 {
      font-family: 'Orbitron', sans-serif;
      color: var(--neon-purple);
      margin-bottom: 20px;
      text-shadow: 0 0 10px var(--neon-purple);
      letter-spacing: 2px;
    }
    
    .endpoint {
      font-family: 'Share Tech Mono', monospace;
      padding: 12px 15px;
      background: rgba(0, 245, 255, 0.05);
      border-left: 3px solid var(--neon-cyan);
      margin: 12px 0;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .endpoint:hover {
      background: rgba(0, 245, 255, 0.15);
      transform: translateX(10px);
      box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
    }
    
    .method {
      color: var(--neon-pink);
      font-weight: bold;
      margin-right: 12px;
      text-shadow: 0 0 5px var(--neon-pink);
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .feature {
      background: rgba(176, 38, 255, 0.1);
      padding: 20px;
      border: 1px solid var(--neon-purple);
      font-size: 0.9rem;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .feature::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(0, 245, 255, 0.1),
        transparent
      );
      transform: rotate(45deg);
      transition: all 0.5s;
    }
    
    .feature:hover::before {
      left: 100%;
    }
    
    .feature:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(176, 38, 255, 0.4);
      border-color: var(--neon-cyan);
    }
    
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 10px;
      filter: drop-shadow(0 0 10px var(--neon-purple));
    }
    
    .feature strong {
      color: var(--neon-cyan);
      text-shadow: 0 0 5px var(--neon-cyan);
    }
    
    .wallet {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.85rem;
      background: rgba(5, 8, 19, 0.9);
      padding: 15px;
      margin-top: 10px;
      word-break: break-all;
      border: 1px solid var(--neon-green);
      box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
      color: var(--neon-green);
    }
    
    .wallet::before {
      content: '0x';
      color: var(--neon-pink);
      margin-right: 5px;
    }
    
    .cyber-divider {
      height: 2px;
      background: linear-gradient(90deg, 
        transparent, 
        var(--neon-cyan), 
        var(--neon-purple), 
        var(--neon-pink), 
        transparent
      );
      margin: 30px 0;
      box-shadow: 0 0 10px var(--neon-cyan);
    }
    
    a {
      color: var(--neon-pink);
      text-decoration: none;
      font-weight: 700;
      text-shadow: 0 0 5px var(--neon-pink);
      transition: all 0.3s ease;
    }
    
    a:hover {
      color: var(--neon-cyan);
      text-shadow: 0 0 10px var(--neon-cyan);
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      opacity: 0.8;
      font-size: 0.9rem;
      color: var(--neon-purple);
    }
    
    .tech-badge {
      display: inline-block;
      padding: 5px 15px;
      background: rgba(0, 245, 255, 0.1);
      border: 1px solid var(--neon-cyan);
      margin: 5px;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      .container {
        padding: 30px 20px;
      }
      .llama-logo {
        font-size: 3rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="llama-logo">🦙⚡</div>
    <h1>LUCID ORACLE</h1>
    <p class="subtitle">Zero-Knowledge Proof Nexus</p>
    
    <div class="status">
      <span class="status-indicator"></span>
      <strong>SYSTEM STATUS:</strong> ONLINE | <strong>NETWORK:</strong> BASE L2 | <strong>PROTOCOL:</strong> x402 USDC
    </div>

    <div class="endpoints">
      <h3>⚡ API ENDPOINTS</h3>
      <div class="endpoint">
        <span class="method">GET</span> /api/status
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /api/verify
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /api/generate-proof [PAYMENT REQUIRED]
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /api/verify-proof [PAYMENT REQUIRED]
      </div>
    </div>

    <div class="cyber-divider"></div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div><strong>ZK-SNARKS</strong></div>
        <div>Groth16 Protocol</div>
        <div>BN128 Curve</div>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <div><strong>MICROPAYMENTS</strong></div>
        <div>x402 Protocol</div>
        <div>Instant Settlement</div>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div><strong>ULTRA-FAST</strong></div>
        <div>Sub-Second Proofs</div>
        <div>Real-Time Gen</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🛡️</div>
        <div><strong>FORTRESS</strong></div>
        <div>Circuit Isolation</div>
        <div>Zero Leakage</div>
      </div>
    </div>

    <div class="cyber-divider"></div>

    <h3 style="color: var(--neon-green); text-align: center; font-family: 'Orbitron', sans-serif; margin-top: 30px; text-shadow: 0 0 10px var(--neon-green);">
      💳 PAYMENT NEXUS
    </h3>
    <div class="wallet">${CONFIG.wallets.base.substring(2)}</div>

    <div style="text-align: center; margin-top: 30px;">
      <span class="tech-badge">ZK-SNARK</span>
      <span class="tech-badge">BASE L2</span>
      <span class="tech-badge">x402</span>
      <span class="tech-badge">USDC</span>
      <span class="tech-badge">GROTH16</span>
    </div>

    <div class="footer">
      <p style="margin-bottom: 10px; color: var(--neon-cyan); text-shadow: 0 0 5px var(--neon-cyan);">
        POWERED BY <a href="https://www.daydreams.systems" target="_blank">DAYDREAMS</a> LUCID AGENTS
      </p>
      <p style="color: var(--neon-purple); text-shadow: 0 0 5px var(--neon-purple);">
        PROTOCOL: <a href="https://www.x402.org" target="_blank">x402</a> MICROPAYMENT LAYER
      </p>
      <p style="margin-top: 15px; font-size: 0.75rem; color: var(--neon-pink);">
        [ $0.02 - $0.10 PER PROOF ] [ INSTANT VERIFICATION ] [ CRYPTOGRAPHIC TRUTH ]
      </p>
    </div>
  </div>
</body>
</html>
  `);
});

app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/favicon.png');
});

app.get('/favicon.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#b026ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ff006e;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="#0a0e27"/>
    <rect width="100" height="100" fill="url(#grad)" opacity="0.3"/>
    <text x="50" y="70" font-size="50" text-anchor="middle" fill="#00f5ff">🦙</text>
  </svg>`;
  res.send(svg);
});

app.get('/og-image.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a0e27;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#050813;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#b026ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ff006e;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#grad)"/>
    <rect x="0" y="0" width="1200" height="630" fill="url(#neon)" opacity="0.1"/>
    <text x="600" y="200" font-size="100" font-weight="900" text-anchor="middle" fill="#00f5ff" font-family="Arial, sans-serif" letter-spacing="5">🦙 LUCID ORACLE</text>
    <text x="600" y="300" font-size="48" text-anchor="middle" fill="#39ff14" font-family="Arial, sans-serif" opacity="0.95">ZERO-KNOWLEDGE PROOF NEXUS</text>
    <text x="600" y="400" font-size="38" text-anchor="middle" fill="#b026ff" font-family="Arial, sans-serif" opacity="0.85">x402 • BASE L2 • GROTH16 • USDC</text>
    <text x="600" y="500" font-size="36" text-anchor="middle" fill="#ff006e" font-family="Arial, sans-serif" font-weight="bold">⚡ $0.02 - $0.10 PER PROOF ⚡</text>
  </svg>`;
  res.send(svg);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    service: 'lucid-oracle',
    version: '1.0.0',
  });
});

app.get('/api/status', statusHandler);
app.get('/api/verify', verifyHandler);

app.get('/api/generate-proof', generateProofInfoHandler);
app.post(
  '/api/generate-proof',
  requirePayment({
    amount: CONFIG.pricing.standard,
    description: 'Generate zero-knowledge proof',
    outputSchema: {
      input: {
        type: "http",
        method: "POST",
        bodyType: "json",
        bodyFields: {
          circuit: {
            type: "string",
            required: true,
            description: "Circuit type to use for proof generation",
            enum: ["hashPreimage", "rangeProof", "customArithmetic"]
          },
          inputs: {
            type: "object",
            required: true,
            description: "Circuit-specific inputs (e.g., {preimage: 'secret'})"
          },
          tier: {
            type: "string",
            required: true,
            description: "Pricing tier (basic: $0.02, standard: $0.05, premium: $0.10)",
            enum: ["basic", "standard", "premium"]
          }
        }
      },
      output: {
        success: { type: "boolean" },
        proof: { type: "object", description: "zk-SNARK proof in Groth16 format" },
        publicSignals: { type: "array", description: "Public outputs from circuit" },
        metadata: {
          type: "object",
          properties: {
            proofId: { type: "string" },
            circuit: { type: "string" },
            tier: { type: "string" },
            executionTime: { type: "number" }
          }
        }
      }
    }
  }),
  generateProofHandler
);

app.get('/api/verify-proof', verifyProofInfoHandler);
app.post(
  '/api/verify-proof',
  requirePayment({
    amount: CONFIG.pricing.basic,
    description: 'Verify zero-knowledge proof',
    outputSchema: {
      input: {
        type: "http",
        method: "POST",
        bodyType: "json",
        bodyFields: {
          proof: {
            type: "object",
            required: true,
            description: "The zk-SNARK proof to verify (Groth16 format)"
          },
          publicSignals: {
            type: "array",
            required: true,
            description: "Public signals from proof generation"
          },
          circuit: {
            type: "string",
            required: true,
            description: "Circuit type used",
            enum: ["hashPreimage", "rangeProof", "customArithmetic"]
          }
        }
      },
      output: {
        success: { type: "boolean" },
        verified: { type: "boolean", description: "Whether the proof is valid" },
        metadata: {
          type: "object",
          properties: {
            circuit: { type: "string" },
            executionTime: { type: "number" },
            verifiedAt: { type: "number" }
          }
        }
      }
    }
  }),
  verifyProofHandler
);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: {
      status: 'GET /api/status',
      verify: 'GET /api/verify',
      generateProof: 'POST /api/generate-proof',
      verifyProof: 'POST /api/verify-proof',
    },
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

const PORT = CONFIG.server.port;
const HOST = CONFIG.server.host;

async function startServer() {
  try {
    validateConfig();

    app.listen(PORT, HOST, () => {
      console.log('');
      console.log('🦙 ⚡ ========================================');
      console.log('🦙 ⚡  LUCID ORACLE - ZK PROOF NEXUS');
      console.log('🦙 ⚡ ========================================');
      console.log('');
      console.log(`✅ SYSTEM ONLINE: http://${HOST}:${PORT}`);
      console.log(`🌐 ENVIRONMENT: ${CONFIG.server.nodeEnv.toUpperCase()}`);
      console.log(`🔗 NETWORK: ${CONFIG.network.name.toUpperCase()} (CHAIN: ${CONFIG.network.chainId})`);
      console.log(`💳 PROTOCOL: x402 v${CONFIG.x402.version} (${CONFIG.x402.paymentToken})`);
      console.log(`💰 NEXUS ADDRESS: ${CONFIG.wallets.base}`);
      console.log('');
      console.log('⚡ API ENDPOINTS:');
      console.log(`   GET  /api/status → Agent Status & Capabilities`);
      console.log(`   GET  /api/verify → Wallet Verification`);
      console.log(`   POST /api/generate-proof → Generate ZK Proof [$${CONFIG.pricing.standard.price}]`);
      console.log(`   POST /api/verify-proof → Verify ZK Proof [$${CONFIG.pricing.basic.price}]`);
      console.log('');
      console.log('🔐 SUPPORTED CIRCUITS:');
      CONFIG.circuits.supportedCircuits.forEach(circuit => {
        console.log(`   ⚡ ${circuit}`);
      });
      console.log('');
      console.log('💵 PRICING MATRIX:');
      console.log(`   BASIC:    $${CONFIG.pricing.basic.price} (${CONFIG.pricing.basic.circuitSize})`);
      console.log(`   STANDARD: $${CONFIG.pricing.standard.price} (${CONFIG.pricing.standard.circuitSize})`);
      console.log(`   PREMIUM:  $${CONFIG.pricing.premium.price} (${CONFIG.pricing.premium.circuitSize})`);
      console.log('');
      console.log('🦙 CRYPTOGRAPHIC LLAMA READY TO GENERATE PROOFS! ⚡');
      console.log('');
    });
  } catch (error) {
    console.error('❌ SYSTEM FAILURE:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM DETECTED - INITIATING GRACEFUL SHUTDOWN...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT DETECTED - INITIATING GRACEFUL SHUTDOWN...');
  process.exit(0);
});

startServer();

export default app;
