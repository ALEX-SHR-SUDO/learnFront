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
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';

/**
 * Create a new token with metadata using the client's wallet
 * @param {Object} params - Token creation parameters
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter object with publicKey and signTransaction
 * @param {string} params.name - Token name
 * @param {string} params.symbol - Token symbol
 * @param {string} params.uri - Metadata URI
 * @param {number} params.decimals - Token decimals
 * @param {string|number} params.supply - Initial supply (can be string or number)
 * @param {boolean} params.revokeMintAuthority - Whether to revoke mint authority
 * @param {boolean} params.revokeFreezeAuthority - Whether to revoke freeze authority
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

  // Convert supply to string if it's a number, then to BigInt
  const supplyBigInt = BigInt(supply.toString());

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

  // 5. Create metadata account
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
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
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
  // Constants for estimation
  const METADATA_ACCOUNT_RENT = 0.01 * LAMPORTS_PER_SOL; // Approximate metadata account rent
  const TRANSACTION_FEES = 0.005 * LAMPORTS_PER_SOL; // Approximate transaction fees
  
  try {
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);
    const totalLamports = mintRent + METADATA_ACCOUNT_RENT + TRANSACTION_FEES;
    return totalLamports / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error estimating cost:', error);
    return 0.02; // Fallback estimate
  }
}
