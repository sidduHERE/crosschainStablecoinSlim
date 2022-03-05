// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./IPriceSourceAll.sol";

import "./MyVaultV4.sol";

import "hardhat/console.sol";

contract crosschainStablecoinSlim is ReentrancyGuard, VaultNFTv4 {
    IPriceSource public ethPriceSource;
    using SafeERC20 for ERC20;

    uint256 public _minimumCollateralPercentage;

    uint256 public vaultCount;
    uint256 public closingFee;

    uint256 public minDebt;

    uint256 public treasury;
    uint256 public tokenPeg;

    mapping(uint256 => uint256) public vaultCollateral;
    mapping(uint256 => uint256) public vaultDebt;

    uint256 public debtRatio;
    uint256 public gainRatio;

    address public stabilityPool;

    ERC20 public collateral;
    ERC20 public mai;

    uint256 public priceSourceDecimals;
    uint256 public totalBorrowed;

    uint8 public version = 3;

    event CreateVault(uint256 vaultID, address creator);
    event DestroyVault(uint256 vaultID);
    event TransferVault(uint256 vaultID, address from, address to);
    event DepositCollateral(uint256 vaultID, uint256 amount);
    event WithdrawCollateral(uint256 vaultID, uint256 amount);
    event BorrowToken(uint256 vaultID, uint256 amount);
    event PayBackToken(uint256 vaultID, uint256 amount, uint256 closingFee);
    event LiquidateVault(
        uint256 vaultID,
        address owner,
        address buyer,
        uint256 debtRepaid,
        uint256 collateralLiquidated,
        uint256 closingFee
    );

    mapping(address => uint256) public maticDebt;

    constructor(
        address ethPriceSourceAddress,
        uint256 minimumCollateralPercentage,
        string memory name,
        string memory symbol,
        address _mai,
        address _collateral,
        string memory baseURI
    ) VaultNFTv4(name, symbol, baseURI) {
        assert(ethPriceSourceAddress != address(0));
        assert(minimumCollateralPercentage != 0);

        closingFee = 50; // 0.5%

        ethPriceSource = IPriceSource(ethPriceSourceAddress);
        stabilityPool = address(0);
        tokenPeg = 100000000; // $1

        debtRatio = 2; // 1/2, pay back 50%
        gainRatio = 1100; // /10 so 1.1

        _minimumCollateralPercentage = minimumCollateralPercentage;

        collateral = ERC20(_collateral);
        mai = ERC20(_mai);
        priceSourceDecimals = 8;
    }

    modifier onlyVaultOwner(uint256 vaultID) {
        require(_exists(vaultID), "Vault does not exist");
        require(ownerOf(vaultID) == msg.sender, "Vault is not owned by you");
        _;
    }

    modifier vaultExists(uint256 vaultID) {
        require(_exists(vaultID), "Vault does not exist");
        _;
    }



    function getDebtCeiling() public view returns (uint256) {
        return mai.balanceOf(address(this));
    }

    function exists(uint256 vaultID) external view returns (bool) {
        return _exists(vaultID);
    }

    function getClosingFee() external view returns (uint256) {
        return closingFee;
    }

    function getTokenPriceSource() public view returns (uint256) {
        return tokenPeg;
    }

    function getEthPriceSource() public view returns (uint256) {
        uint256 price = ethPriceSource.latestAnswer();
        return price;
    }

    function calculateCollateralProperties(uint256 _collateral, uint256 _debt)
        private
        view
        returns (uint256, uint256)
    {
        assert(getEthPriceSource() != 0);
        assert(getTokenPriceSource() != 0);

        uint256 collateralValue = _collateral * getEthPriceSource() * (
            10**(uint256(mai.decimals()) - (uint256(collateral.decimals())))
        );
        
        assert(collateralValue >= _collateral);

        uint256 debtValue = _debt * getTokenPriceSource();

        assert(debtValue >= _debt);

        uint256 collateralValueTimes100 = collateralValue * 100;
        
        assert(collateralValueTimes100 > collateralValue);

        return (collateralValueTimes100, debtValue);
    }

    function isValidCollateral(uint256 _collateral, uint256 debt)
        public
        view
        returns (bool)
    {
        (
            uint256 collateralValueTimes100,
            uint256 debtValue
        ) = calculateCollateralProperties(_collateral, debt);

        uint256 collateralPercentage = collateralValueTimes100 / debtValue;

        return collateralPercentage >= _minimumCollateralPercentage;
    }

    function createVault() external returns (uint256) {
        uint256 id = vaultCount;
        vaultCount = vaultCount + 1;

        assert(vaultCount >= id);

        _mint(msg.sender, id);

        emit CreateVault(id, msg.sender);

        return id;
    }

    function destroyVault(uint256 vaultID)
        external
        onlyVaultOwner(vaultID)
        nonReentrant
    {
        require(vaultDebt[vaultID] == 0, "Vault has outstanding debt");

        if (vaultCollateral[vaultID] != 0) {
            // withdraw leftover collateral
            collateral.safeTransfer(ownerOf(vaultID), vaultCollateral[vaultID]);
        }

        _burn(vaultID);

        delete vaultCollateral[vaultID];
        delete vaultDebt[vaultID];

        emit DestroyVault(vaultID);
    }

    function depositCollateral(uint256 vaultID, uint256 amount) external vaultExists(vaultID) {
        collateral.safeTransferFrom(msg.sender, address(this), amount);

        uint256 newCollateral = vaultCollateral[vaultID] + (amount);

        assert(newCollateral >= vaultCollateral[vaultID]);

        vaultCollateral[vaultID] = newCollateral;

        emit DepositCollateral(vaultID, amount);
    }

    function withdrawCollateral(uint256 vaultID, uint256 amount)
        external
        onlyVaultOwner(vaultID)
        nonReentrant
    {
        require(
            vaultCollateral[vaultID] >= amount,
            "Vault does not have enough collateral"
        );

        uint256 newCollateral = vaultCollateral[vaultID] - amount;

        if (vaultDebt[vaultID] != 0) {
            require(
                isValidCollateral(newCollateral, vaultDebt[vaultID]),
                "Withdrawal would put vault below minimum collateral percentage"
            );
        }

        vaultCollateral[vaultID] = newCollateral;
        collateral.safeTransfer(msg.sender, amount);

        emit WithdrawCollateral(vaultID, amount);
    }

    function borrowToken(uint256 vaultID, uint256 amount)
        external
        onlyVaultOwner(vaultID)
    {
        require(amount > 0, "Must borrow non-zero amount");
        require(
            amount <= getDebtCeiling(),
            "borrowToken: Cannot mint over available supply."
        );

        uint256 newDebt = vaultDebt[vaultID] + amount;

        assert(newDebt > vaultDebt[vaultID]);

        require(
            isValidCollateral(vaultCollateral[vaultID], newDebt),
            "Borrow would put vault below minimum collateral percentage"
        );

        require(
            ((vaultDebt[vaultID]) + amount ) >= minDebt, 
            "Vault debt can't be under minDebt"
        );

        vaultDebt[vaultID] = newDebt;

        // mai
        mai.safeTransfer(msg.sender, amount);
        totalBorrowed = totalBorrowed + (amount);
        emit BorrowToken(vaultID, amount);
    }

    function payBackToken(uint256 vaultID, uint256 amount) external vaultExists(vaultID) {
        require(mai.balanceOf(msg.sender) >= amount, "Token balance too low");

        require(
            vaultDebt[vaultID] >= amount,
            "Vault debt less than amount to pay back"
        );

        require(
            ((vaultDebt[vaultID]) - amount ) >= minDebt
                   ||
            amount == (vaultDebt[vaultID]), 
            "Vault debt can't be under minDebt"
        );

        uint256 _closingFee = (
            amount * closingFee * getTokenPriceSource()
        ) / (getEthPriceSource() * 10000);

        //mai
        mai.safeTransferFrom(msg.sender, address(this), amount);

        vaultDebt[vaultID] = vaultDebt[vaultID] - amount;
        vaultCollateral[vaultID] = vaultCollateral[vaultID] - _closingFee;
        vaultCollateral[treasury] = vaultCollateral[treasury] + _closingFee;

        totalBorrowed = totalBorrowed - amount;
        emit PayBackToken(vaultID, amount, _closingFee);

    }

    function getPaid() public nonReentrant {
        require(maticDebt[msg.sender] != 0, "Don't have anything for you.");
        uint256 amount = maticDebt[msg.sender];
        maticDebt[msg.sender] = 0;
        collateral.safeTransfer(msg.sender, amount);
    }

    function checkCost(uint256 vaultID) public view returns (uint256) {
        if (
            vaultCollateral[vaultID] == 0 ||
            vaultDebt[vaultID] == 0 ||
            !checkLiquidation(vaultID)
        ) {
            return 0;
        }

        (
            uint256 collateralValueTimes100,
            uint256 debtValue
        ) = calculateCollateralProperties(
                vaultCollateral[vaultID],
                vaultDebt[vaultID]
            );

        if (debtValue == 0) {
            return 0;
        }

        // As its not used, Do we plan on using it or should i remove it? 
        uint256 collateralPercentage = collateralValueTimes100 / debtValue;

        debtValue = debtValue / (10**priceSourceDecimals);

        uint256 halfDebt = debtValue / debtRatio; //debtRatio (2)

        if(halfDebt<=minDebt) {
            halfDebt=debtValue;
        }

        return (halfDebt);
    }

    function checkExtract(uint256 vaultID) public view returns (uint256) {
        if (vaultCollateral[vaultID] == 0 || !checkLiquidation(vaultID)) {
            return 0;
        }

        (,uint256 debtValue
        ) = calculateCollateralProperties(
                vaultCollateral[vaultID],
                vaultDebt[vaultID]
            );

        uint256 halfDebt = debtValue / debtRatio; //debtRatio (2)

        if (halfDebt == 0) {
            return 0;
        }

        if((halfDebt) / (10**priceSourceDecimals)<=minDebt){
            // full liquidation if under the min debt.
            return debtValue * (gainRatio) / (1000) / (getEthPriceSource());
        }else{
            return halfDebt * (gainRatio) / 1000 / (getEthPriceSource());
        }
    }

    function checkCollateralPercentage(uint256 vaultID)
        public
        view
        vaultExists(vaultID)
        returns (uint256)
    {

        if (vaultCollateral[vaultID] == 0 || vaultDebt[vaultID] == 0) {
            return 0;
        }
        (
            uint256 collateralValueTimes100,
            uint256 debtValue
        ) = calculateCollateralProperties(
                vaultCollateral[vaultID],
                vaultDebt[vaultID]
            );

        return collateralValueTimes100 / (debtValue);
    }

    function checkLiquidation(uint256 vaultID) public view vaultExists(vaultID) returns (bool) {

        if (vaultCollateral[vaultID] == 0 || vaultDebt[vaultID] == 0) {
            return false;
        }

        (
            uint256 collateralValueTimes100,
            uint256 debtValue
        ) = calculateCollateralProperties(
                vaultCollateral[vaultID],
                vaultDebt[vaultID]
            );

        uint256 collateralPercentage = collateralValueTimes100 / (debtValue);

        if (collateralPercentage < _minimumCollateralPercentage) {
            return true;
        } else {
            return false;
        }
    }

    function liquidateVault(uint256 vaultID) external  vaultExists(vaultID) {
        require(
            stabilityPool == address(0) || msg.sender == stabilityPool,
            "liquidation is disabled for public"
        );

        (
            uint256 collateralValueTimes100,
            uint256 debtValue
        ) = calculateCollateralProperties(
                vaultCollateral[vaultID],
                vaultDebt[vaultID]
            );

        uint256 collateralPercentage = collateralValueTimes100 / (debtValue);

        require(
            collateralPercentage < _minimumCollateralPercentage,
            "Vault is not below minimum collateral percentage"
        );

        debtValue = debtValue / (10**priceSourceDecimals);

        uint256 halfDebt = debtValue / (debtRatio); //debtRatio (2)

        if(halfDebt<=minDebt){
            halfDebt=debtValue;
        }

        require(
            mai.balanceOf(msg.sender) >= halfDebt,
            "Token balance too low to pay off outstanding debt"
        );

        //mai
        mai.safeTransferFrom(msg.sender, address(this), halfDebt);
        totalBorrowed = totalBorrowed - (halfDebt);

        uint256 maticExtract = checkExtract(vaultID);

        vaultDebt[vaultID] = vaultDebt[vaultID] - (halfDebt); // we paid back half of its debt.

        uint256 _closingFee = (
            halfDebt * (closingFee) * (getTokenPriceSource())
        ) / (getEthPriceSource() * (10000));

        vaultCollateral[vaultID] = vaultCollateral[vaultID] - (_closingFee);
        vaultCollateral[treasury] = vaultCollateral[treasury] - (_closingFee);

        // deduct the amount from the vault's collateral
        vaultCollateral[vaultID] = vaultCollateral[vaultID] - (maticExtract);

        // let liquidator take the collateral
        maticDebt[msg.sender] = maticDebt[msg.sender] + (maticExtract);

        emit LiquidateVault(
            vaultID,
            ownerOf(vaultID),
            msg.sender,
            halfDebt,
            maticExtract,
            _closingFee
        );
    }
}
