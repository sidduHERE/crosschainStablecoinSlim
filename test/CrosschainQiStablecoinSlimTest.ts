const { expect } = require("chai");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { CrosschainQiStablecoinSlim } from "../typechain-types";

const toDecimal = (n: string) => ethers.utils.parseUnits(n);
const fromDecimal = (n: string) => ethers.utils.formatUnits(n);

describe("CrossChainQiStablecoin", async function () {

    let qiStablecoinFactory
    let wmaticFactory
    let qiStablecoin: CrosschainQiStablecoinSlim
    let wmatic: Contract
    let mai: Contract
    let admin: SignerWithAddress
    let user1: SignerWithAddress
    let user2: SignerWithAddress

    let signers: SignerWithAddress[]

    const vaultName = "Wrapped Ethereum Arbitrum MAI Vault";
    const vaultSymbol = "WEAMVT";
    const priceSource = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
    const ipfsUri = "ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR";
    const initialCDR = 130;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

    this.beforeEach(async function () {

        signers = await ethers.getSigners();
        qiStablecoinFactory = await ethers.getContractFactory("crosschainQiStablecoinSlim");
        wmaticFactory = await ethers.getContractFactory("WMATIC")
        wmatic = await wmaticFactory.connect(signers[0]).deploy(
            toDecimal("20000")
        )
        mai = await wmaticFactory.deploy(
            toDecimal("1000000")
        );
        qiStablecoin = await qiStablecoinFactory.connect(signers[0]).deploy(
            priceSource, // Oracle (underlying pricesource)
            initialCDR, // Minimum CDR
            vaultName, // Vault name
            vaultSymbol, // Vault symbol
            mai.address,
            wmatic.address, // Eth vault (collateral)
            ipfsUri, // IPFS hash
        ) as CrosschainQiStablecoinSlim;

        await wmatic.deployed()
        await qiStablecoin.deployed()

        admin = signers[0]
        user1 = signers[1]
        user2 = signers[2]

    });

    it("Constructor checking parameters for the deployment", async () => {
        const name = await qiStablecoin.name()
        expect(name).to.eq(vaultName)
        expect(await qiStablecoin.symbol()).to.eq(vaultSymbol)
        expect(await qiStablecoin.uri()).to.eq(ipfsUri)
        expect(await qiStablecoin._minimumCollateralPercentage()).to.eq(initialCDR)
        expect(await qiStablecoin.ethPriceSource()).to.eq(priceSource)
        expect(await qiStablecoin.collateral()).to.eq(wmatic.address)
        expect(await qiStablecoin.mai()).to.eq(mai.address)

        // variables sets in the constructor
        expect(await qiStablecoin.closingFee()).to.eq(50)
        expect(await qiStablecoin.stabilityPool()).to.eq(ZERO_ADDRESS)
        expect(await qiStablecoin.tokenPeg()).to.eq(100000000)
        expect(await qiStablecoin.debtRatio()).to.eq(2)
        expect(await qiStablecoin.gainRatio()).to.eq(1100)
        expect(await qiStablecoin.priceSourceDecimals()).to.eq(8)
    })

    it("test CrosschainQiStablecoinSlim admin methods", async () => {
        // setDebtRatio
        await qiStablecoin.connect(admin).setDebtRatio(3)
        expect(await qiStablecoin.debtRatio()).to.eq(3)
        // setGainRatio
        await qiStablecoin.connect(admin).setGainRatio(1102)
        expect(await qiStablecoin.gainRatio()).to.eq(1102)
        // changeEthPriceSource
        await qiStablecoin.connect(admin).changeEthPriceSource(user1.address)
        expect(await qiStablecoin.ethPriceSource()).to.eq(user1.address)
        // setStabilityPool
        await qiStablecoin.connect(admin).setStabilityPool('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612')
        expect(await qiStablecoin.stabilityPool()).to.eq('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612')
        // setMinCollateralRatio
        await qiStablecoin.connect(admin).setMinCollateralRatio(120)
        expect(await qiStablecoin._minimumCollateralPercentage()).to.eq(120)
        // setMinDebt
        await qiStablecoin.connect(admin).setMinDebt(80)
        expect(await qiStablecoin.minDebt()).to.eq(80)
        // setTokenURI
        await qiStablecoin.connect(admin).setTokenURI('test')
        expect(await qiStablecoin.uri()).to.eq('test')
        //  setTreasury
        await qiStablecoin.connect(admin).createVault()
        await qiStablecoin.connect(admin).createVault()
        await qiStablecoin.connect(admin).setTreasury(1)
        expect(await qiStablecoin.treasury()).to.eq(1)

    })

    it("test CrosschainQiStablecoinSlim admin methods :  non-admin ", async () => {
        // setDebtRatio
        await expect(
            qiStablecoin.connect(user1).setDebtRatio(3)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setGainRatio
        await expect(
            qiStablecoin.connect(user1).setGainRatio(1102)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // changeEthPriceSource
        await expect(
            qiStablecoin.connect(user1).changeEthPriceSource(user1.address)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setStabilityPool
        await expect(
            qiStablecoin.connect(user1).setStabilityPool('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612')
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setMinCollateralRatio
        await expect(
            qiStablecoin.connect(user1).setMinCollateralRatio(120)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setMinDebt
        await expect(
            qiStablecoin.connect(user1).setMinDebt(80)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setTokenURI
        await expect(
            qiStablecoin.connect(user1).setTokenURI('test')
        ).to.be.revertedWith("Ownable: caller is not the owner")
        // setTreasury
        await expect(
            qiStablecoin.connect(user1).setTreasury(0)
        ).to.be.revertedWith("Ownable: caller is not the owner")
        await expect(
            qiStablecoin.connect(admin).setTreasury(0)
        ).to.be.revertedWith("Vault does not exist")

    })

    it("test createVault", async () => {
        // create Vault emitting the vaultID
        await expect(
            qiStablecoin.connect(user1).createVault()
        ).to.emit(qiStablecoin, "CreateVault").withArgs(0, user1.address);
        // VaultNFT transferred to user1 after creation of Vault
        expect(await qiStablecoin.balanceOf(user1.address)).to.eq(1)
    })

    it("test destroyVault", async () => {
        await qiStablecoin.connect(user1).createVault()

        await expect(
            qiStablecoin.connect(user1).destroyVault(0)
        ).to.emit(qiStablecoin, "DestroyVault").withArgs(0);
        // VaultNFT transferred to user1 after creation of Vault
        expect(await qiStablecoin.balanceOf(user1.address)).to.eq(0)
    })

    it("test destroyVault: errors", async () => {
        await qiStablecoin.connect(user1).createVault()

        // non-vault owner
        await expect(
            qiStablecoin.connect(user2).destroyVault(0)
        ).to.be.revertedWith("Vault is not owned by you")

        // not-valid vaultId
        await expect(
            qiStablecoin.connect(user1).destroyVault(1)
        ).to.be.revertedWith("Vault does not exist")

        // vault with outstanding Debt
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits("1"))
        await expect(
            qiStablecoin.connect(user1).destroyVault(0)
        ).to.be.revertedWith("Vault has outstanding debt")
    })

    it("test checkCost,checkExtract,checkCollateralPercentage: checkLiquidation -> false ", async () => {
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        // Assertions
        expect(await qiStablecoin.checkCost(0)).to.eq(0)
        expect(await qiStablecoin.checkExtract(0)).to.eq(0)
        expect(await qiStablecoin.checkLiquidation(0)).to.eq(false)
        expect(await qiStablecoin.checkCollateralPercentage(0)).to.gte(139)
    })

    it("test checkCollateralPercentage, checkLiquidation: error", async () => {
        await expect(
            qiStablecoin.checkCollateralPercentage(0)
        ).to.be.revertedWith("Vault does not exist")
    })

    it("test checkCost,checkExtract,checkCollateralPercentage: checkLiquidation -> true ", async () => {
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        const tx = await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        tx.wait()
        // modifying _minCollateralPercentage to artificially liquidate an account
        console.log("Collateral Percentage:", await qiStablecoin.checkCollateralPercentage(0))
        await qiStablecoin.connect(admin).setMinCollateralRatio(150)
        // Assertions
        expect(await qiStablecoin.checkCost(0)).to.gt(0)
        expect(await qiStablecoin.checkExtract(0)).to.gt(0)
        expect(await qiStablecoin.checkLiquidation(0)).to.eq(true)
    })

    it("test liquidateVault ", async () => {
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        const approveTx = await mai.connect(user2).approve(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        approveTx.wait()
        await mai.connect(admin).transfer(user2.address, ethers.utils.parseUnits("100000"))
        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        const tx = await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        tx.wait()
        // modifying _minCollateralPercentage to artificially liquidate an account
        console.log("Collateral Percentage:", await qiStablecoin.checkCollateralPercentage(0))
        await qiStablecoin.connect(admin).setMinCollateralRatio(150)
        // liquidation by user2
        const liquidationTx = await qiStablecoin.connect(user2).liquidateVault(0)
        liquidationTx.wait()
        // Assertions
        const remAmountOnUser2Expected = ethers.utils.parseUnits("100000").sub(ethers.utils.parseUnits(borrowAmount.toString()))
        expect(await mai.balanceOf(user2.address)).to.gte(remAmountOnUser2Expected)
        // After liquidation, Collateral Percentage should increase
        expect(await qiStablecoin.checkCollateralPercentage(0)).to.gte(150)
        expect(await qiStablecoin.maticDebt(user2.address)).to.gt(0)
        expect(await qiStablecoin.checkLiquidation(0)).to.eq(false)
    })

    it("test liquidateVault Error: Vault does not exist ", async () => {
        // vault does not exist
        await expect(
            qiStablecoin.connect(user1).liquidateVault(1)
        ).to.be.revertedWith("Vault does not exist")
    })

    it("test liquidateVault Error: Vault is not below minimum collateral percentage ", async () => {
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        const approveTx = await mai.connect(user2).approve(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        approveTx.wait()

        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        const tx = await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        // vault is not under minimum collateral percentage to get liquidated
        await expect(
            qiStablecoin.connect(user2).liquidateVault(0)
        ).to.be.revertedWith("Vault is not below minimum collateral percentage")
    })

    it("test liquidateVault Error: liquidation is disabled for public ", async () => {
        await qiStablecoin.connect(user1).createVault()
        // liquidation is not open for public
        await qiStablecoin.connect(admin).setStabilityPool(user2.address)
        await expect(
            qiStablecoin.connect(user1).liquidateVault(0)
        ).to.be.revertedWith("liquidation is disabled for public")
    })


    it("test liquidationVault Error: Token balance too low to pay off outstanding debt", async () => {
        // liquidator dont have enough funds to repay the amount for liquidation to happen
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        const approveTx = await mai.connect(user2).approve(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        approveTx.wait()

        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        const tx = await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        tx.wait()
        // modifying _minCollateralPercentage to artificially liquidate an account
        console.log("Collateral Percentage:", await qiStablecoin.checkCollateralPercentage(0))
        await qiStablecoin.connect(admin).setMinCollateralRatio(150)
        // liquidation by user2
        await expect(
            qiStablecoin.connect(user2).liquidateVault(0)
        ).to.be.revertedWith("Token balance too low to pay off outstanding debt")
    })

    it("test getPaid ", async () => {
        // setup 
        const ethPrice: BigNumber = await qiStablecoin.getEthPriceSource()
        const maiPrice = await qiStablecoin.getTokenPriceSource()
        // funding mai and wmatic to user and qiStableCoin as a pre-requisite
        await wmatic.connect(admin).transfer(user1.address, ethers.utils.parseUnits("20"))
        await mai.connect(admin).transfer(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        const approveTx = await mai.connect(user2).approve(qiStablecoin.address, ethers.utils.parseUnits("100000"))
        approveTx.wait()
        await mai.connect(admin).transfer(user2.address, ethers.utils.parseUnits("100000"))
        // user1 approving collateral token for the vault deposit
        await wmatic.connect(user1).approve(qiStablecoin.address, ethers.utils.parseUnits("200"))
        // vault deposit
        await qiStablecoin.connect(user1).createVault()
        // collateral deposit
        await qiStablecoin.connect(user1).depositCollateral(0, ethers.utils.parseUnits("10"))
        expect(await qiStablecoin.vaultCollateral(0)).to.eq(ethers.utils.parseUnits("10"))
        // mai borrow 
        const borrowAmount: number = (10 * Number(ethPrice)) / (Number(maiPrice) * 1.4)
        const tx = await qiStablecoin.connect(user1).borrowToken(0, ethers.utils.parseUnits(borrowAmount.toString()))
        tx.wait()
        // modifying _minCollateralPercentage to artificially liquidate an account
        console.log("Collateral Percentage:", await qiStablecoin.checkCollateralPercentage(0))
        await qiStablecoin.connect(admin).setMinCollateralRatio(150)
        // liquidation by user2

        const liquidationTx = await qiStablecoin.connect(user2).liquidateVault(0)
        liquidationTx.wait()
        const maticReward = await qiStablecoin.maticDebt(user2.address);
        await qiStablecoin.connect(user2).getPaid()

        // Assertions
        expect(await wmatic.balanceOf(user2.address)).to.eq(maticReward)
        // After liquidation, Collateral Percentage should increase
        expect(await qiStablecoin.maticDebt(user2.address)).to.eq(0)
    })

    it("test getPaid Error: User does not have anything to be paid ", async () => {
        // before Liquidation:
        await expect(
            qiStablecoin.connect(user2).getPaid()
        ).to.be.revertedWith("Don't have anything for you.")
    })

});