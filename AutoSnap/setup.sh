#!/bin/bash

# AutoSnap Setup and Installation Script
# This script installs all necessary dependencies and sets up AutoSnap

# Exit on error
set -e

# Print colored messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AutoSnap setup...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js (v16+) and try again.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    if command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Python command not found, but python3 is available. Creating an alias...${NC}"
        alias python=python3
    else
        echo -e "${RED}Python is not installed. Please install Python 3.8+ and try again.${NC}"
        exit 1
    fi
fi

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}Python version: ${python_version}${NC}"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    if command -v pip3 &> /dev/null; then
        echo -e "${YELLOW}pip command not found, but pip3 is available. Creating an alias...${NC}"
        alias pip=pip3
    else
        echo -e "${RED}pip is not installed. Please install pip and try again.${NC}"
        exit 1
    fi
fi

# Install Node.js dependencies
echo -e "${GREEN}Installing Node.js dependencies...${NC}"
npm install

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Install Playwright browsers
echo -e "${GREEN}Installing Playwright browsers...${NC}"
npx playwright install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# Azure OpenAI API Key
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint

# Optional: ReportSearch API Key
# REPORTSEARCH_API_KEY=your_reportsearch_api_key

# Optional: Python script timeout (ms)
# PY_TIMEOUT_MS=120000
EOF
    echo -e "${YELLOW}Please edit the .env file and add your API keys${NC}"
fi

echo -e "${GREEN}AutoSnap setup complete!${NC}"
echo -e "${GREEN}To run AutoSnap, use: npm run run-enhanced${NC}"
