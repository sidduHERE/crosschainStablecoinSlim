pragma solidity 0.5.17;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./crosschainStablecoinSlim.sol";

contract crosschainQiStablecoinSlim is crosschainStablecoinSlim, Ownable {
    constructor(
        address ethPriceSourceAddress,
        uint256 minimumCollateralPercentage,
        string memory name,
        string memory symbol,
        address _mai,
        address _collateral,
        string memory baseURI
    )
        public
        crosschainStablecoinSlim(
            ethPriceSourceAddress,
            minimumCollateralPercentage,
            name,
            symbol,
            _mai,
            _collateral,
            baseURI
        )
    {
        treasury = 0;
    }

    function setGainRatio(uint256 _gainRatio) external onlyOwner {
        gainRatio = _gainRatio;
    }

    function setDebtRatio(uint256 _debtRatio) external onlyOwner {
        debtRatio = _debtRatio;
    }

    function changeEthPriceSource(address ethPriceSourceAddress)
        external
        onlyOwner
    {
        ethPriceSource = IPriceSource(ethPriceSourceAddress);
    }

    function setStabilityPool(address _pool) external onlyOwner {
        stabilityPool = _pool;
    }

    function setMinCollateralRatio(uint256 minimumCollateralPercentage)
        external
        onlyOwner
    {
        _minimumCollateralPercentage = minimumCollateralPercentage;
    }

    function setMinDebt(uint256 _minDebt)
        external
        onlyOwner
    {
        minDebt = _minDebt;
    }

    function setTreasury(uint256 _treasury) external onlyOwner {
        require(_exists(_treasury), "Vault does not exist");
        treasury = _treasury;
    }

    function burn(uint256 amountToken) public onlyOwner {
        // Burn
        mai.transfer(address(1), amountToken);
    }

    function setTokenURI(string memory _uri) public onlyOwner {
        uri = _uri;
    }
}
