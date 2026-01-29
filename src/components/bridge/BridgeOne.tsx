// Maksudnya adalah Bridge dari L1 ke L2
import React, { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseUnits, formatUnits } from 'viem';
import { bridgeConfig } from '@/config/bridge';
import { BridgeToken, getNativeTokenForChain, getTokenAddress, isDXGToken } from '@/config/tokens_l1';
import { useTokenBalance, useTokenAllowance, useTokenApproval } from '@/hooks/useTokens';
import Button from '../ui/Button';
import ModalConnectWallet from '../navbar/ModalConnectWallet';
import TokenSelector from './TokenSelectorL1';
// Import chains from config if needed
// import { getL1Chain, getL2Chain } from '../../config/chains';

// Simple SVG Icon Component
const ArrowUpDownIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

interface BridgeProps {
  className?: string;
  onSwapDirection?: () => void; // Function to switch to BridgeTwo
}

const BridgeOne: React.FC<BridgeProps> = ({ className = '', onSwapDirection }) => {
  // Initialize chains from config
  const L1_CHAIN = bridgeConfig.chains.from;
  const L2_CHAIN = bridgeConfig.chains.to;

  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(L1_CHAIN);
  const [toChain, setToChain] = useState(L2_CHAIN);
  const [fromToken, setFromToken] = useState<BridgeToken>(getNativeTokenForChain(L1_CHAIN.id));
  const [toToken, setToToken] = useState<BridgeToken>(getNativeTokenForChain(L2_CHAIN.id));
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Get token balance for the current chain
  const { data: balance } = useTokenBalance(
    fromToken,
    address,
    fromChain.id
  );

  // Token approval hooks (only for ERC-20 tokens)
  const bridgeContractAddress = (import.meta.env.VITE_L1_BRIDGE_CONTRACT || '') as `0x${string}`;

  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(
    fromToken,
    address,
    bridgeContractAddress,
    fromChain.id
  );
  const { approve, isPending: isApproving, isSuccess: isApprovalSuccess } = useTokenApproval();

  // Smart contract interaction hooks
  const { writeContract, isPending: isDepositPending, error: depositError, data: depositTxData } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxData,
  });

  const handleFromTokenSelect = (token: BridgeToken) => {
    setFromToken(token);
    setAmount(''); // Reset amount when changing token
    
    // Automatically set the same token for "To" section
    setToToken(token);
  };

  const handleSwapChains = () => {
    // Call parent function to switch to BridgeTwo
    if (onSwapDirection) {
      onSwapDirection();
    }
  };  const handleMaxClick = () => {
    if (balance) {
      let maxAmount: number;
      
      if (fromToken.isNative) {
        // Reserve some native token for gas fees
        maxAmount = parseFloat(formatEther(balance));
        const reserveForGas = 0.01; // Reserve 0.01 for gas
        maxAmount = Math.max(0, maxAmount - reserveForGas);
      } else {
        // For ERC-20 tokens, use full balance
        maxAmount = parseFloat(formatUnits(balance, fromToken.decimals));
      }
      
      setAmount(maxAmount.toString());
    }
  };

    const handleApprove = async () => {
    if (!fromToken.isNative && amount) {
      const tokenAddress = getTokenAddress(fromToken, fromChain.id);
      if (tokenAddress) {
        const amountToApprove = parseUnits(amount, fromToken.decimals);
        await approve(tokenAddress as `0x${string}`, bridgeContractAddress, amountToApprove);
      }
    }
  };

  // Bridge L1 ABI - Add depositDXG function
  const BRIDGE_L1_ABI = [
    {
      name: 'depositETH',
      type: 'function',
      stateMutability: 'payable',
      inputs: [],
      outputs: []
    },
    {
      name: 'depositERC20',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      name: 'depositDXG',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'amount', type: 'uint256' }
      ],
      outputs: []
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'depositId', type: 'uint256' },
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' }
      ],
      name: 'DepositETH',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'depositId', type: 'uint256' },
        { indexed: true, name: 'user', type: 'address' },
        { indexed: true, name: 'token', type: 'address' },
        { indexed: false, name: 'amount', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' }
      ],
      name: 'DepositERC20',
      type: 'event'
    },
    // ✅ ADD DXG DEPOSIT EVENT
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'depositId', type: 'uint256' },
        { indexed: true, name: 'user', type: 'address' },
        { indexed: false, name: 'amountReceived', type: 'uint256' },
        { indexed: false, name: 'nonce', type: 'uint256' },
        { indexed: false, name: 'timestamp', type: 'uint256' }
      ],
      name: 'DepositDXG',
      type: 'event'
    }
  ] as const;

  const handleDeposit = async () => {
    try {
      if (!amount || !address) {
        alert('Invalid amount or address');
        return;
      }

      if (!bridgeContractAddress) {
        alert('Bridge contract address not configured');
        return;
      }

      const amountInWei = parseUnits(amount, fromToken.decimals);

      if (fromToken.isNative) {
        // Deposit native ETH
        await writeContract({
          address: bridgeContractAddress,
          abi: BRIDGE_L1_ABI,
          functionName: 'depositETH',
          value: amountInWei,
        });
        console.log('ETH Deposit transaction initiated');
      } else {
        // ✅ CHECK IF THIS IS DXG TOKEN using helper function
        if (isDXGToken(fromToken, fromChain.id)) {
          // Use dedicated DXG deposit function
          await writeContract({
            address: bridgeContractAddress,
            abi: BRIDGE_L1_ABI,
            functionName: 'depositERC20', // Use regular ERC20 function, backend will detect
            args: [getTokenAddress(fromToken, fromChain.id) as `0x${string}`, amountInWei],
          });
          console.log('DXG Deposit transaction initiated');
        } else {
          // Regular ERC20 deposit
          await writeContract({
            address: bridgeContractAddress,
            abi: BRIDGE_L1_ABI,
            functionName: 'depositERC20',
            args: [getTokenAddress(fromToken, fromChain.id) as `0x${string}`, amountInWei],
          });
          console.log('ERC20 Deposit transaction initiated');
        }
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      const errorMessage = error?.message || error?.reason || 'Unknown error';
      alert(`Deposit failed: ${errorMessage}`);
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

    // Check if we're on the correct chain (L1)
    if (chain?.id !== fromChain.id) {
      try {
        await switchChain({ chainId: fromChain.id });
      } catch (error) {
        console.error('Failed to switch chain:', error);
        return;
      }
    }

    // Step 1: If ERC-20 token needs approval, do approval first
    if (!fromToken.isNative && needsApproval) {
      await handleApprove();
      return;
    }

    // Step 2: If approved or native token, proceed with deposit
    await handleDeposit();
  };

  // Check if approval is needed
  useEffect(() => {
    if (!fromToken.isNative && amount && allowance !== undefined && allowance !== null) {
      const amountBigInt = parseUnits(amount, fromToken.decimals);
      const allowanceBigInt = BigInt(allowance.toString());
      setNeedsApproval(allowanceBigInt < amountBigInt);
      setIsApproved(allowanceBigInt >= amountBigInt);
    } else {
      setNeedsApproval(false);
      setIsApproved(fromToken.isNative); // native token tidak perlu approve
    }
  }, [fromToken, amount, allowance]);

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Reset form after successful deposit
  useEffect(() => {
    if (isDepositSuccess) {
      // Reset form after 3 seconds
      const timer = setTimeout(() => {
        setAmount('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess]);

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    if (fromToken.isNative) {
      return parseFloat(formatEther(balance)).toFixed(4);
    }
    return parseFloat(formatUnits(balance, fromToken.decimals)).toFixed(4);
  };

  const isAmountValid = amount && parseFloat(amount) > 0;
  const hasInsufficientBalance = balance && amount && 
    parseFloat(amount) > parseFloat(formatBalance(balance));

  return (
    <div className={`max-w-xl mx-auto bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50 ${className}`}>
      

      {/* From Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">From</span>

            {/* Chain Selector */}
            <div className='bg-gray-800/50 border border-gray-600/50 rounded-full px-2.5 py-2 flex items-center justify-center gap-2'>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {import.meta.env.VITE_L1_COIN_SYMBOL?.charAt(0) || 'L1'}
                </span>
              </div>
              <div className="text-white font-medium">
                {import.meta.env.VITE_L1_NAME || 'L1 Network'}
              </div>
            </div>
          </div>
          <div>
            <span className="text-gray-400 mr-1">Balance: </span>
            <span className="text-white">{isConnected ? formatBalance(balance) : '0'} {fromToken.symbol}</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
            <div className="flex">
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-white text-2xl font-semibold outline-none w-full placeholder-gray-500"
              />

              {/* Token Selector */}
              <TokenSelector
                selectedToken={fromToken}
                onTokenSelect={handleFromTokenSelect}
                chainId={fromChain.id}
                className="ml-2"
              />
            </div>
            
            {isConnected && balance && Number(balance) > 0 ? (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleMaxClick}
                  className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                >
                  MAX
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapChains}
          className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-full border border-gray-600/50 transition-colors"
          title="Switch to L2 → L1 Bridge"
        >
          <ArrowUpDownIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">To</span>

            {/* Chain Selector */}
            <div className='bg-gray-800/50 border border-gray-600/50 rounded-full px-2.5 py-2 flex items-center justify-center gap-2'>
            <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {import.meta.env.VITE_L2_COIN_SYMBOL?.charAt(0) || 'L2'}
              </span>
            </div>
            <div className="text-white font-medium">
              {import.meta.env.VITE_L2_NAME || 'L2 Network'}
            </div>
            </div>
          </div>
          <div>
            <span className="text-gray-400 mr-1">Receive: </span>
            <span className='text-white'>{amount || '0'} {toToken.symbol}</span>
          </div>
        </div>
        
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
          <div className="flex">
            <div className='flex-1'>
              <span className="text-2xl font-semibold text-white">
                {amount || '0'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Token Display (Read-only) */}
              <div className="flex items-center gap-2 ml-2 py-1">
                <span className="text-lg">{toToken.icon}</span>
                <span className="font-medium text-white">{toToken.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Bridge Process Steps Indicator */}
      {isConnected && isAmountValid && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div className="text-sm text-gray-300 mb-2">Bridge Process:</div>
          <div className="flex items-center gap-4">
            {/* Step 1: Token Selection */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
              <span className="text-xs text-gray-300">Token Selected</span>
            </div>
            
            {/* Step 2: Approval (if needed) */}
            {!fromToken.isNative && (
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  isApproved ? 'bg-green-500' : needsApproval ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  <span className="text-xs text-white">
                    {isApproved ? '✓' : isApproving ? '...' : '2'}
                  </span>
                </div>
                <span className="text-xs text-gray-300">
                  {isApproved ? 'Approved' : 'Approve Token'}
                </span>
              </div>
            )}
            
            {/* Step 3: Deposit */}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                (fromToken.isNative || isApproved) ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                <span className="text-xs text-white">
                  {fromToken.isNative ? '2' : '3'}
                </span>
              </div>
              <span className="text-xs text-gray-300">Deposit to L1</span>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="mb-6">
        <label className="flex items-start justify-center gap-3 cursor-pointer">
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

      {/* Bridge Button - Step by Step Process */}
      <Button
        onClick={handleMainAction}
        disabled={
          !isAmountValid ||
          hasInsufficientBalance ||
          (isConnected && !isTermsAccepted) ||
          isApproving ||
          isDepositPending ||
          isDepositConfirming
        }
        className="w-full py-4 text-lg font-semibold justify-center"
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
                : needsApproval && !fromToken.isNative
                  ? isApproving
                    ? "Approving..."
                    : `Step 1: Approve ${fromToken.symbol}`
                  : isDepositPending
                    ? "Confirming Deposit..."
                    : isDepositConfirming
                      ? "Processing Transaction..."
                      : isDepositSuccess
                        ? "Deposit Successful!"
                        : `Step 2: Deposit to L1`
        }
      </Button>

      {/* Deposit Status Messages */}
      {depositError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg mt-6">
          <div className="text-sm text-red-300">
            Deposit Error: {depositError.message}
          </div>
        </div>
      )}

      {isDepositSuccess && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg mt-6">
          <div className="text-sm text-green-300">
            ✅ Deposit successful! Your funds will be available on L2 shortly.
            {depositTxData && (
              <div className="mt-2">
                <a 
                  href={`${import.meta.env.VITE_L1_EXPLORER_URL}/tx/${depositTxData}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connect Wallet Modal */}
      <ModalConnectWallet
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
};

export default BridgeOne;