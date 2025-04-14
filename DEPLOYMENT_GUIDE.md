# Interview Copilot Deployment Guide

This guide provides instructions for deploying Interview Copilot in various ways, from simple setups to advanced deployments.

## Quick Deployment Options

### 1. Replit Web Deployment (Easiest)

The simplest way to deploy Interview Copilot is through Replit:

1. Fork the [Interview Copilot Replit project](https://replit.com/@YOUR_USERNAME/interview-copilot)
2. Click the "Run" button to start the application
3. Click the "Deploy" button to deploy to a Replit subdomain

This will give you a publicly accessible URL that you can visit from any device.

### 2. Local Web Server

To run Interview Copilot locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/nlapi/interview-copilot.git
   cd interview-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Serve the production build:
   ```bash
   npx serve -s dist
   ```

5. Open your browser and navigate to `http://localhost:3000`

### 3. Windows Desktop Application (For Interview Use)

The desktop application provides enhanced features for using during interviews, including the ability to hide when screen sharing is detected.

#### One-Click Installation

1. Download the latest installer from the [Releases page](https://github.com/nlapi/interview-copilot/releases)
2. Run `Interview-Copilot-Setup-x.x.x.exe` to start installation
3. Follow the on-screen instructions
4. Start Interview Copilot from your Start Menu

#### Building From Source

If you prefer to build the desktop application yourself:

1. Clone the repository:
   ```bash
   git clone https://github.com/nlapi/interview-copilot.git
   cd interview-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the Windows build script:
   ```bash
   .\build-windows.bat
   ```

4. Find the installer in the `electron-dist` folder

## Configuration After Deployment

Regardless of deployment method, you need to configure:

1. Open the application and go to "Setting"
2. Enter your OpenAI API key
3. Select your preferred language for speech recognition
4. Select GPT-4o as the model (recommended)

## Advanced Deployment Options

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t interview-copilot .
   ```

2. Run the container:
   ```bash
   docker run -d -p 8080:80 interview-copilot
   ```

3. Access the application at `http://localhost:8080`

### Environment Variables

The application supports the following environment variables:

- `VUE_APP_DEFAULT_MODEL`: Set default GPT model (e.g., "gpt-4o")
- `VUE_APP_DEFAULT_LANGUAGE`: Set default speech recognition language

## Deployment Considerations

1. **API Key Security**: Your OpenAI API key is stored locally in browser localStorage. For shared deployments, consider implementing a more secure solution.

2. **Network Requirements**: The application needs internet access to communicate with OpenAI APIs.

3. **Mobile Compatibility**: The web application works on mobile devices, but requires microphone permissions.

4. **Desktop Features**: The screen-sharing detection and auto-hide features are only available in the desktop application.

## Troubleshooting Deployment Issues

1. **CORS Errors**: If you're hosting the application on a different domain than your API, you may need to configure CORS settings.

2. **OpenAI API Connection**: Ensure your deployment environment has network access to the OpenAI API endpoints.

3. **Desktop App Installation**: If the installer fails, try running it as administrator or check your antivirus settings.

For more detailed information, see the [README.md](README.md) and [DESKTOP_APP_GUIDE.md](DESKTOP_APP_GUIDE.md) files.