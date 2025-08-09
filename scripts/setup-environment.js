#!/usr/bin/env node

/**
 * Environment Setup Script (Node.js version)
 * This script helps set up environment variables for different deployment environments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors.green}[${timestamp}] ${message}${colors.reset}`);
}

function warn(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${colors.yellow}[${timestamp}] WARNING: ${message}${colors.reset}`);
}

function error(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.error(`${colors.red}[${timestamp}] ERROR: ${message}${colors.reset}`);
  process.exit(1);
}

function showUsage() {
  console.log('Environment Setup Script');
  console.log('Usage: node setup-environment.js [development|staging|production] [validate]');
  console.log('');
  console.log('Commands:');
  console.log('  development  - Setup development environment');
  console.log('  staging      - Setup staging environment');
  console.log('  production   - Setup production environment');
  console.log('  validate     - Validate current environment variables');
}

function setupEnvironment(envType) {
  if (!envType) {
    showUsage();
    process.exit(1);
  }

  const envFiles = {
    development: '.env.example',
    staging: '.env.staging',
    production: '.env.production'
  };

  const sourceFile = envFiles[envType];
  const targetFile = '.env.local';

  if (!sourceFile) {
    error(`Invalid environment type. Use: development, staging, or production`);
  }

  log(`Setting up ${envType} environment...`);

  if (fs.existsSync(sourceFile)) {
    try {
      fs.copyFileSync(sourceFile, targetFile);
      log(`Copied ${sourceFile} to ${targetFile}`);
      
      if (envType === 'production') {
        warn('Please update the environment variables with actual values');
      }
    } catch (err) {
      error(`Failed to copy environment file: ${err.message}`);
    }
  } else {
    if (envType === 'development' && sourceFile === '.env.example') {
      warn('.env.example not found');
    } else {
      error(`${sourceFile} not found`);
    }
  }

  log(`Environment setup completed for: ${envType}`);
  log('Please review and update .env.local with appropriate values');
}

function validateEnvironment() {
  log('Validating environment variables...');

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_APP_ENV'
  ];

  // Load .env.local if it exists
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    error('.env.local not found');
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};

  // Parse environment variables
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  const missingVars = [];
  requiredVars.forEach(varName => {
    if (!envVars[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  log('Environment validation passed');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case 'validate':
      validateEnvironment();
      break;
    case 'development':
    case 'staging':
    case 'production':
      setupEnvironment(command);
      break;
    default:
      showUsage();
      process.exit(1);
  }
}

// Run main function
main();