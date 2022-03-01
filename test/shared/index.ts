import { Address } from "ethereumjs-util";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


export const createVault = async (qiStablecoin, creator) => {
    return  qiStablecoin.connect(creator).createVault();
  }

export const depositCollateral = async (
    qiStablecoin: Contract,
    depositor: SignerWithAddress,
    collateralAmt: BigNumberish,
    vaultId: number
  ) => {
    return  qiStablecoin
      .connect(depositor)
      .depositCollateral(vaultId, collateralAmt);
  };

export const withdrawCollateral = async (
    qiStablecoin: Contract,
    depositor: SignerWithAddress,
    collateralAmt: BigNumberish,
    vaultId: number
  ) => {
    return  qiStablecoin
      .connect(depositor)
      .withdrawCollateral(vaultId, collateralAmt);
  };

export const borrowToken = async (
    qiStablecoin: Contract,
    depositor: SignerWithAddress,
    borrowAmt: BigNumberish,
    vaultId: number
  ) => {
    return  qiStablecoin
      .connect(depositor)
      .borrowToken(vaultId, borrowAmt);
  };

  export const payback = async (
    qiStablecoin: Contract,
    depositor: SignerWithAddress,
    paybackAmount: BigNumberish,
    vaultId: number
  ) => {
    return  qiStablecoin
      .connect(depositor)
      .payBackToken(vaultId, paybackAmount);
  };


