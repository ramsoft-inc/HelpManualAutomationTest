import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Find the installation ID for a specific repository
 */
async function findRepoInstallation() {
  console.log('🔍 Finding installation for ramsoft-inc/OmegaAI-Mono...\n');
  
  // Generate JWT (prefer DEV-style envs, same as Azure Function)
  const appId = process.env.GITHUB_APP_ID_DEV || process.env.GITHUB_APP_ID;
  let privateKey =
    process.env.GITHUB_PRIVATE_KEY1 ||
    process.env.GITHUB_PRIVATE_KEY ||
    '';

  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.endsWith(',')) {
    privateKey = privateKey.slice(0, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  if (!appId || !privateKey) {
    console.error('❌ Missing GITHUB_APP_ID_DEV/GITHUB_APP_ID or GITHUB_PRIVATE_KEY1/GITHUB_PRIVATE_KEY');
    return;
  }
  
  const payload = {
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 540,
    iss: appId
  };
  
  let jwtToken;
  try {
    jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    console.log('✅ JWT generated\n');
  } catch (error) {
    console.error('❌ Failed to generate JWT:', error.message);
    return;
  }
  
  // Check repository-specific installation
  console.log('📋 Checking ramsoft-inc/OmegaAI-Mono installation...');
  try {
    const response = await axios.get(
      'https://api.github.com/repos/ramsoft-inc/OmegaAI-Mono/installation',
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RamSoft-AutoSnap-Sync'
        }
      }
    );
    
    const installation = response.data;
    console.log('✅ Found installation!\n');
    console.log('📦 Installation Details:');
    console.log(`   Installation ID: ${installation.id}`);
    console.log(`   Account: ${installation.account.login} (${installation.account.type})`);
    console.log(`   App ID: ${installation.app_id}`);
    console.log(`   Target Type: ${installation.target_type}`);
    console.log(`   Permissions:`);
    Object.entries(installation.permissions || {}).forEach(([perm, level]) => {
      console.log(`     - ${perm}: ${level}`);
    });
    
    console.log('\n💡 Update your .env with:');
    console.log(`   GITHUB_INSTALLATION_ID=${installation.id}`);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('❌ GitHub App is NOT installed on ramsoft-inc/OmegaAI-Mono\n');
      console.log('📝 To fix this:');
      console.log('   1. Visit: https://github.com/organizations/ramsoft-inc/settings/installations');
      console.log('   2. Find your GitHub App');
      console.log('   3. Click "Configure"');
      console.log('   4. Add repository: OmegaAI-Mono');
      console.log('   5. Save');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

findRepoInstallation();
