interface IPriceSource {
    function latestRoundData() external view returns (uint256);
    function latestAnswer() external view returns (uint256);
    function decimals() external view returns (uint8);
}
