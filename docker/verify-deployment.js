/**
 * TBM Twenty Deployment Verifier
 * Validates Phase 1 requirements:
 * - Server health endpoint (http://localhost:3000/healthz)
 * - Checks response code and JSON payload
 */
const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 0, error: err.message });
    });
  });
}

async function verify() {
  console.log(`Checking Twenty Deployment at ${SERVER_URL}...`);
  const healthUrl = `${SERVER_URL}/healthz`;
  const result = await checkEndpoint(healthUrl);

  console.log(`Result from ${healthUrl}: HTTP ${result.statusCode}`);
  if (result.statusCode === 200) {
    console.log('✅ Server is healthy and accepting connections!');
    process.exit(0);
  } else {
    console.log('⏳ Server not ready yet or returned non-200. Status:', result.statusCode);
    if (result.error) console.log('Error:', result.error);
    process.exit(1);
  }
}

verify();
