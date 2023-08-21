const networkConfig = {
  default: {
    name: 'hardhat',
    subscriptionId: '5742',
    fee: '100000000000000000',
    keyHash: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
    jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
    fundAmount: '1000000000000000000',
    automationUpdateInterval: '30',
  },
  31337: {
    name: 'localhost',
    subscriptionId: '5742',
    fee: '100000000000000000',
    keyHash: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
    jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
    fundAmount: '1000000000000000000',
    automationUpdateInterval: '30',
  },
  80001: {
    name: 'mumbai',
    subscriptionId: '5742',
    linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    keyHash: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
    vrfCoordinator: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed',
    fee: '100000000000000000',
    automationUpdateInterval: '30',
  },
  11155111: {
    name: 'sepolia',
    subscriptionId: '4674',
    linkToken: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
    keyHash: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    vrfCoordinator: '0x8103b0a8a00be2ddc778e6e7eaa21791cd364625',
    fee: '100000000000000000',
    automationUpdateInterval: '30',
  },
};

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

// Mocks values
const DECIMALS = 8;

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  DECIMALS,
};
