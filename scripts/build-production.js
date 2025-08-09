#!/usr/bin/env node

/**
 * Production Build Script (Node.js version)
 * This script handles optimized production builds
 */

import { execSync, spawn } from 'child_process';
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

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkNode() {
  if (!checkCommand('node')) {
    error('Node.js is not installed. Please install Node.js first.');
  }
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  log(`Node.js version: ${nodeVersion}`);
}

function checkNpm() {
  if (!checkCommand('npm')) {
    error('npm is not installed. Please install npm first.');
  }
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  log(`npm version: ${npmVersion}`);
}

function installDependencies() {
  log('Installing dependencies...');
  try {
    // Try npm ci first, fallback to npm install if lock file is out of sync
    try {
      execSync('npm ci --omit=dev', { stdio: 'inherit' });
    } catch (ciError) {
      warn('npm ci failed, falling back to npm install...');
      execSync('npm install', { stdio: 'inherit' });
    }
    log('Dependencies installed successfully');
  } catch (err) {
    error('Failed to install dependencies');
  }
}

function runTests(skipTests = false) {
  if (skipTests) {
    log('Tests skipped as requested');
    return;
  }

  log('Running tests before build...');
  try {
    execSync('npm run test:ci', { stdio: 'inherit' });
    log('All tests passed');
  } catch (err) {
    warn('Some tests failed. Continuing with build...');
  }
}

function runLinting(skipLint = false) {
  if (skipLint) {
    log('Linting skipped as requested');
    return;
  }

  log('Running linting...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    log('Linting passed');
  } catch (err) {
    warn('Linting issues found. Please review.');
  }
}

function buildApp() {
  log('Building application for production...');

  // Set production environment
  process.env.NODE_ENV = 'production';

  // Clean previous build
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    log('Cleaned previous build');
  }

  // Run build
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('Build completed successfully');
  } catch (err) {
    error('Build failed');
  }
}

function analyzeBundle() {
  log('Analyzing bundle size...');

  if (!fs.existsSync('dist')) {
    error('Build directory not found. Run build first.');
  }

  console.log('Bundle Analysis:');
  console.log('================');

  try {
    // Get file sizes
    const getFileSize = (filePath) => {
      const stats = fs.statSync(filePath);
      const size = stats.size;
      if (size > 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)}MB`;
      } else if (size > 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
      } else {
        return `${size}B`;
      }
    };

    const walkDir = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath, fileList);
        } else if (file.endsWith('.js')) {
          fileList.push(filePath);
        }
      });
      return fileList;
    };

    const jsFiles = walkDir('dist');
    jsFiles.forEach(file => {
      const size = getFileSize(file);
      console.log(`${size}\t${file}`);
    });

    // Check for large chunks
    const largeChunks = jsFiles.filter(file => {
      const stats = fs.statSync(file);
      return stats.size > 500 * 1024; // 500KB
    });

    if (largeChunks.length > 0) {
      warn('Large chunks detected (>500KB):');
      largeChunks.forEach(chunk => console.log(chunk));
    }
  } catch (err) {
    warn(`Bundle analysis failed: ${err.message}`);
  }
}

function generateReport() {
  const buildTime = new Date().toISOString();
  let buildSize = 'unknown';

  try {
    const stats = fs.statSync('dist');
    if (stats.isDirectory()) {
      // Calculate directory size
      const calculateDirSize = (dir) => {
        let size = 0;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            size += calculateDirSize(filePath);
          } else {
            size += stat.size;
          }
        });
        return size;
      };

      const totalSize = calculateDirSize('dist');
      if (totalSize > 1024 * 1024) {
        buildSize = `${(totalSize / (1024 * 1024)).toFixed(2)}MB`;
      } else if (totalSize > 1024) {
        buildSize = `${(totalSize / 1024).toFixed(2)}KB`;
      } else {
        buildSize = `${totalSize}B`;
      }
    }
  } catch (err) {
    warn(`Could not calculate build size: ${err.message}`);
  }

  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

  const report = `Production Build Report
======================
Build Time: ${buildTime}
Build Size: ${buildSize}
Node Version: ${nodeVersion}
npm Version: ${npmVersion}

Environment Variables:
NODE_ENV=${process.env.NODE_ENV || 'not set'}
VITE_APP_ENV=${process.env.VITE_APP_ENV || 'not set'}
`;

  fs.writeFileSync('build-report.txt', report);
  log('Build report generated: build-report.txt');
}

function showUsage() {
  console.log('Production Build Script');
  console.log('Usage: node build-production.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --skip-tests    Skip running tests');
  console.log('  --skip-lint     Skip linting');
  console.log('  --help          Show this help message');
}

function main() {
  const args = process.argv.slice(2);
  let skipTests = false;
  let skipLint = false;

  // Parse arguments
  args.forEach(arg => {
    switch (arg) {
      case '--skip-tests':
        skipTests = true;
        break;
      case '--skip-lint':
        skipLint = true;
        break;
      case '--help':
        showUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          warn(`Unknown option: ${arg}`);
        }
        break;
    }
  });

  log('Starting production build process...');

  // Load production environment variables if available
  if (fs.existsSync('.env.production')) {
    log('Loading production environment variables...');
    const envContent = fs.readFileSync('.env.production', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }

  // Build process
  checkNode();
  checkNpm();
  installDependencies();
  runLinting(skipLint);
  runTests(skipTests);
  buildApp();
  analyzeBundle();
  generateReport();

  log('Production build completed successfully!');
  log('Build output: ./dist');
  log('Build report: ./build-report.txt');
}

// Run main function
main();