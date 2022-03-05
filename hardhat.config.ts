require('dotenv').config()

import { HardhatUserConfig } from "hardhat/types";
import 'hardhat/config';
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "tsconfig-paths/register";
import "@nomiclabs/hardhat-web3";

import "@nomiclabs/hardhat-etherscan";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{
      version: "0.5.0", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    }, {
      version: "0.5.5", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    }, {
      version: "0.5.16", settings: {
        optimizer: {
          enabled: true,
          runs: 2000
        }
      }
    }, {
      version: "0.5.17", settings: {
        optimizer: {
          enabled: true,
          runs: 2000
        }
      }
    }, {
      version: "0.6.12", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    }, {
      version: "0.7.5", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    }, {
      version: "0.7.0", settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }, {
      version: "0.7.6", settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }, {
      version: "0.8.0", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    },
    {
      version: "0.8.11", settings: {
        optimizer: {
          enabled: true,
          runs: 1000
        }
      }
    }],
  },
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/6069422bc1b84bb98ff032523960a63f`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 80001,
    },
    mainnet: {
      url: `https://polygon-rpc.com`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 137,
    },
    bsc: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 56,
    },
    avax: {
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 43114,
    },
    ftm: {
      url: `https://rpc.ftm.tools/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 250,
    },
    arb: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 42161,
    },
    movr: {
      url: `https://rpc.moonriver.moonbeam.network`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 1285,
    },
    one: {
      url: `https://api.harmony.one`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 1666600000,
    },
    cro: {
      url: `https://evm-cronos.crypto.org/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 25,
    },
    gc: {
      url: `https://rpc.gnosischain.com/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 100,
    },
    metis: {
      url: `https://andromeda.metis.io/?owner=1088`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 1088,
    },
    iotex: {
      url: `https://babel-api.mainnet.iotex.io`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 4689,
    },
    gno: {
      url: `https://rpc.xdaichain.com/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 100,
    },
    celo: {
      url: `https://forno.celo.org/`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 42220,
    },
    aurora: {
      url: `https://mainnet.aurora.dev`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 1313161554,
    },
    sys: {
      url: `https://rpc.syscoin.org`,
      accounts: [String(process.env.MATIC_KEY)],
      chainId: 57,
    },
    hardhat: {
      forking: {
        // url: `https://rpc.ftm.tools`,
        // url: `https://rpc.ftm.tools`,
        // url: 'https://polygon-rpc.com'
        url: 'https://arb1.arbitrum.io/rpc'
      },
    }
  },
  etherscan: {
    apiKey: {
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  },
};
export default config;
