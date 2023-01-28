// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./Interfaces/ISOVNFTSale.sol";
import "./library/DateTime.sol";

contract SOVRewards is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, DateTime {
    ISOVNFTSale public nftContract;
    IERC20Upgradeable public token;
    ISOVNFTSale public _sovNftsale;

    enum CATEGORY {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }

    struct UserTokenDetails {
        uint256 lastRewardClaimed; //last claimed rewards by user
        uint256 totalRewardsClaimed; // total rewards claimed by user
        uint256 rewardsOfSoldToken; //remaining accumulated rewards
        uint256 ClaimedRewardsDue; //claimed rewards due, due monthly claim limits
    }

    mapping(address => UserTokenDetails) public userTokenDetailsMap;
    mapping(uint256 => mapping(CATEGORY => uint256)) public RewardsMap; //year to category to rewardAmount
    mapping(uint256 => uint256) lastClaimOftoken; //tokenid to timestamp
    mapping(uint256 => uint256) WithdrawlMap; //month to withdrawl limit

    event HoldingRewardsClaimed(uint256 tokenId, uint256 rewards, CATEGORY _category);
    event RewardsClaimedToday(
        address _user,
        uint256 totalRewards,
        uint256 SoldTokensRewards,
        uint256 ClaimedRewardsDue
    );

    function initialize(address _nftaddress, address _sovTokenAddr) public initializer {
        nftContract = ISOVNFTSale(_nftaddress);
        token = IERC20Upgradeable(_sovTokenAddr);
        _sovNftsale = ISOVNFTSale(_nftaddress);
        RewardsMap[1][CATEGORY.BRONZE] = 1 * 10**18;
        RewardsMap[1][CATEGORY.SILVER] = 2 * 10**18;
        RewardsMap[1][CATEGORY.GOLD] = 3 * 10**18;
        RewardsMap[1][CATEGORY.PLATINUM] = 4 * 10**18;

        RewardsMap[2][CATEGORY.BRONZE] = (1 / 2) * 10**18;
        RewardsMap[2][CATEGORY.SILVER] = ((2 * 1) / 2) * 10**18;
        RewardsMap[2][CATEGORY.GOLD] = ((3 * 1) / 2) * 10**18;
        RewardsMap[2][CATEGORY.PLATINUM] = ((4 * 1) / 2) * 10**18;

        RewardsMap[3][CATEGORY.BRONZE] = ((1 * 1) / 4) * 10**18;
        RewardsMap[3][CATEGORY.SILVER] = ((2 * 1) / 4) * 10**18;
        RewardsMap[3][CATEGORY.GOLD] = ((3 * 1) / 4) * 10**18;
        RewardsMap[3][CATEGORY.PLATINUM] = ((4 * 1) / 4) * 10**18;

        WithdrawlMap[2] = 100 * 10**18; //as amount permitted in jan is zero
        WithdrawlMap[3] = 200 * 10**18;
        WithdrawlMap[4] = 300 * 10**18;
        WithdrawlMap[5] = 300 * 10**18;
        WithdrawlMap[6] = 750 * 10**18;
        WithdrawlMap[7] = 750 * 10**18;
        WithdrawlMap[8] = 750 * 10**18;
        WithdrawlMap[9] = 750 * 10**18;
        WithdrawlMap[10] = 1500 * 10**18;
        WithdrawlMap[11] = 1500 * 10**18;
        WithdrawlMap[12] = 2500 * 10**18;

        __Ownable_init();
        __Pausable_init();
    }

    function claim() external nonReentrant whenNotPaused {
        address user = msg.sender;
        uint256 rewards;
        uint256 nftBalance = nftContract.balanceOf(user);
        UserTokenDetails storage userDetails = userTokenDetailsMap[msg.sender];
        for (uint256 i; i < nftBalance; i++) {
            uint256 id = nftContract.tokenOfOwnerByIndex(user, i);
            bool IsEligible = nftContract.checkTokenRewardEligibility(id);
            if (IsEligible) {
                uint256 amount = getRewardsCalc(id);
                uint8 x = uint8(nftContract.getCategory(id));
                lastClaimOftoken[id] = block.timestamp;
                uint256 _rewards = amount;
                rewards += amount;

                emit HoldingRewardsClaimed(id, _rewards, CATEGORY(x));
            }
        }
        uint256 _rewardsOfSoldToken = userDetails.rewardsOfSoldToken;
        uint256 _ClaimedRewardsDue = userDetails.ClaimedRewardsDue; //eligible to claim this much rewards
        uint256 CanClaimRewards = rewards + userDetails.rewardsOfSoldToken + userDetails.ClaimedRewardsDue;

        uint256 ClaimedRewards = CanClaimRewards > allowedWithdraw() ? allowedWithdraw() : CanClaimRewards;
        uint256 ClaimedRewardsDue = CanClaimRewards > allowedWithdraw() ? CanClaimRewards - allowedWithdraw() : 0;

        userDetails.lastRewardClaimed = ClaimedRewards;
        userDetails.totalRewardsClaimed += ClaimedRewards;
        userDetails.ClaimedRewardsDue = ClaimedRewardsDue; //rewards due due to monthly limit
        userDetails.rewardsOfSoldToken = 0; //updating sold token rewards
        require(ClaimedRewards != 0, "No Rewards");
        token.transfer(user, ClaimedRewards);
        emit RewardsClaimedToday(user, ClaimedRewards, _rewardsOfSoldToken, _ClaimedRewardsDue);
    }

    function getRewardsCalc(uint256 _id) public view returns (uint256 rewardAmount) {
        CATEGORY category = CATEGORY((nftContract.getCategory(_id)));

        uint256 purchaseTime = nftContract.getRevealedTime();
        uint256 timeDuration = block.timestamp - purchaseTime;
        uint256 dayCount = timeDuration / 1 days;
        if (dayCount != 0) {
            rewardAmount = dayCount <= 365 ? dayCount * RewardsMap[1][category] : (dayCount > 365 && dayCount <= 730)
                ? (365 * RewardsMap[1][category]) + ((dayCount - 365) * RewardsMap[2][category])
                : dayCount > 730 && dayCount <= 1095
                ? (365 * RewardsMap[1][category]) +
                    (365 * RewardsMap[2][category]) +
                    ((dayCount - 730) * RewardsMap[3][category])
                : (365 * RewardsMap[1][category]) + (365 * RewardsMap[2][category]) + (365 * RewardsMap[3][category]);
        }
        if (lastClaimOftoken[_id] > purchaseTime) {
            uint256 claimDays = (lastClaimOftoken[_id] - purchaseTime) / 1 days;
            uint256 claimedAmount = claimDays <= 365
                ? claimDays * RewardsMap[1][category]
                : claimDays > 365 && claimDays <= 730
                ? (365 * RewardsMap[1][category]) + (claimDays * RewardsMap[2][category])
                : claimDays > 730 && claimDays <= 1095
                ? (365 * RewardsMap[1][category]) +
                    (365 * RewardsMap[2][category]) +
                    (claimDays * RewardsMap[3][category])
                : (365 * RewardsMap[1][category]) + (365 * RewardsMap[2][category]) + (365 * RewardsMap[3][category]);
            rewardAmount -= claimedAmount;
        }
    }

    function updateRewardAmount(address _addr, uint256 rewardAmount) external returns (bool) {
        require(address(nftContract) == msg.sender, "Invalid Caller");
        UserTokenDetails storage userDetails = userTokenDetailsMap[_addr];
        userDetails.rewardsOfSoldToken += rewardAmount;
        return true;
    }

    function setWithdrawalLimits(uint256 _month, uint256 _limit) external onlyOwner {
        WithdrawlMap[_month] = _limit;
    }

    function setRewardsMap(
        uint256 _rewards,
        uint256 _year,
        CATEGORY _x
    ) external onlyOwner {
        RewardsMap[_year][_x] = _rewards * 10**18;
    }

    function tokensAvailable() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    //author : Kiran Bagade
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function updateSOVNFTaddress(address _nftaddress) external {
        nftContract = ISOVNFTSale(_nftaddress);
    }

    function allowedWithdraw() internal view returns (uint256) {
        uint256 currMonth = DateTime.getMonth(block.timestamp);
        return WithdrawlMap[currMonth];
    }

    function withdrawAmount() public onlyOwner {
        (bool success, ) = payable(_msgSender()).call{ value: address(this).balance }("");
        require(success);
    }

    function withdrawToken(address admin, address _paymentToken) external onlyOwner {
        IERC20Upgradeable _token = IERC20Upgradeable(_paymentToken);
        uint256 amount = _token.balanceOf(address(this));
        token.transfer(admin, amount);
    }
}
