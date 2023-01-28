// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISOVRewards {
    enum CATEGORY {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }
    struct UserTokenDetails {
        uint256 purchaseTime;
        uint256 lastClaim;
        uint256 rewardsClaimed;
        uint256 toClaim;
    }

    function getRewardsCalc(
        uint8 _x,
        uint256 _id,
        address _addr
    ) external view returns (uint256);

    function userTokenDetailsMap(address _addr, uint256 _id) external view returns (UserTokenDetails memory);
}
