
#!/bin/bash

# Build the Vue app first
npm run build

# Build the Electron app
npx electron-builder

echo "Electron app built successfully. Find it in the electron-dist folder."
