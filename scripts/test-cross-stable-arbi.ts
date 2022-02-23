import { ethers } from "hardhat";

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

  const qiStablecoinFactory = await ethers.getContractFactory("crosschainQiStablecoinSlim");
  const wmaticFactory = await ethers.getContractFactory("WMATIC")

  const wmatic = await wmaticFactory.deploy(
    "19000000000000000000000"
  );

  const mai = await wmaticFactory.deploy(
    "10000000000000000000000000000000000000000000000000000"
  );

  const qiStablecoin = await qiStablecoinFactory.deploy(
    "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", // Oracle (underlying pricesource)
    130, // Minimum CDR
    "Wrapped Ethereum Arbitrum MAI Vault", // Vault name
    "WEAMVT", // Vault symbol
    mai.address,
    wmatic.address, // Eth vault (collateral)
    "ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR", // IPFS hash
  );

  await wmatic.deployed()
  await qiStablecoin.deployed()

  const account = await qiStablecoin.signer.getAddress();

  console.log('prefunding the vault so it has some mai');

  await mai.transfer(qiStablecoin.address,"1000000000000000000000000000000");


  console.log("account is: ", account);
  // 1. Pre-requisites
  console.log(`1a`)
  await wmatic.approve(qiStablecoin.address, "19000000000000000000")

  //await sleep(10000);

  // 2 - Vault NFT
  // 2a - Create a vault
  console.log(`2a`)
  await qiStablecoin.createVault(); // vaultType 0
  await qiStablecoin.createVault();
  const vaultId = 0;
  const secondVaultId = 1;

  //await sleep(4000);
  
  // 3 - QiStablecoin vault management
  // 3a - Deposit
  console.log(`3a`)
  try {
    await qiStablecoin.depositCollateral(vaultId, "10000000000");
  } catch (e) { 
    console.log(`qiStablecoin.depositCollateral failed with ${e}`)
  }

  //await sleep(5000);
   // 3b - Borrow
  console.log(`3b`)
  try {
    await qiStablecoin.borrowToken(vaultId, "23000000000000");
    //const balance = await qiStablecoin.balanceOf(account);
    //console.log(`Borrowed token, balance: ${balance.toString()}`)
  } catch (e) { 
    console.log(`qiStablecoin.borrowToken failed with ${e}`)
  }

  // 3b - Borrow
  console.log(`trying to liquidate myself`)
  try {
    var cdr = await qiStablecoin.checkCollateralPercentage(vaultId);

    console.log("CDR: ", cdr.toString() );

    await qiStablecoin.setMinCollateralRatio(140);

    cdr = await qiStablecoin.checkLiquidation(vaultId);

    console.log("Liquidation?: ", cdr.toString() );

    cdr = await qiStablecoin.checkExtract(vaultId);

    console.log("Extract: ", cdr.toString() );

    cdr = await qiStablecoin.checkCost(vaultId);

    console.log("Cost: ", cdr.toString() );

    console.log("change min debt");

    cdr = await qiStablecoin.setMinDebt("24000000000000");

    cdr = await qiStablecoin.checkLiquidation(vaultId);

    console.log("Liquidation?: ", cdr.toString() );

    cdr = await qiStablecoin.checkExtract(vaultId);

    console.log("Extract: ", cdr.toString() );

    cdr = await qiStablecoin.checkCost(vaultId);
    console.log("Cost: ", cdr.toString() );

  } catch (e) { 
    console.log(`qiStablecoin.liquidate myself failed with ${e}`)
  }
  
  //await sleep(5000);

  // 3c - Repay
  console.log(`3c`)
  try {
    await mai.approve(qiStablecoin.address, "19000000000000000000")

    await qiStablecoin.payBackToken(vaultId, "1000");
    const balance = await qiStablecoin.balanceOf(account);
    console.log(`Repayed 1000 tokens, new balance: ${balance.toString()}`)
  } catch (e) { 
    console.log(`qiStablecoin.payBacktoken failed with ${e}`)
  }

  //await sleep(5000);

  // 3d - Withdraw
  console.log(`3d`)
  try {
    await qiStablecoin.withdrawCollateral(vaultId, "1000");
  } catch (e) { 
    console.log(`qiStablecoin.withdrawCollateral failed with ${e}`)
  }

  //await sleep(5000);

  // 4 - Destruction 
  console.log(`4a`)
  try {
    await qiStablecoin.destroyVault(vaultId);
  } catch (e) { 
    console.log(`qiStablecoin.destroyVault failed with ${e}`)
  }

  //await sleep(5000);

  console.log('¿Success?')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });