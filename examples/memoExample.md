# Transaction Memo Example

## Overview

When creating a token with the `createTokenWithMetadata()` function, a memo instruction is automatically added to the transaction. This memo provides human-readable metadata about the transaction.

## Memo Format

The memo follows this format:
```
Creating SPL Token: {TokenName} ({SYMBOL}) - Supply: {supply}, Decimals: {decimals}
```

## Example

For a token with the following parameters:
- Name: "My Token"
- Symbol: "MTK"
- Supply: 1000000
- Decimals: 9

The memo will be:
```
Creating SPL Token: My Token (MTK) - Supply: 1000000, Decimals: 9
```

## Viewing the Memo

The memo can be viewed on block explorers like Solscan:

1. After creating a token, click the transaction link to view it on Solscan
2. In the transaction details, look for the "Memo" instruction
3. The memo text will be displayed in the instruction details

## Benefits

- **Traceability**: Easy to identify what a transaction does at a glance
- **Debugging**: Helps track down specific token creation transactions
- **Documentation**: The transaction itself documents what it does
- **User Experience**: Users can verify the transaction contents before signing

## Technical Details

The memo is implemented using the Solana SPL Memo program (`@solana/spl-memo`). The memo instruction:
- Is added as the first instruction in the transaction
- Uses the `createMemoInstruction` function
- Is signed by the wallet's public key
- Has zero cost (it doesn't consume additional compute units beyond the base transaction cost)
- Is permanently stored on the blockchain

## Code Example

```javascript
import { createMemoInstruction } from '@solana/spl-memo';

// Create memo text
const memoText = `Creating SPL Token: ${name} (${symbol}) - Supply: ${supply}, Decimals: ${decimals}`;

// Add to transaction
transaction.add(
  createMemoInstruction(memoText, [wallet.publicKey])
);
```

## Notes

- The memo is limited to a reasonable length to avoid transaction size issues
- The memo is publicly visible on the blockchain
- The memo does not affect the token creation process or its functionality
