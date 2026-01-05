#!/usr/bin/env node

/**
 * Generate NEXTAUTH_SECRET for NextAuth.js
 * 
 * Usage:
 *   node scripts/generate-secret.js
 * 
 * This will generate a secure random secret key that you can use
 * for NEXTAUTH_SECRET in your .env.local file
 */

const crypto = require('crypto');

// Generate a secure random secret (32 bytes = 256 bits)
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 NEXTAUTH_SECRET Generated!\n');
console.log('Copy this to your .env.local file:\n');
console.log(`NEXTAUTH_SECRET=${secret}\n`);
console.log('For Vercel deployment, add this to your environment variables:\n');
console.log('1. Go to Vercel Dashboard');
console.log('2. Project Settings → Environment Variables');
console.log('3. Add NEXTAUTH_SECRET with the value above');
console.log('4. Add NEXTAUTH_URL with your domain (e.g., https://your-app.vercel.app)');
console.log('5. Redeploy your application\n');
