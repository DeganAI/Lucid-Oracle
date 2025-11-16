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
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .status {
      background: rgba(255, 255, 255, 0.2);
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .endpoints {
      background: rgba(0, 0, 0, 0.2);
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .endpoint {
      font-family: 'Courier New', monospace;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      margin: 8px 0;
      font-size: 0.9rem;
    }
    .method {
      color: #fbbf24;
      font-weight: bold;
      margin-right: 8px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .feature {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    .feature-icon {
      font-size: 1.5rem;
      margin-bottom: 5px;
    }
    .wallet {
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      border-radius: 6px;
      margin-top: 10px;
      word-break: break-all;
    }
    a {
      color: #fbbf24;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔮 Lucid Oracle</h1>
    <p class="subtitle">Zero-Knowledge Proof Generation Service</p>
    
    <div class="status">
      <span class="status-indicator"></span>
      <strong>Status:</strong> Online | <strong>Network:</strong> Base L2 | <strong>Payment:</strong> x402 USDC
    </div>

    <div class="endpoints">
      <h3 style="margin-bottom: 15px;">🌐 API Endpoints</h3>
      <div class="endpoint">
        <span class="method">GET</span> /api/status
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /api/verify
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /api/generate-proof (requires payment)
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /api/verify-proof (requires payment)
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div><strong>zk-SNARKs</strong></div>
        <div>Groth16 proofs</div>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <div><strong>Micropayments</strong></div>
        <div>x402 Protocol</div>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div><strong>Fast</strong></div>
        <div>Sub-second proofs</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🛡️</div>
        <div><strong>Secure</strong></div>
        <div>Circuit isolation</div>
      </div>
    </div>

    <h3 style="margin-top: 30px; margin-bottom: 10px;">💳 Payment Address</h3>
    <div class="wallet">Base L2: ${CONFIG.wallets.base}</div>

    <div style="margin-top: 30px; text-align: center; opacity: 0.8; font-size: 0.9rem;">
      <p>Built with <a href="https://www.daydreams.systems" target="_blank">Daydreams</a> Lucid Agents</p>
      <p style="margin-top: 5px;">Powered by <a href="https://www.x402.org" target="_blank">x402</a> Protocol</p>
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
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)" rx="15"/>
    <text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🔮</text>
  </svg>`;
  res.send(svg);
});

app.get('/og-image.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#grad)"/>
    <text x="600" y="220" font-size="80" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">🔮 Lucid Oracle</text>
    <text x="600" y="310" font-size="42" text-anchor="middle" fill="white" font-family="Arial, sans-serif" opacity="0.95">Zero-Knowledge Proof Generation</text>
    <text x="600" y="400" font-size="36" text-anchor="middle" fill="white" font-family="Arial, sans-serif" opacity="0.85">x402 Micropayments • Base L2 • USDC</text>
    <text x="600" y="490" font-size="32" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-weight="bold">$0.02 - $0.10 per proof</text>
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
    description: 'Zero-knowledge proof generation',
  }),
  generateProofHandler
);

app.get('/api/verify-proof', verifyProofInfoHandler);
app.post(
  '/api/verify-proof',
  requirePayment({
    amount: CONFIG.pricing.basic,
    description: 'Zero-knowledge proof verification',
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
      console.log('🔮 =======================================');
      console.log('🔮  Lucid Oracle - ZK Proof Service');
      console.log('🔮 =======================================');
      console.log('');
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${CONFIG.server.nodeEnv}`);
      console.log(`🔗 Network: ${CONFIG.network.name} (Chain ID: ${CONFIG.network.chainId})`);
      console.log(`💳 Payment: x402 v${CONFIG.x402.version} (${CONFIG.x402.paymentToken})`);
      console.log(`💰 Wallet: ${CONFIG.wallets.base}`);
      console.log('');
      console.log('📡 Endpoints:');
      console.log(`   GET  /api/status - Agent status & capabilities`);
      console.log(`   GET  /api/verify - Wallet verification`);
      console.log(`   POST /api/generate-proof - Generate ZK proof ($${CONFIG.pricing.standard.price})`);
      console.log(`   POST /api/verify-proof - Verify ZK proof ($${CONFIG.pricing.basic.price})`);
      console.log('');
      console.log('🔐 Supported Circuits:');
      CONFIG.circuits.supportedCircuits.forEach(circuit => {
        console.log(`   - ${circuit}`);
      });
      console.log('');
      console.log('💵 Pricing:');
      console.log(`   Basic: $${CONFIG.pricing.basic.price} (${CONFIG.pricing.basic.circuitSize})`);
      console.log(`   Standard: $${CONFIG.pricing.standard.price} (${CONFIG.pricing.standard.circuitSize})`);
      console.log(`   Premium: $${CONFIG.pricing.premium.price} (${CONFIG.pricing.premium.circuitSize})`);
      console.log('');
      console.log('🔮 Ready to generate proofs!');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
