#!/bin/bash

# Setup script for Interview Copilot

# Clone the repository
echo "Setting up Interview Copilot repository..."
if [ "$(ls -A | grep -v 'setup.sh' | grep -v 'explore_repo.py' | grep -v 'README.md' | grep -v 'generated-icon.png')" ]; then
  echo "Directory is not empty. Cleaning up for fresh clone..."
  mkdir -p /tmp/backup
  cp setup.sh explore_repo.py README.md /tmp/backup/ 2>/dev/null || true
  cp generated-icon.png /tmp/backup/ 2>/dev/null || true
  rm -rf * .* 2>/dev/null || true
  cp /tmp/backup/* . 2>/dev/null || true
fi

echo "Cloning Interview Copilot repository..."
git clone https://github.com/interview-copilot/Interview-Copilot temp_repo
if [ $? -ne 0 ]; then
  echo "Failed to clone repository. Exiting."
  exit 1
fi

echo "Moving repository files..."
cp -r temp_repo/* . 2>/dev/null || true
cp -r temp_repo/.[!.]* . 2>/dev/null || true
rm -rf temp_repo

echo "Repository cloned successfully!"

# Check what dependencies we need to install
echo "Checking for package.json or requirements.txt..."

if [ -f "package.json" ]; then
  echo "Found package.json. This is a Node.js project."
  echo "Installing Node.js dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    echo "Failed to install Node.js dependencies. Exiting."
    exit 1
  fi
  echo "Node.js dependencies installed successfully!"
fi

if [ -f "requirements.txt" ]; then
  echo "Found requirements.txt. This is a Python project."
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
  if [ $? -ne 0 ]; then
    echo "Failed to install Python dependencies. Exiting."
    exit 1
  fi
  echo "Python dependencies installed successfully!"
fi

# Set up environment variables if needed
if [ -f ".env.example" ]; then
  echo "Found .env.example file. Creating .env file..."
  cp .env.example .env
  echo "Please update the .env file with your actual environment variables."
fi

# Run the Python script to explore the repository structure
echo "Exploring repository structure..."
python explore_repo.py

echo "Setup complete! Check README.md for details about the project structure."
