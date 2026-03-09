import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Find GitHub App Installation ID
 * 
 * This script helps you find the installation ID for your GitHub App
 */

async function findInstallationId() {
  console.log('🔍 Finding GitHub App Installation ID...\n');
  
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = (process.env.GITHUB_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  
  if (!appId || !privateKey) {
    console.error('❌ Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY in .env file');
    process.exit(1);
  }
  
  try {
    // Generate JWT
    console.log('🔑 Generating JWT token...');
    const payload = {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 540,
      iss: appId
    };
    
    const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    console.log('✅ JWT generated\n');
    
    // Get installations
    console.log('📋 Fetching installations...');
    const url = 'https://api.github.com/app/installations';
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RamSoft-AutoSnap'
      }
    });
    
    const installations = response.data;
    
    if (installations.length === 0) {
      console.log('⚠️  No installations found. Please install the app on your repository.\n');
      console.log('Visit: https://github.com/apps/YOUR_APP_NAME/installations/new');
      process.exit(0);
    }
    
    console.log(`✅ Found ${installations.length} installation(s):\n`);
    
    for (const installation of installations) {
      console.log(`📦 Installation ID: ${installation.id}`);
      console.log(`   Account: ${installation.account.login} (${installation.account.type})`);
      console.log(`   Target Type: ${installation.target_type}`);
      console.log(`   Created: ${installation.created_at}`);
      
      // Get repositories for this installation
      try {
        const repoUrl = `https://api.github.com/app/installations/${installation.id}/access_tokens`;
        const tokenResponse = await axios.post(repoUrl, {}, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'RamSoft-AutoSnap'
          }
        });
        
        const token = tokenResponse.data.token;
        
        // List repositories
        const reposUrl = `https://api.github.com/installation/repositories`;
        const reposResponse = await axios.get(reposUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'RamSoft-AutoSnap'
          }
        });
        
        console.log(`   Repositories (${reposResponse.data.total_count}):`);
        for (const repo of reposResponse.data.repositories) {
          console.log(`     - ${repo.full_name}`);
        }
      } catch (error) {
        console.log('   (Could not fetch repositories)');
      }
      
      console.log('');
    }
    
    // Find the one with OmegaAI-Mono
    const targetInstallation = installations.find(inst => {
      return inst.account.login === 'ramsoft-inc';
    });
    
    if (targetInstallation) {
      console.log('🎯 Recommended installation for ramsoft-inc/OmegaAI-Mono:');
      console.log(`   GITHUB_INSTALLATION_ID=${targetInstallation.id}\n`);
      console.log('📝 Add this to your .env file:\n');
      console.log(`GITHUB_INSTALLATION_ID=${targetInstallation.id}\n`);
    } else {
      console.log('💡 Choose the installation ID that has access to ramsoft-inc/OmegaAI-Mono\n');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to find installations:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    process.exit(1);
  }
}

// Run the script
findInstallationId();
