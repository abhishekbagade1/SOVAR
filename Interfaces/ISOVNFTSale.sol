// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISOVNFTSale {
    enum CATEGORY {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }

    struct UserDetails {
        uint256 NftTokens;
        uint256 SoldTokenRewards;
        uint256 TotalRewardsClaimed;
        uint256 dueRewards; // rewards due due to monthly withdrawl limit
    }

    function userDetailsMap(address _addr) external view returns (UserDetails memory);

    function getCategoryOf(uint256 tokenId) external view returns (CATEGORY);

    function updateUserDetails(
        address _user,
        uint256 _totalRewardsClaimed,
        uint256 _dueRewards,
        uint256 _restartCount
    ) external;
}
