/**
 * Utility for Updating Metadata on Existing SPL Tokens
 * 
 * This module provides functionality to add or update Metaplex metadata
 * for existing SPL tokens that were created without metadata or need
 * metadata updates.
 */

import { 
  Connection, 
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  createSetTokenStandardInstruction,
  PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createMemoInstruction,
} from '@solana/spl-memo';

/**
 * Check if metadata account exists for a given mint
 * @param {Connection} connection - Solana connection
 * @param {string} mintAddress - Mint address of the token
 * @returns {Promise<{exists: boolean, metadata: Object|null}>}
 */
export async function checkMetadataExists(connection, mintAddress) {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
    
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    
    const accountInfo = await connection.getAccountInfo(metadataAccount);
    
    if (!accountInfo) {
      return { exists: false, metadata: null };
    }
    
    const metadata = Metadata.deserialize(accountInfo.data)[0];
    
    return {
      exists: true,
      metadata: {
        name: metadata.data.name,
        symbol: metadata.data.symbol,
        uri: metadata.data.uri,
        updateAuthority: metadata.updateAuthority.toString(),
        isMutable: metadata.isMutable,
      },
    };
  } catch (error) {
    console.error('Error checking metadata:', error);
    throw new Error(`Failed to check metadata: ${error.message}`);
  }
}

/**
 * Create metadata for an existing token that doesn't have metadata
 * @param {Object} params - Parameters
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter with publicKey and signTransaction
 * @param {string} params.mintAddress - Mint address of existing token
 * @param {string} params.name - Token name
 * @param {string} params.symbol - Token symbol
 * @param {string} params.uri - Metadata URI
 * @returns {Promise<{signature: string, metadataAddress: string}>}
 */
export async function createMetadataForExistingToken({
  connection,
  wallet,
  mintAddress,
  name,
  symbol,
  uri,
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const mintPublicKey = new PublicKey(mintAddress);
  
  // Check if token mint exists
  const mintInfo = await connection.getAccountInfo(mintPublicKey);
  if (!mintInfo) {
    throw new Error('Token mint account not found');
  }

  // Check if metadata already exists
  const { exists } = await checkMetadataExists(connection, mintAddress);
  if (exists) {
    throw new Error('Metadata already exists for this token. Use update function instead.');
  }

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const transaction = new Transaction();

  // Add memo instruction
  const memoText = `Creating metadata for existing token: ${name} (${symbol})`;
  transaction.add(
    createMemoInstruction(memoText, [wallet.publicKey])
  );

  // Create metadata account
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
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true, // Set to true to allow future updates
          collectionDetails: null,
        },
      }
    )
  );

  // Set token standard to Fungible
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

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

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
    signature,
    metadataAddress: metadataAccount.toString(),
  };
}

/**
 * Update metadata for an existing token
 * @param {Object} params - Parameters
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter with publicKey and signTransaction
 * @param {string} params.mintAddress - Mint address of existing token
 * @param {string} params.name - New token name
 * @param {string} params.symbol - New token symbol
 * @param {string} params.uri - New metadata URI
 * @returns {Promise<{signature: string}>}
 */
export async function updateMetadataForExistingToken({
  connection,
  wallet,
  mintAddress,
  name,
  symbol,
  uri,
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const mintPublicKey = new PublicKey(mintAddress);
  
  // Check if metadata exists
  const { exists, metadata } = await checkMetadataExists(connection, mintAddress);
  if (!exists) {
    throw new Error('Metadata does not exist for this token. Use create function instead.');
  }

  // Check if wallet is the update authority
  if (metadata.updateAuthority !== wallet.publicKey.toString()) {
    throw new Error('Wallet is not the update authority for this token metadata');
  }

  // Check if metadata is mutable
  if (!metadata.isMutable) {
    throw new Error('Token metadata is immutable and cannot be updated');
  }

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const transaction = new Transaction();

  // Add memo instruction
  const memoText = `Updating metadata for token: ${name} (${symbol})`;
  transaction.add(
    createMemoInstruction(memoText, [wallet.publicKey])
  );

  // Update metadata account
  transaction.add(
    createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadataAccount,
        updateAuthority: wallet.publicKey,
      },
      {
        updateMetadataAccountArgsV2: {
          data: {
            name,
            symbol,
            uri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          updateAuthority: wallet.publicKey,
          primarySaleHappened: null,
          isMutable: true,
        },
      }
    )
  );

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

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
    signature,
  };
}
