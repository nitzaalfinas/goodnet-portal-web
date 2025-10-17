import React, { useState, useRef, useEffect } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { isAddress, getAddress } from 'viem';
import { 
  BridgeToken, 
  getAvailableTokensForChain, 
  isETHgToken, 
  isNativeDXGToken,
  createBridgedToken 
} from '@/config/tokens_l2';

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

interface TokenSelectorL2Props {
  selectedToken: BridgeToken;
  onTokenSelect: (token: BridgeToken) => void;
  chainId: number;
  className?: string;
  availableTokens?: BridgeToken[]; // Pass dynamic tokens from parent
}

const TokenSelectorL2: React.FC<TokenSelectorL2Props> = ({
  selectedToken,
  onTokenSelect,
  chainId,
  className = '',
  availableTokens = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [isLoadingCustomToken, setIsLoadingCustomToken] = useState(false);
  const [customTokenError, setCustomTokenError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address: userAddress } = useAccount();
  const [nativeTokens, setNativeTokens] = useState<BridgeToken[]>([]);
  const [ethgTokens, setEthgTokens] = useState<BridgeToken[]>([]);
  const [bridgedTokens, setBridgedTokens] = useState<BridgeToken[]>([]);

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

      // Create custom token object using helper
      const customToken = createBridgedToken(
        tokenSymbol,
        tokenName,
        tokenDecimals,
        getAddress(customTokenAddress)
      );

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

  useEffect(() => {
    // ✅ FIXED: Get L2 tokens specifically including dynamic tokens
    const allAvailableTokens = getAvailableTokensForChain(chainId, availableTokens);
    
    // ✅ SEPARATE DIFFERENT TYPES OF TOKENS
    const nativeTokensFiltered = allAvailableTokens.filter(token => token.isNative);
    const ethgTokensFiltered = allAvailableTokens.filter(token => isETHgToken(token));
    const bridgedTokensFiltered = allAvailableTokens.filter(token => 
      !token.isNative && !isETHgToken(token)
    );

    setNativeTokens(nativeTokensFiltered);
    setEthgTokens(ethgTokensFiltered);
    setBridgedTokens(bridgedTokensFiltered);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ✅ ENHANCED: Selected Token Display with L2-specific highlighting */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors min-w-[120px] ${
          isETHgToken(selectedToken) 
            ? 'bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border-orange-500/50 hover:from-orange-600/30 hover:to-yellow-600/30' 
            : selectedToken.isNative
              ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 hover:from-purple-600/30 hover:to-pink-600/30'
              : 'bg-gray-600/50 hover:bg-gray-600/70 border-gray-500/50'
        }`}
      >
        <span className="text-lg">{selectedToken.icon}</span>
        <span className="font-medium text-white">{selectedToken.symbol}</span>
        {selectedToken.isNative && (
          <span className="text-xs bg-purple-500/30 text-purple-300 px-1 py-0.5 rounded">
            NATIVE
          </span>
        )}
        {isETHgToken(selectedToken) && (
          <span className="text-xs bg-orange-500/30 text-orange-300 px-1 py-0.5 rounded">
            WRAPPED
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

      {/* ✅ ENHANCED: Dropdown Menu with L2-specific sections */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          
          {/* ✅ NATIVE L2 TOKENS SECTION */}
          {nativeTokens.length > 0 && (
            <>
              <div className="p-2">
                <div className="text-xs text-purple-400 mb-2 px-2 flex items-center gap-2">
                  <span>💎</span>
                  Native L2 Token
                </div>
                {nativeTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 ${
                      selectedToken.symbol === token.symbol ? 'ring-2 ring-purple-500/50' : ''
                    }`}
                  >
                    <span className="text-xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white flex items-center gap-2">
                        {token.symbol}
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                          NATIVE
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                      <div className="text-xs text-purple-400 mt-1">
                        → Gas token for L2 transactions
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ ETHg TOKEN SECTION (if available) */}
          {ethgTokens.length > 0 && (
            <>
              <div className="p-2">
                <div className="text-xs text-orange-400 mb-2 px-2 flex items-center gap-2">
                  <span>🌉</span>
                  Wrapped ETH on L2
                </div>
                {ethgTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 ${
                      selectedToken.symbol === token.symbol ? 'ring-2 ring-orange-500/50' : ''
                    }`}
                  >
                    <span className="text-xl">{token.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white flex items-center gap-2">
                        {token.symbol}
                        <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                          WRAPPED
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                      <div className="text-xs text-orange-400 mt-1">
                        → Converts back to ETH on L1
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ BRIDGED ERC20 TOKENS SECTION */}
          {bridgedTokens.length > 0 && (
            <>
              <div className="p-2">
                <div className="text-xs text-gray-400 mb-2 px-2 flex items-center gap-2">
                  <span>🔗</span>
                  Bridged Tokens
                </div>
                {bridgedTokens.map((token) => (
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
                      <div className="text-xs text-gray-500 mt-1">
                        Bridged from L1
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 my-2"></div>
            </>
          )}

          {/* ✅ CUSTOM TOKEN SECTION */}
          <div className="p-2">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors text-blue-400"
              >
                <span className="text-xl">➕</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">Add Custom Token</div>
                  <div className="text-sm text-gray-400">Enter L2 token contract address</div>
                </div>
              </button>
            ) : (
              <div className="px-3 py-3">
                <div className="text-sm text-gray-400 mb-3">Enter L2 Token Address</div>
                
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
                      <span className="text-sm">Reading L2 token information...</span>
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
                          Decimals: {tokenDecimals} | Chain: L2
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

export default TokenSelectorL2;