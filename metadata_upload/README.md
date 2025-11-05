# Metadata Upload for Existing Tokens

This directory contains utilities and components for adding or updating metadata for existing SPL tokens on Solana.

## Overview

The metadata upload feature allows users to:
- Add metadata (name, symbol, logo) to tokens created without metadata
- Update existing metadata for tokens (if the metadata is mutable and the user is the update authority)
- Check if metadata exists for a given token

## Files

### `updateMetadata.js`
Utility module containing core functions for metadata management:

- **`checkMetadataExists(connection, mintAddress)`** - Check if metadata exists for a token
- **`createMetadataForExistingToken(...)`** - Create new metadata for a token that doesn't have metadata
- **`updateMetadataForExistingToken(...)`** - Update existing metadata (requires update authority)

### Page: `/pages/metadata-upload.jsx`
Web interface for metadata upload functionality:
- Token verification by mint address
- Logo upload to IPFS via Pinata
- Metadata creation/update
- Wallet connection integration

## Usage

### Check if Metadata Exists

```javascript
import { checkMetadataExists } from '../metadata_upload/updateMetadata';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const result = await checkMetadataExists(connection, 'MINT_ADDRESS_HERE');

if (result.exists) {
  console.log('Metadata exists:', result.metadata);
} else {
  console.log('No metadata found');
}
```

### Create Metadata for Existing Token

```javascript
import { createMetadataForExistingToken } from '../metadata_upload/updateMetadata';

const result = await createMetadataForExistingToken({
  connection,
  wallet: { publicKey, signTransaction },
  mintAddress: 'YOUR_TOKEN_MINT_ADDRESS',
  name: 'My Token',
  symbol: 'MTK',
  uri: 'https://gateway.pinata.cloud/ipfs/QmXXXXX', // Points to JSON metadata
});

console.log('Metadata created:', result.metadataAddress);
console.log('Transaction:', result.signature);
```

### Update Existing Metadata

```javascript
import { updateMetadataForExistingToken } from '../metadata_upload/updateMetadata';

const result = await updateMetadataForExistingToken({
  connection,
  wallet: { publicKey, signTransaction },
  mintAddress: 'YOUR_TOKEN_MINT_ADDRESS',
  name: 'Updated Token Name',
  symbol: 'UMTK',
  uri: 'https://gateway.pinata.cloud/ipfs/QmYYYYY',
});

console.log('Metadata updated. Transaction:', result.signature);
```

## Requirements

- The wallet must have enough SOL to pay for transaction fees (~0.005 SOL)
- For creating metadata: The wallet must be the mint authority of the token
- For updating metadata: The wallet must be the update authority and metadata must be mutable

## Web Interface

Visit `/metadata-upload` to use the web interface:

1. Connect your wallet
2. Enter the token mint address
3. Click "Check" to verify the token and see existing metadata
4. Upload a logo image (will be stored on IPFS via Pinata)
5. Fill in the token name, symbol, and description
6. Click "Create/Update Metadata" to apply changes

## Metadata Structure

The metadata JSON uploaded to IPFS follows the Metaplex Token Metadata standard:

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

## On-Chain Metadata

The on-chain metadata account is created using Metaplex's Token Metadata program with:
- `tokenStandard: 2` (Fungible) for SPL tokens
- `isMutable: true` (allows future updates)
- `sellerFeeBasisPoints: 0` (no royalties for fungible tokens)
- `creators: null` (not used for fungible tokens)
- `collection: null` (not used for fungible tokens)

## Error Handling

The utilities handle common errors:
- Token mint not found
- Metadata already exists (when trying to create)
- Metadata doesn't exist (when trying to update)
- Not the update authority (when trying to update)
- Metadata is immutable (when trying to update)

## Network

Currently configured for Solana **Devnet**. Tokens can be viewed on [Solscan Devnet](https://solscan.io/?cluster=devnet).

## See Also

- [METADATA_STRUCTURE.md](../METADATA_STRUCTURE.md) - Complete documentation of SPL token metadata
- [Metaplex Token Metadata Program](https://docs.metaplex.com/programs/token-metadata/)
