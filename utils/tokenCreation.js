/**
 * Solana Fungible SPL Token Creation Utility
 * 
 * This module creates standard fungible SPL tokens (like USDC, SOL-wrapped tokens, etc.)
 * with Metaplex metadata, NOT NFTs.
 * 
 * Key differences between SPL Tokens and NFTs:
 * - SPL Token: tokenStandard=2 (Fungible), decimals > 0, supply > 1
 * - NFT: tokenStandard=0 (NonFungible), decimals=0, supply=1, has creators/collection
 * 
 * The tokens created by this utility have Metaplex metadata for displaying
 * name, symbol, and logo in wallets, but are fungible tokens, not NFTs.
 */

import { 
  Connection, 
  Keypair, 
  SystemProgram, 
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  createSetAuthorityInstruction,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  createSetTokenStandardInstruction,
  PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata';



// Cost estimation constants (in SOL)
// Note: These are approximate values and may need periodic updates
// as network conditions and rent requirements change
const METADATA_ACCOUNT_RENT_SOL = 0.01; // Approximate metadata account rent (~0.0096 SOL as of 2024)
const TRANSACTION_FEES_SOL = 0.005; // Approximate transaction fees
export const FALLBACK_ESTIMATE_SOL = 0.02; // Fallback estimate if calculation fails

/**
 * Create a new FUNGIBLE SPL TOKEN with Metaplex metadata using the client's wallet
 * 
 * This function creates a standard fungible SPL token (like USDC, USDT, etc.), NOT an NFT.
 * The resulting token will have:
 * - tokenStandard: 2 (Fungible) - set automatically by Metaplex based on metadata
 * - editionNonce: 255 (no edition) - fungible tokens don't have editions
 * - Null values for NFT-specific fields (creators, collection, uses)
 * 
 * @param {Object} params - Token creation parameters
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter object with publicKey and signTransaction
 * @param {string} params.name - Token name
 * @param {string} params.symbol - Token symbol
 * @param {string} params.uri - Metadata URI (JSON file with token info)
 * @param {number} params.decimals - Token decimals (typically 9 for SPL tokens)
 * @param {string|number} params.supply - Initial supply (can be string or number)
 * @param {boolean} params.revokeMintAuthority - Whether to revoke mint authority (prevents future minting)
 * @param {boolean} params.revokeFreezeAuthority - Whether to revoke freeze authority (prevents freezing accounts)
 * @returns {Promise<{mintAddress: string, signature: string}>}
 */
export async function createTokenWithMetadata({
  connection,
  wallet,
  name,
  symbol,
  uri,
  decimals,
  supply,
  revokeMintAuthority = false,
  revokeFreezeAuthority = false,
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Validate and convert supply to BigInt
  const supplyStr = supply.toString().trim();
  if (!supplyStr || isNaN(supplyStr) || parseFloat(supplyStr) <= 0) {
    throw new Error('Supply must be a valid positive number');
  }
  const supplyBigInt = BigInt(Math.floor(parseFloat(supplyStr)));

  // Generate a new keypair for the mint
  const mintKeypair = Keypair.generate();
  const mintPublicKey = mintKeypair.publicKey;
  
  // Get the associated token account address
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    wallet.publicKey
  );

  // Calculate rent
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  // Create transaction
  const transaction = new Transaction();

  // 1. Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintPublicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // 2. Initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mintPublicKey,
      decimals,
      wallet.publicKey, // mint authority
      revokeFreezeAuthority ? null : wallet.publicKey, // freeze authority
      TOKEN_PROGRAM_ID
    )
  );

  // 3. Create associated token account
  transaction.add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey, // payer
      associatedTokenAccount,
      wallet.publicKey, // owner
      mintPublicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  // 4. Mint tokens to the associated token account
  const amount = supplyBigInt * (BigInt(10) ** BigInt(decimals));
  transaction.add(
    createMintToInstruction(
      mintPublicKey,
      associatedTokenAccount,
      wallet.publicKey, // mint authority
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // 5. Create metadata account for FUNGIBLE SPL TOKEN
  // This creates Metaplex metadata with tokenStandard=2 (Fungible), NOT an NFT
  // NFT-specific fields (creators, collection, uses) are set to null for fungible tokens
  // We explicitly call SetTokenStandard after creation to ensure proper identification
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  
  transaction.add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint: mintPublicKey,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name,
            symbol,
            uri,
            sellerFeeBasisPoints: 0,  // Always 0 for fungible SPL tokens
            creators: null,            // Null for fungible tokens (only used for NFTs)
            collection: null,          // Null for fungible tokens (only used for NFT collections)
            uses: null,                // Null for fungible tokens (only used for NFTs with usage limits)
          },
          isMutable: false,            // Set to false for immutable metadata
          collectionDetails: null,     // Null for fungible tokens (only used for NFT collection parents)
        },
      }
    )
  );

  // 5b. Explicitly set token standard to Fungible (2)
  // This ensures Solscan and other explorers correctly identify this as a fungible SPL token, not an NFT
  // The SetTokenStandard instruction infers the token standard from the mint account's decimals
  // and the absence of a Master Edition account (NFTs have decimals=0 and a Master Edition)
  transaction.add(
    createSetTokenStandardInstruction(
      {
        metadata: metadataAccount,
        updateAuthority: wallet.publicKey,
        mint: mintPublicKey,
      },
      TOKEN_METADATA_PROGRAM_ID
    )
  );

  // 6. Revoke mint authority if requested
  if (revokeMintAuthority) {
    transaction.add(
      createSetAuthorityInstruction(
        mintPublicKey,
        wallet.publicKey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Partially sign with mint keypair
  transaction.partialSign(mintKeypair);

  // Sign with wallet
  const signedTransaction = await wallet.signTransaction(transaction);

  // Send transaction
  const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Confirm transaction
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, 'confirmed');

  return {
    mintAddress: mintPublicKey.toString(),
    signature,
  };
}

/**
 * Estimate the cost of creating a token
 * @param {Connection} connection - Solana connection
 * @returns {Promise<number>} Estimated cost in SOL
 */
export async function estimateTokenCreationCost(connection) {
  try {
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);
    const totalLamports = mintRent + 
                         (METADATA_ACCOUNT_RENT_SOL * LAMPORTS_PER_SOL) + 
                         (TRANSACTION_FEES_SOL * LAMPORTS_PER_SOL);
    return totalLamports / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error estimating cost:', error);
    return FALLBACK_ESTIMATE_SOL;
  }
}

