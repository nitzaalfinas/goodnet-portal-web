// Bridge dari L2 ke L1 (Withdraw)
import React, { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, parseUnits, formatUnits } from 'viem';
import { bridgeConfig } from '@/config/bridge';
import { 
  BridgeToken, 
  getNativeTokenForChain, 
  getTokenAddress, 
  isETHgToken, 
  isNativeDXGToken,
  createETHgToken,
  createBridgedToken,
  getAvailableTokensForChain // ✅ NEW: Use L2 function
} from '@/config/tokens_l2'; // ✅ FIXED: Import from tokens_l2
import { useTokenBalance, useTokenAllowance, useTokenApproval } from '@/hooks/useTokens';
import Button from '../ui/Button';
import ModalConnectWallet from '../navbar/ModalConnectWallet';
import TokenSelectorL2 from './TokenSelectorL2'; // ✅ FIXED: Import L2 selector

// Simple SVG Icon Component (sama seperti BridgeOne)
const ArrowUpDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

interface BridgeTwoProps {
  className?: string;
  onSwapDirection?: () => void; // Function to switch back to BridgeOne
}

const BridgeTwo: React.FC<BridgeTwoProps> = ({ className = '', onSwapDirection }) => {
  // ✅ FIXED: Initialize chains from config (opposite direction)
  const L2_CHAIN = bridgeConfig.chains.to;   // From L2
  const L1_CHAIN = bridgeConfig.chains.from; // To L1

  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(L2_CHAIN); // Withdraw FROM L2
  const [toChain, setToChain] = useState(L1_CHAIN);     // TO L1
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  // ✅ FIXED: Contract addresses
  const bridgeL2Address = (import.meta.env.VITE_L2_BRIDGE_ADDRESS || import.meta.env.VITE_L2_BRIDGE_CONTRACT) as `0x${string}`;

  // ✅ NEW: Get ETHg address from L2 Bridge contract
  const { data: ethgAddress } = useReadContract({
    address: bridgeL2Address,
    abi: [
      {
        name: 'ethg',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
      }
    ],
    functionName: 'ethg',
  });

  // ✅ ENHANCED: Create comprehensive L2 token list including ETHg
  const createL2TokenList = (): BridgeToken[] => {
    const tokens: BridgeToken[] = [];
    
    // 1. Get base L2 tokens from config
    const baseTokens = getAvailableTokensForChain(L2_CHAIN.id);
    tokens.push(...baseTokens);
    
    // 2. ETHg token (ERC20 on L2) - using helper
    if (ethgAddress && ethgAddress !== '0x0000000000000000000000000000000000000000') {
      const ethgToken = createETHgToken(ethgAddress as string);
      
      // Check if ETHg already exists in base tokens
      const ethgExists = tokens.some(token => isETHgToken(token));
      if (!ethgExists) {
        tokens.push(ethgToken);
      }
    }
    
    // 3. Add other bridged ERC20 tokens if needed
    // TODO: You can dynamically fetch bridged tokens from contract events
    
    return tokens;
  };

  // ✅ ENHANCED: Create L1 target token from L2 token - IMPROVED LOGIC
  const createL1TargetToken = (l2Token: BridgeToken): BridgeToken => {
    if (isETHgToken(l2Token)) {
      // ETHg on L2 -> ETH native on L1
      return {
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '⚡',
        decimals: 18,
        isNative: true,
        addresses: {
          [L1_CHAIN.id]: '0x0000000000000000000000000000000000000000', // ETH is native
          [L2_CHAIN.id]: l2Token.addresses?.[L2_CHAIN.id] || ''
        }
      };
    }
    
    if (isNativeDXGToken(l2Token)) {
      // Native DXG on L2 -> DXG ERC20 on L1
      return {
        name: 'DexGood Token',
        symbol: 'DXG',
        icon: '💎',
        decimals: 18,
        isNative: false, // DXG becomes ERC20 on L1
        addresses: {
          [L1_CHAIN.id]: import.meta.env.VITE_L1_DXG_TOKEN_ADDRESS || '',
          [L2_CHAIN.id]: '0x0000000000000000000000000000000000000000'
        }
      };
    }
    
    // For other bridged tokens, they should exist on L1 as well
    return {
      ...l2Token,
      isNative: false, // All bridged tokens are ERC20 on L1
      addresses: {
        [L1_CHAIN.id]: '', // TODO: Get L1 address from bridge mapping
        [L2_CHAIN.id]: l2Token.addresses?.[L2_CHAIN.id] || ''
      }
    };
  };

  // ✅ FIXED: Initialize tokens with default fallback to prevent null
  const [availableTokens, setAvailableTokens] = useState<BridgeToken[]>([]);
  const [fromToken, setFromToken] = useState<BridgeToken>(() => {
    // Initialize with native DXG as fallback
    try {
      return getNativeTokenForChain(L2_CHAIN.id);
    } catch {
      return {
        name: 'DexGood Token',
        symbol: 'TDXG',
        icon: '💎',
        decimals: 18,
        isNative: true,
        addresses: {
          [L2_CHAIN.id]: '0x0000000000000000000000000000000000000000',
        }
      };
    }
  });
  const [toToken, setToToken] = useState<BridgeToken>(() => {
    try {
      const nativeDXG = getNativeTokenForChain(L2_CHAIN.id);
      return createL1TargetToken(nativeDXG);
    } catch {
      return {
        name: 'DexGood Token',
        symbol: 'DXG',
        icon: '💎',
        decimals: 18,
        isNative: false,
        addresses: {
          [L1_CHAIN.id]: import.meta.env.VITE_L1_DXG_TOKEN_ADDRESS || '',
        }
      };
    }
  });

  // ✅ FIXED: Update available tokens when ethgAddress is loaded
  useEffect(() => {
    const tokens = createL2TokenList();
    setAvailableTokens(tokens);
    
    // ✅ FIXED: Only update tokens if we have new tokens and current token is still default
    if (tokens.length > 0) {
      const currentIsDefault = fromToken.symbol === 'TDXG' && fromToken.isNative;
      
      if (currentIsDefault) {
        // Try to find a better default token
        const defaultToken = tokens.find(t => t.isNative) || tokens[0];
        if (defaultToken && defaultToken.symbol !== fromToken.symbol) {
          setFromToken(defaultToken);
          setToToken(createL1TargetToken(defaultToken));
        }
      }
    }
  }, [ethgAddress]); // ✅ FIXED: Remove fromToken from dependency to prevent circular updates

  // ✅ FIXED: Now we can safely call useTokenBalance with guaranteed non-null fromToken
  const { data: balance } = useTokenBalance(
    fromToken, // This is now guaranteed to never be null
    address,
    fromChain.id
  );

  // ✅ FIXED: Smart contract interaction hooks for withdraw
  const { writeContract, isPending: isWithdrawPending, error: withdrawError, data: withdrawTxData } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxData,
  });

  // ✅ L2 Bridge ABI for withdrawals (dari withdraw-token.js)
  const BRIDGE_L2_ABI = [
    {
      name: 'withdrawERC20',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'l2Token', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      name: 'withdrawETHg',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      name: 'withdrawNativeDXG',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      name: 'ethg',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address' }]
    },
    {
      name: 'tokens',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '', type: 'address' }],
      outputs: [{ name: '', type: 'address' }]
    },
    {
      name: 'tokensReverse',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '', type: 'address' }],
      outputs: [{ name: '', type: 'address' }]
    }
  ] as const;

  // ✅ ENHANCED: Handle token selection from dropdown
  const handleFromTokenSelect = (token: BridgeToken) => {
    setFromToken(token);
    setAmount(''); // Reset amount when changing token
    
    // Set target L1 token
    const l1Token = createL1TargetToken(token);
    setToToken(l1Token);
  };

  const handleSwapChains = () => {
    // Call parent function to switch back to BridgeOne
    if (onSwapDirection) {
      onSwapDirection();
    }
  };

  const handleMaxClick = () => {
    if (balance && fromToken) {
      let maxAmount: number;
      
      if (fromToken.isNative) {
        // Reserve some native token for gas fees
        maxAmount = parseFloat(formatEther(balance));
        const reserveForGas = 0.01; // Reserve 0.01 for gas
        maxAmount = Math.max(0, maxAmount - reserveForGas);
      } else {
        // For ERC-20 tokens (including ETHg), use full balance
        maxAmount = parseFloat(formatUnits(balance, fromToken.decimals));
      }
      
      setAmount(maxAmount.toString());
    }
  };

  // ✅ ENHANCED: Implement withdraw function dengan proper L2 token handling
  const handleWithdraw = async () => {
    try {
      if (!amount || !address || !fromToken) {
        alert('Invalid amount, address, or token selection');
        return;
      }

      if (!bridgeL2Address) {
        console.error('❌ Bridge address missing:', {
          VITE_L2_BRIDGE_ADDRESS: import.meta.env.VITE_L2_BRIDGE_ADDRESS,
          VITE_L2_BRIDGE_CONTRACT: import.meta.env.VITE_L2_BRIDGE_CONTRACT
        });
        alert('L2 bridge contract address not configured');
        return;
      }

      const amountInWei = parseUnits(amount, fromToken.decimals);

      // ✅ ENHANCED: Determine withdrawal method based on token type using L2 helpers
      if (isNativeDXGToken(fromToken)) {
        // Native DXG withdrawal
        console.log('Withdrawing Native DXG');
        await writeContract({
          address: bridgeL2Address,
          abi: BRIDGE_L2_ABI,
          functionName: 'withdrawNativeDXG',
          args: [amountInWei],
          value: amountInWei,
        });
        console.log('Native DXG withdrawal initiated');
      } else if (isETHgToken(fromToken)) {
        // ✅ ENHANCED: ETHg withdrawal using contract address
        console.log('Withdrawing ETHg (L2 ERC20 Token)');
        console.log('ETHg address:', ethgAddress);
        
        if (!ethgAddress) {
          alert('ETHg address not found. Please try again.');
          return;
        }
        
        await writeContract({
          address: bridgeL2Address,
          abi: BRIDGE_L2_ABI,
          functionName: 'withdrawETHg',
          args: [amountInWei],
        });
        console.log('ETHg withdrawal initiated');
      } else {
        // ERC20 token withdrawal (other bridged tokens)
        const l2TokenAddress = getTokenAddress(fromToken, fromChain.id);
        console.log('Withdrawing ERC20 token:', l2TokenAddress);
        
        if (!l2TokenAddress || l2TokenAddress === '0x0000000000000000000000000000000000000000') {
          alert('Token address not found on L2. Make sure the token has been bridged before.');
          return;
        }

        await writeContract({
          address: bridgeL2Address,
          abi: BRIDGE_L2_ABI,
          functionName: 'withdrawERC20',
          args: [l2TokenAddress as `0x${string}`, amountInWei],
        });
        console.log('ERC20 withdrawal initiated');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      const errorMessage = error?.message || error?.reason || 'Unknown error';
      alert(`Withdrawal failed: ${errorMessage}`);
    }
  };

  const handleMainAction = async () => {
    if (!isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!isTermsAccepted) {
      alert('Please accept the Terms and Conditions');
      return;
    }

    if (!fromToken) {
      alert('Please select a token');
      return;
    }

    // Check if we're on the correct chain (L2)
    if (chain?.id !== fromChain.id) {
      try {
        await switchChain({ chainId: fromChain.id });
      } catch (error) {
        console.error('Failed to switch chain:', error);
        return;
      }
    }

    // Proceed with withdrawal
    await handleWithdraw();
  };

  // Reset form after successful withdraw
  useEffect(() => {
    if (isWithdrawSuccess) {
      // Reset form after 3 seconds
      const timer = setTimeout(() => {
        setAmount('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isWithdrawSuccess]);

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance || !fromToken) return '0';
    if (fromToken.isNative) {
      return parseFloat(formatEther(balance)).toFixed(4);
    }
    return parseFloat(formatUnits(balance, fromToken.decimals)).toFixed(4);
  };

  const isAmountValid = amount && parseFloat(amount) > 0;
  const hasInsufficientBalance = balance && amount && fromToken && 
    parseFloat(amount) > parseFloat(formatBalance(balance));

  return (
    <div className={`max-w-md mx-auto bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 ${className}`}>
      {/* From Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">From:</span>
          <span className="text-sm text-gray-400">
            Balance: {isConnected ? formatBalance(balance) : '0'} {fromToken.symbol}
          </span>
        </div>
        
        <div className="relative">
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Chain Selector */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {import.meta.env.VITE_L2_COIN_SYMBOL?.charAt(0) || 'L2'}
                    </span>
                  </div>
                  <div className="bg-transparent text-white font-medium outline-none cursor-pointer">
                    {import.meta.env.VITE_L2_NAME || 'L2 Network'}
                  </div>
                </div>
                
                {/* ✅ ENHANCED: TokenSelectorL2 with available L2 tokens including ETHg */}
                <TokenSelectorL2
                  selectedToken={fromToken}
                  onTokenSelect={handleFromTokenSelect}
                  chainId={fromChain.id}
                  className="ml-2"
                  availableTokens={availableTokens} // Pass L2-specific tokens
                />
              </div>
              
              <div className="text-right">
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-white text-2xl font-semibold text-right outline-none w-full max-w-[120px] placeholder-gray-500"
                />
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-sm text-gray-400">{fromToken.symbol}</span>
                  {isConnected && balance && Number(balance) > 0 ? (
                    <button
                      onClick={handleMaxClick}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      MAX
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapChains}
          className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-full border border-gray-600/50 transition-colors"
          title="Switch to L1 → L2 Bridge"
        >
          <ArrowUpDownIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">To:</span>
          <span className="text-sm text-gray-400">
            Receive: {amount || '0'} {toToken.symbol}
          </span>
        </div>
        
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Chain Selector */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {import.meta.env.VITE_L1_COIN_SYMBOL?.charAt(0) || 'L1'}
                  </span>
                </div>
                <div className="bg-transparent text-white font-medium outline-none cursor-pointer">
                  {import.meta.env.VITE_L1_NAME || 'L1 Network'}
                </div>
              </div>
              
              {/* ✅ ENHANCED: Token Display shows proper L1 token */}
              <div className="flex items-center gap-2 ml-2 px-3 py-2">
                <span className="text-lg">{toToken.icon}</span>
                <span className="font-medium text-white">{toToken.symbol}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-semibold text-white">
                {amount || '0'}
              </div>
              <div className="text-sm text-gray-400 mt-1">{toToken.symbol}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ENHANCED: Token Conversion Info dengan L2 helpers */}
      {isETHgToken(fromToken) && toToken.symbol === 'ETH' && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="text-sm text-blue-300">
            💡 <strong>Token Conversion:</strong> ETHg (L2) → ETH (L1)
            <br />
            <span className="text-blue-200">
              Your L2 ETHg tokens will be burned and native ETH will be released on L1
            </span>
          </div>
        </div>
      )}

      {isNativeDXGToken(fromToken) && toToken.symbol === 'DXG' && (
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="text-sm text-purple-300">
            💎 <strong>Token Conversion:</strong> TDXG Native (L2) → DXG ERC20 (L1)
            <br />
            <span className="text-purple-200">
              Your native L2 tokens will be burned and DXG ERC20 will be released on L1
            </span>
          </div>
        </div>
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-900/50 rounded text-xs text-gray-500">
          <div>ETHg Address: {ethgAddress || 'Loading...'}</div>
          <div>From Token: {fromToken.symbol} ({fromToken.isNative ? 'Native' : 'ERC20'})</div>
          <div>L2 Address: {fromToken.addresses?.[fromChain.id] || 'N/A'}</div>
          <div>Available Tokens: {availableTokens.length}</div>
          <div>Is ETHg: {isETHgToken(fromToken) ? 'Yes' : 'No'}</div>
          <div>Is Native DXG: {isNativeDXGToken(fromToken) ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Receive Address */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Receive</span>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">
            Send to custom address
          </button>
        </div>
        <div className="text-sm text-white bg-gray-700/30 p-3 rounded-lg border border-gray-600/30">
          {isConnected && address ? (
            `${address.slice(0, 6)}...${address.slice(-4)}`
          ) : (
            'Connect wallet to see address'
          )}
        </div>
      </div>

      {/* ✅ ENHANCED: Withdraw Process Steps Indicator */}
      {isConnected && isAmountValid && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div className="text-sm text-gray-300 mb-2">Withdraw Process:</div>
          <div className="flex items-center gap-4">
            {/* Step 1: Token Selection */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
              <span className="text-xs text-gray-300">Token Selected</span>
            </div>
            
            {/* Step 2: Burn L2 Tokens */}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isAmountValid ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                <span className="text-xs text-white">2</span>
              </div>
              <span className="text-xs text-gray-300">
                Burn {fromToken.symbol}
              </span>
            </div>
            
            {/* Step 3: Release L1 Tokens */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">3</span>
              </div>
              <span className="text-xs text-gray-300">
                Release {toToken.symbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isTermsAccepted}
            onChange={(e) => setIsTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">
            I have read and agree to the{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              Terms and Conditions
            </a>
          </span>
        </label>
      </div>

      {/* Withdraw Button */}
      <Button
        onClick={handleMainAction}
        disabled={
          !isAmountValid ||
          hasInsufficientBalance ||
          (isConnected && !isTermsAccepted) ||
          isWithdrawPending ||
          isWithdrawConfirming
        }
        className="w-full py-4 text-lg font-semibold"
        variant={hasInsufficientBalance ? "danger" : "primary"}
      >
        {!isConnected
          ? "Connect Wallet"
          : hasInsufficientBalance
            ? "Insufficient Balance"
            : !isAmountValid
              ? "Enter Amount"
              : !isTermsAccepted
                ? "Accept Terms to Continue"
                : isWithdrawPending
                  ? "Confirming Withdrawal..."
                  : isWithdrawConfirming
                    ? "Processing Transaction..."
                    : isWithdrawSuccess
                      ? "Withdrawal Successful!"
                      : `Withdraw ${fromToken.symbol} from L2`
        }
      </Button>

      {/* Status Messages and Info... */}
      {withdrawError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <div className="text-sm text-red-300">
            Withdrawal Error: {withdrawError.message}
          </div>
        </div>
      )}

      {isWithdrawSuccess && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
          <div className="text-sm text-green-300">
            ✅ Withdrawal successful! Your L2 {fromToken.symbol} have been burned.
            <br />
            🔄 L1 {toToken.symbol} will be released to your wallet shortly.
            {withdrawTxData && (
              <div className="mt-2">
                <a 
                  href={`${import.meta.env.VITE_L2_EXPLORER_URL}/tx/${withdrawTxData}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  View on L2 Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ ENHANCED: Withdrawal Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">Withdrawal Process:</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>1. L2 {fromToken.symbol} tokens are burned immediately</li>
          <li>2. Bridge automatically releases L1 {toToken.symbol} tokens</li>
          <li>3. You'll receive {toToken.symbol} in your L1 wallet</li>
          <li>4. Processing time: Usually 1-10 minutes</li>
        </ul>
      </div>

      {/* Connect Wallet Modal */}
      <ModalConnectWallet
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
};

export default BridgeTwo;