import { ethers } from "hardhat";

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

  const qiStablecoinFactory = await ethers.getContractFactory("crosschainQiStablecoinSlim");
  const vaultFactory = await ethers.getContractFactory("VaultNFT");
  const wmaticFactory = await ethers.getContractFactory("WMATIC")

  const vault = await vaultFactory.deploy();

  const wmatic = await wmaticFactory.deploy(
    "19000000000000000000000"
  );

  const qiStablecoin = await qiStablecoinFactory.deploy(
// mainnet 0xAB594600376Ec9fD91F8e885dADF0CE036862dE0
// mumbai 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
    'miMATIC',
    'miMATIC',
    vault.address,
    0x3BCE6D3936aD90C1F7c1004ee96aC7883884eB66 // treasury account
  );

  await vault.deployed()
  await wmatic.deployed()
  await qiStablecoin.deployed()

  const account = await vault.signer.getAddress();

  /*

  we need to addVaultType(
        address _oracle, 
        address _token, 
        uint256 _minimumCollateralPercentage, 
        uint256 _depositFeeBP,
        uint256 _closingFeeBP
    ) 

  */

  await wmatic.addVaultType(
        0xAB594600376Ec9fD91F8e885dADF0CE036862dE0,
        wmatic.address,
        150,
        0, // this isn't implemented yet!!!
        50
        );


  console.log("account is: ", account);
  // 1. Pre-requisites
  console.log(`1a`)
  await wmatic.approve(qiStablecoin.address, "19000000000000000000")
  console.log(`1b`)
  await vault.setAdmin(qiStablecoin.address);

  await sleep(10000);

  // 2 - Vault NFT
  // 2a - Create a vault
  console.log(`2a`)
  await qiStablecoin.createVault(0); // vaultType 0
  await qiStablecoin.createVault(0);
  const vaultId = 0;
  const secondVaultId = 1;

  await sleep(4000);
  
  // 2b - Attempt transfer vault
/*   console.log(`2b`)
  try {
    await vault.safeTransferFrom(account, '0x000000000000000000000000000000000000dEaD', vaultId)
  } catch (e) {
    console.error(`Attempting to transfer vault failed. Error: ${e}`);
  } */

  // 3 - QiStablecoin vault management
  // 3a - Deposit
  console.log(`3a`)
  try {
    await qiStablecoin.depositCollateral(vaultId, "1000000000000000000");
  } catch (e) { 
    console.log(`qiStablecoin.depositCollateral failed with ${e}`)
  }

  await sleep(5000);
   // 3b - Borrow
  console.log(`3b`)
  try {
    await qiStablecoin.borrowToken(vaultId, "1000");
    //const balance = await qiStablecoin.balanceOf(account);
    //console.log(`Borrowed token, balance: ${balance.toString()}`)
  } catch (e) { 
    console.log(`qiStablecoin.borrowToken failed with ${e}`)
  }
  
  await sleep(5000);

  // 3c - Repay
  console.log(`3c`)
  try {
    await qiStablecoin.payBackToken(vaultId, "1000");
    const balance = await qiStablecoin.balanceOf(account);
    console.log(`Repayed 1000 tokens, new balance: ${balance.toString()}`)
  } catch (e) { 
    console.log(`qiStablecoin.payBacktoken failed with ${e}`)
  }

  await sleep(5000);

  // 3d - Withdraw
  console.log(`3d`)
  try {
    await qiStablecoin.withdrawCollateral(vaultId, "100000000");
  } catch (e) { 
    console.log(`qiStablecoin.withdrawCollateral failed with ${e}`)
  }

  await sleep(5000);

  // 4 - Destruction 
  console.log(`4a`)
  try {
    await qiStablecoin.destroyVault(vaultId);
  } catch (e) { 
    console.log(`qiStablecoin.destroyVault failed with ${e}`)
  }

  await sleep(5000);

  console.log(`4b`)
  try {
    await qiStablecoin.transferVault(secondVaultId, '0x000000000000000000000000000000000000dead');
  } catch (e) { 
    console.log(`qiStablecoin.transferVault failed with ${e}`)
  }

  console.log('¿Success?')


  // await wmatic.approve(qiStablecoin.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
  // const wmaticBalance = await wmatic.balanceOf('0xaa6Ef0B357956d575539564c3DD889D56639Fb35')
  // await vault.setAdmin(qiStablecoin.address);

  // const firstOwner = await qiStablecoin.owner();

  // console.log("owner", firstOwner);

  // console.log("transferring ownership to the Ledger wallet.");

  // await qiStablecoin.transferOwnership("0x86fE8d6D4C8A007353617587988552B6921514Cb")

  // const secondOwner = await qiStablecoin.owner(); 
  // console.log(secondOwner);
  // // mainnet v1 mimatic = 0xa3Fa99A148fA48D14Ed51d610c367C61876997F1
  // // mainnet MMVT = 0x6AF1d9376a7060488558cfB443939eD67Bb9b48d
  // // then set the oracle for price
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });