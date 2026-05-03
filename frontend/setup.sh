#!/bin/bash

# Finance Dashboard Frontend Setup Script
# Run this script to set up the frontend environment

set -e  # Exit on error

echo "🚀 Finance Dashboard Frontend Setup"
echo "===================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js: $node_version"

# Check npm
echo "📦 Checking npm version..."
npm_version=$(npm -v)
echo "   npm: $npm_version"

echo ""
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "   1. Make sure the backend is running:"
echo "      npm run dev  (from root directory)"
echo ""
echo "   2. Start the frontend development server:"
echo "      npm run dev"
echo ""
echo "   3. Open browser:"
echo "      http://localhost:3000"
echo ""
echo "   4. Check for issues:"
echo "      npm run type-check"
echo "      npm run lint"
echo ""
echo "✨ Happy coding!"
