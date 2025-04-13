# Interview Copilot (OpenAI Version)

> Utilizing GPT-4o and OpenAI's Whisper technology to assist interviewers - Password: 18031988

## Overview

Interview Copilot is a web application that captures audio from the microphone, 
utilizes OpenAI's Whisper speech recognition to obtain transcripts, 
and then invokes GPT-4o to generate answers. This version has been modified to use
OpenAI services instead of Azure's speech recognition.

![](./docs/imgs/2_demo/demo.png)

## Features

- **Real-time speech recognition** using OpenAI's Whisper model
- **AI-powered responses** using GPT-4o
- **Web-based interface** that works across all devices
- **Serverless architecture** - API keys are stored locally in your browser
- **Cross-platform compatibility** - works on desktop and mobile devices

## Setup Instructions

### Prerequisites
- An OpenAI API key (get one at https://platform.openai.com)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nlapi/interview-copilot.git
   cd interview-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run serve
   ```

4. Open your browser and go to http://localhost:8080

### Configuration

1. Click on the "Setting" link in the application
2. Enter your OpenAI API key
3. Select your preferred language for speech recognition
4. Select GPT-4o as the model (recommended)

## Using the Application

### Speech Recognition
1. Click "Start Copilot" to begin recording
2. Speak clearly into your microphone
3. The application will continuously transcribe your speech
4. Click "Stop Copilot" when finished

### Manual Text Input
1. Click "Manual Input" to open the text input dialog
2. Type or paste your text into the dialog
3. Click "Submit" to add the text to the transcription area

### Getting AI Response
1. After adding text (via speech or manual input), click "Ask GPT" to get AI-powered responses to the transcribed text

## Development

This project is based on Vue 2 and uses the following technologies:
- RecordRTC for audio recording
- OpenAI's Whisper API for speech recognition
- OpenAI's GPT-4o for AI responses

### Project Structure
- `src/views/HomeView.vue` - Main application interface
- `src/views/Setting.vue` - Settings page for API keys and preferences
- `src/utils/config_util.js` - Configuration utilities

### Build Commands

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build
```

## Modifications from Original
- Replaced Azure Speech Service with OpenAI's Whisper model
- Updated to use GPT-4o as the default model
- Improved audio recording using RecordRTC
- Added manual text input feature for pasting questions and problems
- Fixed duplicate text issue when stopping recording
- Added more detailed error handling
- Enhanced user interface for better feedback

## License
MIT License