/**
 * Verify that a token has correct SPL token metadata (not NFT metadata)
 * 
 * This function fetches the on-chain metadata and verifies:
 * - tokenStandard is 2 (Fungible) for SPL tokens
 * - editionNonce is 255 (no edition) for fungible tokens
 * - NFT-specific fields (creators, collection) are null
 * - sellerFeeBasisPoints is 0 for SPL tokens
 * 
 * @param {Connection} connection - Solana connection
 * @param {string} mintAddress - Mint address of the token to verify
 * @returns {Promise<{isValid: boolean, metadata: Object, errors: string[]}>}
 */
export async function verifySPLTokenMetadata(connection, mintAddress) {
  const errors = [];
  
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
    
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
    // Token Standard should be 2 (Fungible) for SPL tokens
    if (metadata.tokenStandard !== 2) {
      errors.push(`Invalid tokenStandard: expected 2 (Fungible), got ${metadata.tokenStandard}`);
    }
    
    // Edition nonce should be 255 (no edition) for fungible tokens
    // Note: Metaplex uses 255 as the standard value for fungible tokens (no edition).
    // Some older tokens may have 251, which is also accepted as indicating no edition.
    if (metadata.editionNonce !== 255 && metadata.editionNonce !== 251) {
      errors.push(`Unusual editionNonce: expected 255 or 251, got ${metadata.editionNonce}`);
    }
    
    // Seller fee should be 0 for SPL tokens (not NFTs)
    if (metadata.data.sellerFeeBasisPoints !== 0) {
      errors.push(`Invalid sellerFeeBasisPoints: expected 0 for SPL token, got ${metadata.data.sellerFeeBasisPoints}`);
    }
    
    // Collection should be null for SPL tokens (NFT-specific)
    if (metadata.collection !== null && metadata.collection !== undefined) {
      errors.push('Collection field should be null for SPL tokens (NFT-specific field)');
    }
    
    // Uses should be null for SPL tokens (NFT-specific)
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
