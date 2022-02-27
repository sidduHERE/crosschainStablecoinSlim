const { expect } = require("chai");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { Address } from "ethereumjs-util";
import { Contract } from "ethers";
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

    let signers: SignerWithAddress[]
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
            "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", // Oracle (underlying pricesource)
            130, // Minimum CDR
            "Wrapped Ethereum Arbitrum MAI Vault", // Vault name
            "WEAMVT", // Vault symbol
            mai.address,
            wmatic.address, // Eth vault (collateral)
            "ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR", // IPFS hash
        ) as CrosschainQiStablecoinSlim;

        await wmatic.deployed()
        await qiStablecoin.deployed()

        admin = signers[0]

        console.log('prefunding the vault so it has some mai');

    });

    it("Constructor checking parameters for the deployment", async () => {
        const name = await qiStablecoin.name()
        expect(name).to.eq('Wrapped Ethereum Arbitrum MAI Vault')
        expect(await qiStablecoin.symbol()).to.eq('WEAMVT')
        expect(await qiStablecoin.uri()).to.eq('ipfs://QmViuQUnqWDL75PV3DNqLfM8GCvLouBrbVe2ShLcdqxRzR')
        expect(await qiStablecoin._minimumCollateralPercentage()).to.eq(130)
        expect(await qiStablecoin.ethPriceSource()).to.eq('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612')
        expect(await qiStablecoin.collateral()).to.eq(wmatic.address)
        expect(await qiStablecoin.mai()).to.eq(mai.address)

        // variables sets in the constructor
        expect(await qiStablecoin.closingFee()).to.eq(50)
        expect(await qiStablecoin.stabilityPool()).to.eq('0x0000000000000000000000000000000000000000')
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
        await qiStablecoin.connect(admin).changeEthPriceSource(signers[1].address)
        expect(await qiStablecoin.ethPriceSource()).to.eq(signers[1].address)
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

    })

    it("test createVault", async () => {

    })

    it("test destroyVault", async () => {

    })

    it("test depositCollateral", async () => {

    })

    it("test withdraw collateral", async () => {

    })

    it("test borrow", async () => {

    })

    it("test payback", async () => {

    })

});