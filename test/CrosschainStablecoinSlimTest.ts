const { expect } = require("chai");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { Address } from "ethereumjs-util";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { CrosschainQiStablecoinSlim } from "../typechain-types";
import { createVault, depositCollateral,withdrawCollateral, borrowToken, payback } from "./shared";

const toDecimal = (n: string) => ethers.utils.parseUnits(n);
const fromDecimal = (n: string) => ethers.utils.formatUnits(n);

describe("CrossChainQiStablecoin", async function () {
  let qiStablecoinFactory;
  let wmaticFactory;
  let qiStablecoin: CrosschainQiStablecoinSlim;
  let wmatic: Contract;
  let mai: Contract;
  let admin: SignerWithAddress;
  let signers: SignerWithAddress[];

  const vaultName = "Wrapped Ethereum Arbitrum MAI Vault";
  const vaultSymbol = "WEAMVT";
  const priceSource = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
  const ipfsUri = "ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR";
  const initialCDR = 130;

 
  this.beforeEach(async function () {
    signers = await ethers.getSigners();
    qiStablecoinFactory = await ethers.getContractFactory(
      "crosschainQiStablecoinSlim"
    );
    wmaticFactory = await ethers.getContractFactory("WMATIC");
    wmatic = await wmaticFactory.connect(signers[0]).deploy(toDecimal("20000"));
    mai = await wmaticFactory.deploy(toDecimal("1000000"));
    qiStablecoin = (await qiStablecoinFactory.connect(signers[0]).deploy(
      priceSource, // Oracle (underlying pricesource)
      initialCDR, // Minimum CDR
      vaultName, // Vault name
      vaultSymbol, // Vault symbol
      mai.address,
      wmatic.address, // Eth vault (collateral)
      ipfsUri // IPFS hash
    )) as CrosschainQiStablecoinSlim;

    await wmatic.deployed();
    await qiStablecoin.deployed();

    admin = signers[0];
    
    await mai.transfer(qiStablecoin.address, toDecimal("10000"));
    
  });

  it("test depositCollateral", async () => {
    const [depositor] = signers;
    
    await wmatic.connect(depositor).approve(qiStablecoin.address, toDecimal("19"));
    
    createVault(qiStablecoin, depositor);
    const vaultID = 0; //first vault created is always 0

    const depositAmount = toDecimal("1");
    // First check how much money he has[WMATIC]
    const collateralBal = await wmatic.balanceOf(depositor.address);
    
    // check collateral in vault
    const prevCollateralAmount = await qiStablecoin.vaultCollateral(vaultID);

    // then deposit
        // Then see the event which was created
    await expect(await depositCollateral( qiStablecoin,depositor, depositAmount, vaultID))
      .to.emit(qiStablecoin, "DepositCollateral")
      .withArgs(vaultID, depositAmount);

    // See if there was a difference
    const newBalance = await wmatic.balanceOf(depositor.address);
    expect(newBalance).to.be.equal(collateralBal.sub(depositAmount));

    // Now check vaultBalance again
    const newVaultBal = await qiStablecoin.vaultCollateral(vaultID);
    expect(newVaultBal).to.be.equal(prevCollateralAmount.add(depositAmount));


    //await depositCollateral(depositor);
  });

  //1. Withdraw when no money is there
  //2. Test Withdraw less
  //3. Withdraw more
  //4. Withdraw with invalid debt 
  //5. Withdraw with invalid debt
  //6. Not Owner test cases

  it("test withdraw collateral", async () => {

    const [ withdrawer ] = signers;
    
    await wmatic.connect(withdrawer).approve(qiStablecoin.address, toDecimal("19"));
    
    await createVault(qiStablecoin,withdrawer);
    const vaultID = 0; //first vault created is always 0

    const withdrawAmount = toDecimal("2");
    await depositCollateral(qiStablecoin,withdrawer, withdrawAmount, vaultID);

    //4. withdraw all
    const collateralBal = await wmatic.balanceOf(withdrawer.address);
    // check collateral in vault
    const prevCollateralAmount = await qiStablecoin.vaultCollateral(vaultID);

    await expect(await withdrawCollateral(qiStablecoin,withdrawer, withdrawAmount, vaultID))
    .to.emit(qiStablecoin, "WithdrawCollateral")
    .withArgs(vaultID, withdrawAmount);


    const newBalance = await wmatic.balanceOf(withdrawer.address);
    expect(newBalance).to.be.equal(collateralBal.add(withdrawAmount));

    // Now check vaultBalance again
    const newVaultBal = await qiStablecoin.vaultCollateral(vaultID);
    expect(newVaultBal).to.be.equal(prevCollateralAmount.sub(withdrawAmount));


  });

  /*
    Borrow Success
  
  */
  it("test borrow", async () => {
    const [ borrower ] = signers;
    
    await wmatic.connect(borrower).approve(qiStablecoin.address, toDecimal("19"));
    
    await createVault(qiStablecoin,borrower);
    const vaultID = 0; //first vault created is always 0

    const collateralAmount = toDecimal("1.3");
    const borrowAmount = toDecimal("1");
    const vaultDebt = await qiStablecoin.vaultDebt(vaultID);
    const totalBorrowed = await qiStablecoin.totalBorrowed();
    const maiBalance = await mai.balanceOf(borrower.address);

    await depositCollateral(qiStablecoin,borrower, collateralAmount, vaultID);


    await expect(await borrowToken(qiStablecoin,borrower, borrowAmount, vaultID))
    .to.emit(qiStablecoin, "BorrowToken")
    .withArgs(vaultID, borrowAmount);

    expect(await qiStablecoin.vaultDebt(vaultID)).to.be.equal(vaultDebt.add(borrowAmount));
    // mai
    expect(await mai.balanceOf(borrower.address)).to.be.equal(maiBalance.add(borrowAmount));
    expect(await qiStablecoin.totalBorrowed()).to.be.equal(totalBorrowed.add(borrowAmount));

  });

  it("test payback", async () => {

    const [ borrower ] = signers;
    
    await wmatic.connect(borrower).approve(qiStablecoin.address, toDecimal("19"));
    
    await createVault(qiStablecoin,borrower);
    const vaultID = 0; //first vault created is always 0

    const collateralAmount = toDecimal("1.3");
    const borrowAmount = toDecimal("1");
    const vaultDebt = await qiStablecoin.vaultDebt(vaultID);
    const totalBorrowed = await qiStablecoin.totalBorrowed();
    const maiBalance = await mai.balanceOf(borrower.address);

    await depositCollateral(qiStablecoin,borrower, collateralAmount, vaultID);


    await expect(await borrowToken(qiStablecoin,borrower, borrowAmount, vaultID))
    .to.emit(qiStablecoin, "BorrowToken")
    .withArgs(vaultID, borrowAmount);

    expect(await qiStablecoin.vaultDebt(vaultID)).to.be.equal(vaultDebt.add(borrowAmount));
    // mai
    expect(await mai.balanceOf(borrower.address)).to.be.equal(maiBalance.add(borrowAmount));
    expect(await qiStablecoin.totalBorrowed()).to.be.equal(totalBorrowed.add(borrowAmount));
    
  });

  it("test payback", async () => {

    const [ borrower ] = signers;
    
    await wmatic.connect(borrower).approve(qiStablecoin.address, toDecimal("19"));
    
    await mai.connect(borrower).approve(qiStablecoin.address, toDecimal("1"));

    await createVault(qiStablecoin,borrower);
    await createVault(qiStablecoin,borrower); // Creating treasury

    const vaultID = 0; //first vault created is always 0
    const treasuryVault = 1;

    const collateralAmount = toDecimal("1.3");
    const paybackAmount = toDecimal("1");

    const maiBalance = await mai.balanceOf(borrower.address);
    const tokenPrice = await qiStablecoin.getTokenPriceSource();
    const ethPrice = await qiStablecoin.getEthPriceSource();
    


    await depositCollateral(qiStablecoin,borrower, collateralAmount, vaultID);
    await borrowToken(qiStablecoin,borrower, paybackAmount, vaultID);

    const vaultDebt = await qiStablecoin.vaultDebt(vaultID);
    const vaultCollateral = await qiStablecoin.vaultCollateral(vaultID);
    const totalBorrowed = await qiStablecoin.totalBorrowed();

    const _closingFee = (paybackAmount.mul(tokenPrice).mul(50)).div(ethPrice.mul(10000));
    
    await qiStablecoin.setTreasury(treasuryVault);

    const treasuryCollateral = await qiStablecoin.vaultCollateral(treasuryVault);

    await expect(
        await payback(qiStablecoin, borrower,vaultID, paybackAmount)
        )
    .to.emit(qiStablecoin, "PayBackToken")
    .withArgs(vaultID, paybackAmount,_closingFee);  

    
    expect(await qiStablecoin.vaultDebt(vaultID))
    .to.be.equal(vaultDebt.sub(paybackAmount));

    expect(await mai.balanceOf(borrower.address))
    .to.be.equal(maiBalance);

    expect(await qiStablecoin.vaultDebt(vaultID))
        .to.be.equal(vaultDebt.sub(paybackAmount));

    expect(await qiStablecoin.vaultCollateral(vaultID))
                .to.be.equal(vaultCollateral.sub(_closingFee));

    expect(await qiStablecoin.vaultCollateral(treasuryVault))
                .to.be.equal(treasuryCollateral.add(_closingFee));

    expect(await qiStablecoin.totalBorrowed())
    .to.be.equal(totalBorrowed.sub(paybackAmount));
    
  });



});
