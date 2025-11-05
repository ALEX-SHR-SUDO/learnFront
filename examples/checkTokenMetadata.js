#!/usr/bin/env node
/**
 * Example script to check metadata for an existing token
 * 
 * Usage: node examples/checkTokenMetadata.js <MINT_ADDRESS>
 * 
 * This script demonstrates how to use the metadata upload utilities
 * to check if a token has metadata and display the metadata information.
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { checkMetadataExists } from '../metadata_upload/updateMetadata.js';

const NETWORK = 'devnet'; // Change to 'mainnet-beta' for production

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Mint address is required');
    console.log('\nUsage: node examples/checkTokenMetadata.js <MINT_ADDRESS>');
    console.log('\nExample:');
    console.log('  node examples/checkTokenMetadata.js FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump');
    process.exit(1);
  }

  const mintAddress = args[0];
  
  console.log('\n🔍 Checking token metadata...');
  console.log(`Network: ${NETWORK}`);
  console.log(`Mint Address: ${mintAddress}\n`);

  try {
    // Validate mint address
    new PublicKey(mintAddress);
  } catch (error) {
    console.error('❌ Invalid mint address format');
    process.exit(1);
  }

  try {
    // Create connection
    const endpoint = clusterApiUrl(NETWORK);
    const connection = new Connection(endpoint, 'confirmed');
    
    // Check if token mint exists
    console.log('Checking if token mint exists...');
    const mintPublicKey = new PublicKey(mintAddress);
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) {
      console.error('❌ Token mint account not found on the blockchain');
      console.log('Make sure you are using the correct network and mint address');
      process.exit(1);
    }
    
    console.log('✅ Token mint found\n');

    // Check metadata
    console.log('Checking metadata...');
    const result = await checkMetadataExists(connection, mintAddress);

    if (result.exists) {
      console.log('\n✅ Metadata exists!\n');
      console.log('Metadata Information:');
      console.log('━'.repeat(50));
      console.log(`Name:             ${result.metadata.name}`);
      console.log(`Symbol:           ${result.metadata.symbol}`);
      console.log(`URI:              ${result.metadata.uri}`);
      console.log(`Update Authority: ${result.metadata.updateAuthority}`);
      console.log(`Mutable:          ${result.metadata.isMutable ? 'Yes' : 'No'}`);
      console.log('━'.repeat(50));
      
      console.log('\n📝 Notes:');
      if (result.metadata.isMutable) {
        console.log('  • Metadata can be updated by the update authority');
      } else {
        console.log('  • Metadata is immutable and cannot be changed');
      }
      
      console.log(`\n🔗 View on Solscan: https://solscan.io/token/${mintAddress}?cluster=${NETWORK}`);
    } else {
      console.log('\nℹ️  No metadata found for this token\n');
      console.log('This token was created without metadata.');
      console.log('You can add metadata using the metadata upload feature.\n');
      console.log('📋 Next steps:');
      console.log('  1. Go to /metadata-upload page in the application');
      console.log('  2. Enter this mint address');
      console.log('  3. Upload a logo and fill in token information');
      console.log('  4. Create metadata for the token\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
