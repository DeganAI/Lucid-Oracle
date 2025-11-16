#!/bin/bash

# Lucid Oracle - Quick Setup Script
# This script will help you get started with Lucid Oracle

set -e

echo "🔮 ========================================"
echo "🔮  Lucid Oracle - Quick Setup"
echo "🔮 ========================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher"
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "   Your wallet addresses are already configured!"
else
    echo "✅ .env file already exists"
fi

echo ""

# Type check
echo "🔍 Running type check..."
npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ Type check passed"
else
    echo "⚠️  Type check failed, but continuing..."
fi

echo ""
echo "🎉 ========================================"
echo "🎉  Setup Complete!"
echo "🎉 ========================================"
echo ""
echo "Your Lucid Oracle is ready to use!"
echo ""
echo "📍 Next steps:"
echo ""
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Visit http://localhost:3000"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:3000/api/status"
echo ""
echo "4. Deploy to production:"
echo "   See DEPLOYMENT.md for instructions"
echo ""
echo "💡 Quick Commands:"
echo "   npm run dev      - Start development server"
echo "   npm run build    - Build for production"
echo "   npm start        - Start production server"
echo "   npm run typecheck - Check TypeScript types"
echo ""
echo "📚 Documentation:"
echo "   README.md        - Full documentation"
echo "   DEPLOYMENT.md    - Deployment guide"
echo "   API_EXAMPLES.md  - Integration examples"
echo ""
echo "🔮 Your wallet addresses:"
echo "   Base L2:   0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83"
echo "   Ethereum:  0x11c24Fbcd702cd611729F8402d8fB51ECa75Ba83"
echo "   Solana:    2x4BRUreTFZCaCKbGKVXFYD5p2ZUBpYaYjuYsw9KYhf3"
echo ""
echo "💰 Ready to start earning with ZK proofs!"
echo ""
