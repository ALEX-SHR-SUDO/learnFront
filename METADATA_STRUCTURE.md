# SPL Token Metadata Structure

This document describes the correct metadata structure for SPL tokens (not NFTs) created by this application.

## Overview

This application creates **fungible SPL tokens** with Metaplex metadata, NOT NFTs. The key differences are:

- **SPL Token**: `tokenStandard=2` (Fungible), decimals > 0, supply > 1
- **NFT**: `tokenStandard=0` (NonFungible), decimals=0, supply=1, has creators/collection

## Off-Chain Metadata (JSON uploaded to IPFS/Pinata)

The JSON metadata file uploaded to Pinata follows the Metaplex Token Metadata standard:

```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "description": "Token description",
  "image": "https://gateway.pinata.cloud/ipfs/QmXXXXXXXXXX",
  "properties": {
    "files": [
      {
        "uri": "https://gateway.pinata.cloud/ipfs/QmXXXXXXXXXX",
        "type": "image/png"
      }
    ],
    "category": "image"
  }
}
```

### Fields Explanation

- `name`: Token name (max 32 characters)
- `symbol`: Token symbol (max 10 characters)
- `description`: Optional token description (max 200 characters)
- `image`: URL to token logo image on IPFS
- `properties.files`: Array of file references (required for proper display in wallets)
- `properties.category`: Category of the asset (typically "image" for tokens with logos)

### What's NOT included (NFT-specific fields):

- `seller_fee_basis_points` - This is set on-chain, not in JSON
- `creators` - NFT-specific field
- `collection` - NFT-specific field
- `attributes` - Typically used for NFTs with traits

## On-Chain Metadata (Solana Account)

The on-chain metadata is created using `createCreateMetadataAccountV3Instruction` followed by `createSetTokenStandardInstruction` from `@metaplex-foundation/mpl-token-metadata`.

The `SetTokenStandard` instruction explicitly sets the token standard to Fungible (2), ensuring that blockchain explorers like Solscan correctly identify the token as a fungible SPL token rather than an NFT.

### Structure of On-Chain Metadata Account

```javascript
{
  key: 4,                          // Metadata V1 key
  updateAuthority: "PublicKey",    // Authority that can update metadata
  mint: "PublicKey",               // Mint address of the token
  data: {
    name: "Token Name",
    symbol: "TKN",
    uri: "https://gateway.pinata.cloud/ipfs/QmXXXX", // Points to off-chain JSON
    sellerFeeBasisPoints: 0        // Always 0 for SPL tokens
  },
  primarySaleHappened: 0,          // Not applicable for fungible tokens
  isMutable: 0,                    // Metadata cannot be changed
  editionNonce: 255,               // 255 or 251 = no edition (fungible token)
  tokenStandard: 2,                // 2 = Fungible (SPL token)
  collection: null,                // Null for SPL tokens (NFT-specific)
  uses: null                       // Null for SPL tokens (NFT-specific)
}
```

### Field Explanations

#### tokenStandard
- `0` = NonFungible (NFT)
- `1` = FungibleAsset (Programmable NFT)
- `2` = **Fungible (SPL Token)** ← This is what we create
- `3` = NonFungibleEdition (NFT Print)
- `4` = ProgrammableNonFungible

#### editionNonce
- `255` = No edition (standard for fungible tokens)
- `251` = Alternative value for fungible tokens
- Other values indicate NFT editions

#### isMutable
- `0` = Immutable (metadata cannot be changed after creation)
- `1` = Mutable (metadata can be updated)

For SPL tokens, we set `isMutable: false` to prevent future changes.

#### sellerFeeBasisPoints
- Always `0` for SPL tokens
- For NFTs, this represents royalty percentage (e.g., 500 = 5%)

#### creators
- `null` for SPL tokens
- For NFTs, contains array of creator addresses and their shares

#### collection
- `null` for SPL tokens
- For NFTs, contains collection reference

#### uses
- `null` for SPL tokens
- For NFTs, contains usage limitations (e.g., limited number of uses)

## Verification

The application includes a `verifySPLTokenMetadata()` function that checks:

1. ✅ `tokenStandard` is `2` (Fungible)
2. ✅ `editionNonce` is `255` or `251` (no edition)
3. ✅ `sellerFeeBasisPoints` is `0`
4. ✅ `collection` is `null` (not an NFT collection)
5. ✅ `uses` is `null` (no usage limits)

## Example: Correct SPL Token Metadata

Here's an example of correctly created SPL token metadata:

```javascript
{
  key: 4,
  updateAuthority: "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM",
  mint: "FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump",
  data: {
    name: "jelly-my-jelly",
    symbol: "jellyjelly",
    uri: "https://ipfs.io/ipfs/QmRaah2aa24T3F2hGQCf8XefSuaNFZM2wGx2W2UnsxfLxM",
    sellerFeeBasisPoints: 0
  },
  primarySaleHappened: 0,
  isMutable: 0,
  editionNonce: 251,
  tokenStandard: 2,                // ← Fungible SPL Token
  collection: null,
  uses: null
}
```

## Example: Incorrect NFT Metadata (What We DON'T Want)

This is what NFT metadata looks like (which we specifically avoid):

```javascript
{
  mint: "5BXiaC7fZrhd7ZP92hKkXnNz3GoDddzhdp4nwKv9tVHN",
  updateAuthority: "3BhAs81UADgfpvZaHX1jV6mMRejnsK1t2xMWPopA2sQV",
  data: {
    name: "popa",
    symbol: "pop",
    uri: "https://gateway.pinata.cloud/ipfs/QmVN5byDFrQLKy43dmfnnQ1zG33Ak2EDQN7QKTtnuv4DT5",
    creators: [],                   // ← NFT field
    sellerFeeBasisPoints: 0
  },
  edition: {                        // ← NFT field
    maxSupply: undefined,
    supply: undefined
  },
  collection: {                     // ← NFT field
    key: undefined
  }
}
```

## References

- [Metaplex Token Metadata Standard](https://docs.metaplex.com/programs/token-metadata/)
- [Solana SPL Token Program](https://spl.solana.com/token)
- [Token Metadata Program on Solana](https://github.com/metaplex-foundation/mpl-token-metadata)
