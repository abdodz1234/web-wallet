export const ethPipeAbi = [
  {
    type: 'function',
    name: 'sendFunds',
    stateMutability: 'payable',
    inputs: [
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'relayerFee', type: 'uint256', internalType: 'uint256' },
      { name: 'receiverBeamPubkey', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
  },
];

export const ethErc20PipeAbi = [
  {
    type: 'function',
    name: 'sendFunds',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'relayerFee', type: 'uint256', internalType: 'uint256' },
      { name: 'receiverBeamPubkey', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
  },
];

export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];
