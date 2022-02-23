// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract erc20basic is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply, string memory name, string memory symbol, uint8 decimals)
        ERC20Detailed(name, symbol, decimals)
    public {
        _mint(msg.sender, initialSupply);
    }
}
