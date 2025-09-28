#!/bin/bash
set -e

echo "Starting custom build process..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the build using npx
echo "Building with Vite..."
npx vite build

echo "Build completed successfully!"
