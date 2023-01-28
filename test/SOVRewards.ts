// SOV Rewards testcases
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { upgrades } from "hardhat";

const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");

const truffleAssert = require("truffle-assertions");

describe("Unit Tests", function () {
  let token: any, sovNft: any, sovReward: any, admin: SignerWithAddress, user: SignerWithAddress;

  const recieveradr = "0x4F02C3102A9D2e1cC0cC97c7fE2429B9B6F5965D";

  beforeEach(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    user = signers[1];

    const sovToken = await ethers.getContractFactory("SOVToken");
    token = await sovToken.deploy();
    await token.deployed();
    //maxpresalelimit , mintoken, recieveradr, royaltyAmt
    const nft = await ethers.getContractFactory("SOVNFTSale");
    sovNft = await upgrades.deployProxy(
      nft,
      [
        "SOVNFT",
        "SOVNft",
        "http://ipfs.io/ipfs/",
        token.address,
        ".json",
        4,
        (110 * 10 ** 18).toString(),
        recieveradr,
        500,
      ],
      {
        initializer: "initialize",
      },
    );
    await sovNft.deployed();

    const reward = await ethers.getContractFactory("SOVTokenRewards");
    sovReward = await upgrades.deployProxy(reward, [sovNft.address, token.address], {
      initializer: "initialize",
    });
    await sovReward.deployed();

    await sovNft.setRewardContract(sovReward.address);

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const tx = await sovNft.startPreSale(
      (1 * 10 ** 18).toString(),
      (0.1 * 10 ** 18).toString(),
      2400,
      timestamp,
      timestamp + 30 * 24 * 60 * 60,
    );
    var x = parseInt((await tx.wait()).logs[0].data);
  });

  describe("SOVNFT", () => {
    it("Testing rewards after ", async function () {
      await token.transfer(user.address, (110 * 10 ** 18).toString()); //sent SOV tokens to user
      var tx = await sovNft.connect(user).buyPresale(1, { value: (1 * (1 * 10 ** 18 + 0.1 * 10 ** 18)).toString() });
      var txn = await tx.wait();
      await sovNft.connect(admin).reveal();

      await ethers.provider.send("evm_increaseTime", [65 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      var tx = await sovReward.getRewardsCalc(1);
      console.log("reward", parseInt(tx));
      await token.connect(admin).transfer(sovReward.address, "1000000000000000000000".toString());
      await sovReward.connect(user).claim();
      await ethers.provider.send("evm_increaseTime", [(365 * 2 + 300) * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      tx = await sovReward.getRewardsCalc(1);
      console.log("reward", parseInt(tx));
    });
  });
});