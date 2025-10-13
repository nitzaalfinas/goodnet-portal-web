export interface BridgeToken {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  isNative: boolean;
  // ✅ FIXED: Change to 'addresses' to match usage
  addresses: {
    [chainId: number]: string;
  };
}

// Get chain IDs from environment
const L1_CHAIN_ID = parseInt(import.meta.env.VITE_L1_CHAIN_ID || '11155111');
const L2_CHAIN_ID = parseInt(import.meta.env.VITE_L2_CHAIN_ID || '98765432103');
const L1_COIN_SYMBOL = import.meta.env.VITE_L1_COIN_SYMBOL || 'ETH';
const L2_COIN_SYMBOL = import.meta.env.VITE_L2_COIN_SYMBOL || 'TDXG';

// Get DXG token address from environment
const DXG_TOKEN_ADDRESS = import.meta.env.VITE_L1_DXG_TOKEN_ADDRESS;

// ✅ ENHANCED: Define available L1 tokens with better organization
export const BRIDGE_TOKENS_L1: BridgeToken[] = [
  // ✅ NATIVE L1 TOKEN (ETH or similar)
  {
    symbol: L1_COIN_SYMBOL,
    name: L1_COIN_SYMBOL === 'ETH' ? 'Ethereum' : L1_COIN_SYMBOL,
    icon: L1_COIN_SYMBOL === 'ETH' ? '⚡' : '💎',
    decimals: 18,
    isNative: true,
    addresses: {
      // Native tokens don't have contract addresses
      [L1_CHAIN_ID]: '0x0000000000000000000000000000000000000000',
    },
  },

  // ✅ DXG TOKEN (if address is provided) - SPECIAL BRIDGE TOKEN
  ...(DXG_TOKEN_ADDRESS ? [{
    symbol: 'DXG',
    name: 'DexGood Token',
    icon: '💎',
    decimals: 18,
    isNative: false,
    addresses: {
      [L1_CHAIN_ID]: DXG_TOKEN_ADDRESS,
    },
  }] : []),
  
  // ✅ COMMON ERC-20 TOKENS (Sepolia testnet addresses)
  ...(L1_CHAIN_ID === 11155111 ? [
    {
      symbol: 'USDT',
      name: 'Tether USD',
      icon: '₮',
      decimals: 6,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0x7169D38820dfd117C3FA1f22a697dba58d90BA06',
      },
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '◉',
      decimals: 6,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      },
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      icon: '🔷',
      decimals: 18,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      },
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      icon: '◈',
      decimals: 18,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
      },
    },
  ] : []),

  // ✅ MAINNET TOKENS (if L1 is mainnet)
  ...(L1_CHAIN_ID === 1 ? [
    {
      symbol: 'USDT',
      name: 'Tether USD',
      icon: '₮',
      decimals: 6,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      },
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '◉',
      decimals: 6,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0xA0b86a33E6441c8C616f0c96f95E0cc79823c744',
      },
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      icon: '🔷',
      decimals: 18,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      },
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      icon: '◈',
      decimals: 18,
      isNative: false,
      addresses: {
        [L1_CHAIN_ID]: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      },
    },
  ] : []),
];

// ✅ HELPER FUNCTIONS FOR L1 TOKENS

// Get tokens available for L1 chain
export const getAvailableTokensForChain = (chainId: number): BridgeToken[] => {
  return BRIDGE_TOKENS_L1.filter(token => {
    // Native tokens are available on their native chain
    if (token.isNative && chainId === L1_CHAIN_ID) return true;
    
    // ERC-20 tokens are available if they have an address on this chain
    return token.addresses[chainId] && token.addresses[chainId] !== '0x0000000000000000000000000000000000000000';
  });
};

// ✅ GET DXG TOKEN SPECIFICALLY
export const getDXGToken = (): BridgeToken | undefined => {
  return BRIDGE_TOKENS_L1.find(token => 
    token.symbol === 'DXG' && !token.isNative
  );
};

// Get native token for L1 chain
export const getNativeTokenForChain = (chainId: number): BridgeToken => {
  const nativeToken = BRIDGE_TOKENS_L1.find(token => token.isNative);
  if (!nativeToken) {
    throw new Error('No native token found for L1');
  }
  return nativeToken;
};

// Get token by symbol on L1
export const getTokenBySymbol = (symbol: string): BridgeToken | undefined => {
  return BRIDGE_TOKENS_L1.find(token => token.symbol === symbol);
};

// Get token address for a specific chain
export const getTokenAddress = (token: BridgeToken, chainId: number): string | undefined => {
  if (token.isNative) return undefined; // Native tokens don't have addresses
  const address = token.addresses[chainId];
  return address && address !== '0x0000000000000000000000000000000000000000' ? address : undefined;
};

// Check if token is available on a specific chain
export const isTokenAvailableOnChain = (token: BridgeToken, chainId: number): boolean => {
  if (token.isNative && chainId === L1_CHAIN_ID) return true;
  const address = token.addresses[chainId];
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000';
};

// ✅ CHECK if token is DXG token
export const isDXGToken = (token: BridgeToken, chainId: number): boolean => {
  const dxgToken = getDXGToken();
  if (!dxgToken) return false;
  
  // Compare by symbol and non-native status
  if (token.symbol === 'DXG' && !token.isNative) {
    const tokenAddress = getTokenAddress(token, chainId);
    const dxgAddress = getTokenAddress(dxgToken, chainId);
    return tokenAddress?.toLowerCase() === dxgAddress?.toLowerCase();
  }
  
  return false;
};

// ✅ Get all L1 tokens (for export compatibility)
export const BRIDGE_TOKENS = BRIDGE_TOKENS_L1;