// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract WMATIC is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply) ERC20Detailed("Wrapped Matic", "wMATIC", 18) public {
        _mint(msg.sender, initialSupply);
    }
}
