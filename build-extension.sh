#!/bin/bash

# Build script for AI Form Filler Chrome extension

echo "Building AI Form Filler extension..."

# Clean previous build
rm -rf dist

# Run the build
npm run build

# Fix HTML file locations
cd dist
cp src/sidepanel/index.html sidepanel.html
cp src/options/index.html options.html

# Clean up temporary src directory
rm -rf src

echo "Build completed! Extension files are in the 'dist' directory."
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the 'dist' folder"