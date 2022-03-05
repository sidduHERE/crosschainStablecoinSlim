// contracts/MyVaultNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract VaultNFTv4 is ERC721 {

    string public uri;

    constructor(string memory name, string memory symbol, string memory _uri)
        ERC721(name, symbol)
    {
        uri = _uri;
    }

    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        require(_exists(tokenId));

        return uri;
    }
}