import deploy from "./deploy-arbitrum-slim-vaults";

deploy(
    "Wrapped Ethereum Arbitrum MAI Vault", // Vault name
    "WEAMVT", // Vault symbol
    "ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR", // IPFS hash
    130, // Minimum CDR
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // Eth vault (collateral)
    "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", // Oracle (underlying pricesource)
)