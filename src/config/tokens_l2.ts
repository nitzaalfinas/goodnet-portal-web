export interface BridgeToken {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  isNative: boolean;
  // ✅ FIXED: Use 'addresses' to match usage
  addresses: {
    [chainId: number]: string;
  };
}

// Get chain IDs from environment
const L1_CHAIN_ID = parseInt(import.meta.env.VITE_L1_CHAIN_ID || '11155111');
const L2_CHAIN_ID = parseInt(import.meta.env.VITE_L2_CHAIN_ID || '98765432103');
const L1_COIN_SYMBOL = import.meta.env.VITE_L1_COIN_SYMBOL || 'ETH';
const L2_COIN_SYMBOL = import.meta.env.VITE_L2_COIN_SYMBOL || 'TDXG';

// ✅ ENHANCED: Define available L2 tokens with better organization
export const BRIDGE_TOKENS_L2: BridgeToken[] = [
  // ✅ NATIVE L2 TOKEN (TDXG or similar)
  {
    symbol: L2_COIN_SYMBOL,
    name: L2_COIN_SYMBOL === 'TDXG' ? 'DexGood Token' : L2_COIN_SYMBOL,
    icon: L2_COIN_SYMBOL === 'TDXG' ? '💎' : '⚡',
    decimals: 18,
    isNative: true,
    addresses: {
      // Native tokens don't have contract addresses
      [L2_CHAIN_ID]: '0x0000000000000000000000000000000000000000',
    },
  },

  // ✅ ETHg TOKEN - WILL BE ADDED DYNAMICALLY FROM CONTRACT
  // This will be populated in the component using contract calls
  
  // ✅ BRIDGED ERC-20 TOKENS ON L2 (will have L2 addresses from bridge)
  // These are populated dynamically based on what's been bridged
];

// ✅ HELPER FUNCTIONS FOR L2 TOKENS

// Get tokens available for L2 chain (including dynamic tokens)
export const getAvailableTokensForChain = (chainId: number, dynamicTokens: BridgeToken[] = []): BridgeToken[] => {
  const allTokens = [...BRIDGE_TOKENS_L2, ...dynamicTokens];
  
  return allTokens.filter(token => {
    // Native tokens are available on their native chain
    if (token.isNative && chainId === L2_CHAIN_ID) return true;
    
    // ERC-20 tokens are available if they have an address on this chain
    return token.addresses[chainId] && token.addresses[chainId] !== '0x0000000000000000000000000000000000000000';
  });
};

// Get native token for L2 chain
export const getNativeTokenForChain = (chainId: number): BridgeToken => {
  const nativeToken = BRIDGE_TOKENS_L2.find(token => token.isNative);
  if (!nativeToken) {
    throw new Error('No native token found for L2');
  }
  return nativeToken;
};

// Get token by symbol on L2
export const getTokenBySymbol = (symbol: string, dynamicTokens: BridgeToken[] = []): BridgeToken | undefined => {
  const allTokens = [...BRIDGE_TOKENS_L2, ...dynamicTokens];
  return allTokens.find(token => token.symbol === symbol);
};

// Get token address for a specific chain
export const getTokenAddress = (token: BridgeToken, chainId: number): string | undefined => {
  if (token.isNative) return undefined; // Native tokens don't have addresses
  const address = token.addresses[chainId];
  return address && address !== '0x0000000000000000000000000000000000000000' ? address : undefined;
};

// Check if token is available on a specific chain
export const isTokenAvailableOnChain = (token: BridgeToken, chainId: number): boolean => {
  if (token.isNative && chainId === L2_CHAIN_ID) return true;
  const address = token.addresses[chainId];
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000';
};

// ✅ CREATE ETHg TOKEN HELPER
export const createETHgToken = (ethgAddress: string): BridgeToken => ({
  symbol: 'ETHg',
  name: 'Ethereum g',
  icon: '🌉',
  decimals: 18,
  isNative: false, // ETHg is ERC20 token on L2
  addresses: {
    [L2_CHAIN_ID]: ethgAddress,
    [L1_CHAIN_ID]: '0x0000000000000000000000000000000000000000' // Will be ETH native on L1
  }
});

// ✅ CREATE BRIDGED ERC20 TOKEN HELPER
export const createBridgedToken = (symbol: string, name: string, decimals: number, l2Address: string, l1Address?: string): BridgeToken => ({
  symbol,
  name,
  icon: '🪙', // Default icon for bridged tokens
  decimals,
  isNative: false,
  addresses: {
    [L2_CHAIN_ID]: l2Address,
    [L1_CHAIN_ID]: l1Address || '0x0000000000000000000000000000000000000000'
  }
});

// ✅ CHECK if token is ETHg
export const isETHgToken = (token: BridgeToken): boolean => {
  return token.symbol === 'ETHg' && !token.isNative;
};

// ✅ CHECK if token is native DXG
export const isNativeDXGToken = (token: BridgeToken): boolean => {
  return token.symbol === L2_COIN_SYMBOL && token.isNative;
};

// ✅ Get all L2 tokens (for export compatibility)
export const BRIDGE_TOKENS = BRIDGE_TOKENS_L2;