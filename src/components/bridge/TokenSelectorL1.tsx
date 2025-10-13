import React, { useState, useRef, useEffect } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { isAddress, getAddress } from 'viem';
import { BridgeToken, getAvailableTokensForChain, getDXGToken, isDXGToken } from '@/config/tokens_l1';

// ERC-20 ABI for getting token info
const ERC20_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface TokenSelectorL1Props {
  selectedToken: BridgeToken;
  onTokenSelect: (token: BridgeToken) => void;
  chainId: number;
  className?: string;
}

const TokenSelectorL1: React.FC<TokenSelectorL1Props> = ({
  selectedToken,
  onTokenSelect,
  chainId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [isLoadingCustomToken, setIsLoadingCustomToken] = useState(false);
  const [customTokenError, setCustomTokenError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address: userAddress } = useAccount();

  // ✅ FIXED: Get L1 tokens specifically
  const availableTokens = getAvailableTokensForChain(chainId);
  
  // ✅ SEPARATE DXG TOKEN FOR SPECIAL DISPLAY
  const dxgToken = getDXGToken();
  const isDXGAvailable = dxgToken && availableTokens.some(token => 
    token.symbol === 'DXG' && !token.isNative
  );
  
  // ✅ SEPARATE NATIVE AND ERC20 TOKENS
  const nativeTokens = availableTokens.filter(token => token.isNative);
  const erc20Tokens = availableTokens.filter(token => 
    !token.isNative && !(token.symbol === 'DXG')
  );

  // Read custom token info
  const { data: tokenName, error: nameError, isLoading: nameLoading } = useReadContract({
    address: isAddress(customTokenAddress) ? getAddress(customTokenAddress) : undefined,
    abi: ERC20_ABI,
    functionName: 'name',
    chainId,
    query: {
      enabled: isAddress(customTokenAddress) && !!chainId,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: tokenSymbol, error: symbolError, isLoading: symbolLoading } = useReadContract({
    address: isAddress(customTokenAddress) ? getAddress(customTokenAddress) : undefined,
    abi: ERC20_ABI,
    functionName: 'symbol',
    chainId,
    query: {
      enabled: isAddress(customTokenAddress) && !!chainId,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: tokenDecimals, error: decimalsError, isLoading: decimalsLoading } = useReadContract({
    address: isAddress(customTokenAddress) ? getAddress(customTokenAddress) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId,
    query: {
      enabled: isAddress(customTokenAddress) && !!chainId,
      retry: 3,
      retryDelay: 1000,
    },
  });

  const { data: tokenBalance } = useReadContract({
    address: isAddress(customTokenAddress) ? getAddress(customTokenAddress) : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId,
    query: {
      enabled: isAddress(customTokenAddress) && !!userAddress,
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomTokenAddress('');
        setCustomTokenError('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenSelect = (token: BridgeToken) => {
    onTokenSelect(token);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomTokenAddress('');
    setCustomTokenError('');
  };

  const handleCustomTokenSubmit = async () => {
    if (!customTokenAddress.trim()) {
      setCustomTokenError('Please enter a token address');
      return;
    }

    if (!isAddress(customTokenAddress)) {
      setCustomTokenError('Invalid token address');
      return;
    }

    setIsLoadingCustomToken(true);
    setCustomTokenError('');

    try {
      // Wait for contract calls to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for any errors first
      if (nameError || symbolError || decimalsError) {
        setCustomTokenError(`Contract read error. This might not be a valid ERC-20 token.`);
        setIsLoadingCustomToken(false);
        return;
      }

      // Check if still loading
      if (nameLoading || symbolLoading || decimalsLoading) {
        setCustomTokenError('Still loading token information. Please wait...');
        setIsLoadingCustomToken(false);
        return;
      }

      // Check if we have the required data
      if (!tokenSymbol || !tokenName || tokenDecimals === undefined) {
        setCustomTokenError(`Unable to read token information. This might not be a valid ERC-20 token.`);
        setIsLoadingCustomToken(false);
        return;
      }

      // Create custom token object
      const customToken: BridgeToken = {
        symbol: tokenSymbol,
        name: tokenName,
        icon: '🪙', // Default icon for custom tokens
        decimals: tokenDecimals,
        isNative: false,
        addresses: {
          [chainId]: getAddress(customTokenAddress),
        },
      };

      // Select the custom token
      onTokenSelect(customToken);
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomTokenAddress('');
      setCustomTokenError('');
    } catch (error) {
      console.error('Error reading custom token:', error);
      setCustomTokenError('Failed to read token information');
    } finally {
      setIsLoadingCustomToken(false);
    }
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0';
    const divisor = BigInt(10 ** decimals);
    const quotient = balance / divisor;
    const remainder = balance % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ✅ ENHANCED: Selected Token Display with DXG highlighting */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors min-w-[120px] ${
          isDXGToken(selectedToken, chainId) 
            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 hover:from-blue-600/30 hover:to-purple-600/30' 
            : selectedToken.isNative
              ? 'bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/50 hover:from-green-600/30 hover:to-blue-600/30'
              : 'bg-gray-600/50 hover:bg-gray-600/70 border-gray-500/50'
        }`}
      >
        <span className="text-lg">{selectedToken.icon}</span>
        <span className="font-medium text-white">{selectedToken.symbol}</span>
        {selectedToken.isNative && (
          <span className="text-xs bg-green-500/30 text-green-300 px-1 py-0.5 rounded">
            NATIVE
          </span>
        )}
        {isDXGToken(selectedToken, chainId) && (
          <span className="text-xs bg-blue-500/30 text-blue-300 px-1 py-0.5 rounded">
            BRIDGE
          </span>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ✅ ENHANCED: Dropdown Menu with organized sections */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          
          {/* ✅ NATIVE TOKENS SECTION */}
          {nativeTokens.length > 0 && (
            <>
              <div className="p-2">
                <div className="text-xs text-green-400 mb-2 px-2 flex items-center gap-2">
                  <span>⚡</span>
                  Native Token
                </div>
                {nativeTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 ${
                      selectedToken.symbol === token.symbol ? 'ring-2 ring-green-500/50' : ''
                    }`}
                  >
                    <span className="text-xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white flex items-center gap-2">
                        {token.symbol}
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                          NATIVE
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                      <div className="text-xs text-green-400 mt-1">
                        → Gas token for L1 transactions
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ DXG TOKEN SECTION (if available) */}
          {isDXGAvailable && dxgToken && (
            <>
              <div className="p-2">
                <div className="text-xs text-blue-400 mb-2 px-2 flex items-center gap-2">
                  <span>💎</span>
                  Special Bridge Token
                </div>
                <button
                  onClick={() => handleTokenSelect(dxgToken)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 ${
                    selectedToken.symbol === dxgToken.symbol ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <span className="text-xl">{dxgToken.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white flex items-center gap-2">
                      {dxgToken.symbol}
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        BRIDGE
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{dxgToken.name}</div>
                    <div className="text-xs text-blue-400 mt-1">
                      → Converts to Native DXG on L2
                    </div>
                  </div>
                </button>
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ ERC20 TOKENS SECTION */}
          {erc20Tokens.length > 0 && (
            <>
              <div className="p-2">
                <div className="text-xs text-gray-400 mb-2 px-2 flex items-center gap-2">
                  <span>🪙</span>
                  ERC-20 Tokens
                </div>
                {erc20Tokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors ${
                      selectedToken.symbol === token.symbol ? 'bg-gray-700/30' : ''
                    }`}
                  >
                    <span className="text-xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ CUSTOM TOKEN SECTION (unchanged) */}
          <div className="p-2">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors text-blue-400"
              >
                <span className="text-xl">➕</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">Add Custom Token</div>
                  <div className="text-sm text-gray-400">Enter L1 token contract address</div>
                </div>
              </button>
            ) : (
              <div className="px-3 py-3">
                <div className="text-sm text-gray-400 mb-3">Enter L1 Token Address</div>
                
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customTokenAddress}
                    onChange={(e) => {
                      setCustomTokenAddress(e.target.value);
                      setCustomTokenError('');
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {customTokenError && (
                    <div className="text-red-400 text-xs mt-1">{customTokenError}</div>
                  )}
                </div>

                {/* Loading State */}
                {isAddress(customTokenAddress) && (nameLoading || symbolLoading || decimalsLoading) && (
                  <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                      <span className="text-sm">Reading L1 token information...</span>
                    </div>
                  </div>
                )}

                {/* Token Info Display */}
                {isAddress(customTokenAddress) && tokenSymbol && tokenName && !nameLoading && !symbolLoading && !decimalsLoading && (
                  <div className="mb-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🪙</span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{tokenSymbol}</div>
                        <div className="text-sm text-gray-400">{tokenName}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Decimals: {tokenDecimals} | Chain: L1
                        </div>
                        {userAddress && tokenBalance !== undefined && (
                          <div className="text-xs text-gray-400 mt-1">
                            Balance: {formatBalance(tokenBalance, tokenDecimals || 18)} {tokenSymbol}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTokenAddress('');
                      setCustomTokenError('');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomTokenSubmit}
                    disabled={!customTokenAddress || isLoadingCustomToken || !isAddress(customTokenAddress)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    {isLoadingCustomToken ? 'Loading...' : 'Add Token'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelectorL1;