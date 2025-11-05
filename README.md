# learnFront

A Next.js application for creating fungible SPL tokens on Solana with proper Metaplex metadata.

## Features

- 🪙 Create fungible SPL tokens (not NFTs) with proper metadata
- 📤 Upload token logos and metadata to IPFS via Pinata
- ✅ Automatic verification of SPL token metadata structure
- 💼 Wallet integration using Solana Wallet Adapter
- 🔍 View created tokens on Solscan
- 📝 Transaction metadata (memo) for improved traceability on block explorers

## What Makes This an SPL Token (Not an NFT)?

The tokens created by this application are **fungible SPL tokens** with the following characteristics:

- `tokenStandard: 2` (Fungible) - Explicitly set using `SetTokenStandard` instruction
- `editionNonce: 255 or 251` (No edition) - Fungible tokens don't have editions
- `sellerFeeBasisPoints: 0` - No royalties (NFT-specific feature)
- `creators: null` - No creator attribution (NFT-specific)
- `collection: null` - Not part of an NFT collection
- `decimals > 0` - Allows fractional amounts (NFTs have decimals=0)
- `supply > 1` - Can mint multiple tokens (NFTs have supply=1)

The application uses the `SetTokenStandard` instruction to explicitly mark tokens as fungible, ensuring proper identification by blockchain explorers like Solscan.

See [METADATA_STRUCTURE.md](./METADATA_STRUCTURE.md) for detailed documentation.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
```

## Project Structure

```
.
├── components/          # React components
├── pages/              # Next.js pages
├── utils/              # Utility functions
│   └── tokenCreation.js  # SPL token creation and verification
├── styles/             # CSS styles
├── examples/           # Example scripts
│   └── verifyTokenMetadata.js  # CLI tool to verify token metadata
├── METADATA_STRUCTURE.md  # Detailed metadata documentation
└── public/             # Static assets
```

## Verifying Token Metadata

After creating a token, you can verify its metadata structure using the provided CLI tool:

```bash
node examples/verifyTokenMetadata.js <MINT_ADDRESS>
```

This will check that the token has correct SPL token metadata and is not configured as an NFT.

## Key Functions

### `createTokenWithMetadata()`

Creates a new fungible SPL token with Metaplex metadata.

The function automatically includes a memo instruction in the transaction that describes
the token being created. This memo is visible on block explorers like Solscan and helps
identify the purpose of the transaction.

```javascript
const result = await createTokenWithMetadata({
  connection,
  wallet,
  name: "My Token",
  symbol: "MTK",
  uri: "https://gateway.pinata.cloud/ipfs/...",
  decimals: 9,
  supply: 1000000,
  revokeMintAuthority: false,
  revokeFreezeAuthority: false,
});
```

### `verifySPLTokenMetadata()`

Verifies that a token has correct SPL token metadata structure.

```javascript
const verification = await verifySPLTokenMetadata(connection, mintAddress);
if (verification.isValid) {
  console.log("✅ Valid SPL token metadata");
} else {
  console.log("❌ Issues:", verification.errors);
}
```

## Documentation

- [METADATA_STRUCTURE.md](./METADATA_STRUCTURE.md) - Complete documentation of SPL token vs NFT metadata
- [examples/README.md](./examples/README.md) - Usage examples and CLI tools

## Network

Currently configured for Solana **Devnet**. Tokens can be viewed on [Solscan Devnet](https://solscan.io/?cluster=devnet).

## License

MIT