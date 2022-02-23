import hre, { ethers } from "hardhat";
const { exec } = require("child_process");

function options() {
  return {};
}

export default async function deploy(
  vaultName: string,
  vaultSymbol: string,
  nftUri: string,
  cdr: number,
  collateralAddress: string,
  priceSource: string
) {
  const [account] = await ethers.getSigners()

  const qiStablecoinFactory = await ethers.getContractFactory(
    "crosschainQiStablecoinSlim"
  );

  const mai = "0x3F56e0c36d275367b8C502090EDF38289b3dEa0d";
  const multisig = "0xF32e759d5f1c63ed62042497d3a50F044eE0982b"; // arbitrum gnosis sig

  const qiStablecoin = await qiStablecoinFactory.deploy(
    priceSource,
    cdr, // collateral to debt ratio
    vaultName,
    vaultSymbol,
    mai,
    collateralAddress,
    nftUri,
    options()
  );

  // console.log(qiStablecoin);

  await qiStablecoin.deployed();
  console.log(`Deployed qiStablecoin: ${qiStablecoin.address}`)

  const verificationCommand = `npx hardhat verify ${qiStablecoin.address} "${priceSource}" "${cdr}" "${vaultName}" "${vaultSymbol}" "${mai}" "${collateralAddress}" ${nftUri}" --network gc`;
  console.log("Verification: ", verificationCommand);

  await (await qiStablecoin.createVault(options())).wait(1); // Create the first vault (Vault #0)
  await (await qiStablecoin.transferFrom(account.address, multisig, 0)).wait(1); // Transfer Vault #0 to the multisig (to be used for fee collection)
  await (await qiStablecoin.transferOwnership(multisig)).wait(1); // Transfer ownership of contract to the multisig

  await exec(
    verificationCommand,
    async (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
}
