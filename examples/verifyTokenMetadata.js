/**
 * Example usage of SPL Token Metadata Verification
 * 
 * This file demonstrates how to verify that a token has correct SPL token metadata.
 * Run this script to verify an existing token's metadata.
 * 
 * Usage:
 *   node examples/verifyTokenMetadata.js <MINT_ADDRESS>
 * 
 * Example:
 *   node examples/verifyTokenMetadata.js FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump
 */

const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { WalletAdapterNetwork } = require('@solana/wallet-adapter-base');
const { PROGRAM_ID, Metadata } = require('@metaplex-foundation/mpl-token-metadata');

// Get mint address from command line arguments
const mintAddress = process.argv[2];

if (!mintAddress) {
  console.error('Error: Please provide a mint address as an argument');
  console.log('Usage: node examples/verifyTokenMetadata.js <MINT_ADDRESS>');
  process.exit(1);
}

async function verifySPLTokenMetadata(connection, mintAddress) {
  const errors = [];
  
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(PROGRAM_ID);
    
    // Derive metadata account address
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    
    // Fetch metadata account
    const accountInfo = await connection.getAccountInfo(metadataAccount);
    
    if (!accountInfo) {
      errors.push('Metadata account not found');
      return { isValid: false, metadata: null, errors };
    }
    
    // Deserialize metadata
    const metadata = Metadata.deserialize(accountInfo.data)[0];
    
    // Convert to plain object for easier inspection
    const metadataObj = {
      key: metadata.key,
      updateAuthority: metadata.updateAuthority.toString(),
      mint: metadata.mint.toString(),
      data: {
        name: metadata.data.name,
        symbol: metadata.data.symbol,
        uri: metadata.data.uri,
        sellerFeeBasisPoints: metadata.data.sellerFeeBasisPoints,
      },
      primarySaleHappened: metadata.primarySaleHappened ? 1 : 0,
      isMutable: metadata.isMutable ? 1 : 0,
      editionNonce: metadata.editionNonce,
      tokenStandard: metadata.tokenStandard,
      collection: metadata.collection,
      uses: metadata.uses,
    };
    
    // Verify SPL token characteristics
    if (metadata.tokenStandard !== 2) {
      errors.push(`Invalid tokenStandard: expected 2 (Fungible), got ${metadata.tokenStandard}`);
    }
    
    if (metadata.editionNonce !== 255 && metadata.editionNonce !== 251) {
      errors.push(`Unusual editionNonce: expected 255 or 251, got ${metadata.editionNonce}`);
    }
    
    if (metadata.data.sellerFeeBasisPoints !== 0) {
      errors.push(`Invalid sellerFeeBasisPoints: expected 0 for SPL token, got ${metadata.data.sellerFeeBasisPoints}`);
    }
    
    if (metadata.collection !== null && metadata.collection !== undefined) {
      errors.push('Collection field should be null for SPL tokens (NFT-specific field)');
    }
    
    if (metadata.uses !== null && metadata.uses !== undefined) {
      errors.push('Uses field should be null for SPL tokens (NFT-specific field)');
    }
    
    return {
      isValid: errors.length === 0,
      metadata: metadataObj,
      errors,
    };
  } catch (error) {
    errors.push(`Error verifying metadata: ${error.message}`);
    return { isValid: false, metadata: null, errors };
  }
}

async function main() {
  console.log('🔍 Verifying SPL Token Metadata');
  console.log('================================\n');
  console.log(`Mint Address: ${mintAddress}`);
  console.log(`Network: Devnet\n`);

  // Create connection
  const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const connection = new Connection(endpoint, 'confirmed');

  // Verify metadata
  console.log('Fetching and verifying metadata...\n');
  const result = await verifySPLTokenMetadata(connection, mintAddress);

  if (result.isValid) {
    console.log('✅ VALID SPL TOKEN METADATA');
    console.log('===========================\n');
    console.log('The token has correct SPL token metadata structure.\n');
    console.log('Metadata Details:');
    console.log(JSON.stringify(result.metadata, null, 2));
  } else {
    console.log('❌ INVALID OR PROBLEMATIC METADATA');
    console.log('====================================\n');
    console.log('Issues found:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    if (result.metadata) {
      console.log('\nMetadata Details:');
      console.log(JSON.stringify(result.metadata, null, 2));
    }
  }

  console.log('\n📊 Key Fields to Check:');
  console.log('========================');
  if (result.metadata) {
    console.log(`tokenStandard: ${result.metadata.tokenStandard} ${result.metadata.tokenStandard === 2 ? '✅ (Fungible)' : '❌ (Not Fungible)'}`);
    console.log(`editionNonce: ${result.metadata.editionNonce} ${[255, 251].includes(result.metadata.editionNonce) ? '✅ (No edition)' : '❌ (Has edition)'}`);
    console.log(`sellerFeeBasisPoints: ${result.metadata.data.sellerFeeBasisPoints} ${result.metadata.data.sellerFeeBasisPoints === 0 ? '✅' : '❌ (Should be 0 for SPL tokens)'}`);
    console.log(`isMutable: ${result.metadata.isMutable} ${result.metadata.isMutable === 0 ? '✅ (Immutable)' : '⚠️ (Mutable)'}`);
  }

  console.log('\n🔗 View on Solscan:');
  console.log(`https://solscan.io/token/${mintAddress}?cluster=devnet\n`);
}

main().catch(console.error);

