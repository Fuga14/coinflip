require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

const COMPILER_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 1000000,
  },
  metadata: {
    bytecodeHash: "none",
  },
};

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const REPORT_GAS = process.env.REPORT_GAS || false;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        COMPILER_SETTINGS,
      },
    ],
  },
  networks: {
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 80001,
    },
    localhost: {
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      // npx hardhat verify --list-networks
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    runOnCompile: false,
    only: [
      "APIConsumer",
      "AutomationCounter",
      "NFTFloorPriceConsumerV3",
      "PriceConsumerV3",
      "RandomNumberConsumerV2",
      "RandomNumberDirectFundingConsumerV2",
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
  mocha: {
    timeout: 300000, // 300 seconds max for running tests
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    player: {
      default: 1,
    },
  },
};
