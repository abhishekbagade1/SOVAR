// SOV  NFT test cases with deducting SOV token
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import { upgrades } from "hardhat";

const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");

const truffleAssert = require("truffle-assertions");

describe("Unit Tests", function () {
let token: any, sovNft: any, sovReward: any, admin: SignerWithAddress, user: SignerWithAddress;

const recieveradr = "0xA9fAFe1D8B449D18Fed789728d28342dA2389e7C";

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
        "SovNft",
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

    const reward = await ethers.getContractFactory("SOVRewards");
    sovReward = await upgrades.deployProxy(reward, [sovNft.address, token.address], {
    initializer: "initialize",
    });
    await sovReward.deployed();

    await sovNft.setRewardContract(sovReward.address);

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const tx = await sovNft.startPreSale(
    (150 * 10 ** 18).toString(),
    (0.1 * 10 ** 18).toString(),
    2400,
    timestamp,
    timestamp + 30 * 24 * 60 * 60,
    );
    var x = parseInt((await tx.wait()).logs[0].data);
});

describe("SOVNFT", () => {
    it("PreSale buy one by one", async function () {
    await token.transfer(user.address, (110 * 10 ** 18).toString()); //sent SOV tokens to user
    var tx = await sovNft.connect(user).buyPresale(1, { value: (1 * (1 * 10 ** 18 + 0.1 * 10 ** 18)).toString() });
    var txn = await tx.wait();

    await token.transfer(user.address, (200 * 10 ** 18).toString());
    var tx = await sovNft.connect(user).buyPresale(1, { value: (1 * (1 * 10 ** 18 + 0.1 * 10 ** 18)).toString() });
    //var tx = await token.transferFrom(user.address, sovNft.address, 150 * 10 ** 18);
    var txn = await tx.wait();

    // await token.transfer(user.address, (300*10**18).toString());
    // var tx = await sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()});
    // var txn = await tx.wait();

    // await token.transfer(user.address, (300*10**18).toString());
    // var tx = await sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()});
    // var txn = await tx.wait();

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    var tx = await sovNft.connect(user).balanceOf(user.address);
    console.log("balance of user", parseInt(tx));
    });
    // it("PreSale buy two-two", async function () {

    //     await token.transfer(user.address, (301*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(2,{ value: (2*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.transfer(user.address, (600*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(2,{value: (2*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.transfer(user.address, (300*10**18).toString());
    //     await truffleAssert.reverts(sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()}), 'buying Limit exceeded');
    // });

    // it("PreSale buy three-one", async function () {

    //     await token.transfer(user.address, (601*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(3,{ value: (3*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.transfer(user.address, (300*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.transfer(user.address, (300*10**18).toString());
    //     await truffleAssert.reverts(sovNft.connect(user).buyPresale(2,{value: (1*(1*10**18 + 0.1*10**18)).toString()}), 'buying Limit exceeded');
    // });

    // it("PreSale buy In between token removal from balance three-one", async function () {

    //     await token.transfer(user.address, (601*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(3,{ value: (3*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.connect(user).transfer(admin.address, (300*10**18).toString());
    //     await truffleAssert.reverts(sovNft.connect(user).buyPresale(2,{value: (1*(1*10**18 + 0.1*10**18)).toString()}), 'buying Limit exceeded');
    // });

    // it("PreSale buy In between token removal from balance two-two", async function () {

    //     await token.transfer(user.address, (801*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(2,{ value: (2*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();
    //     await token.connect(user).transfer(admin.address, (300*10**18).toString());
    //     await truffleAssert.reverts(sovNft.connect(user).buyPresale(3,{value: (2*(1*10**18 + 0.1*10**18)).toString()}), 'buying Limit exceeded');
    // });

    // it("PreSale buy In between token removal from balance one by one", async function () {

    //     await token.transfer(user.address, (801*10**18).toString());
    //     var tx = await sovNft.connect(user).buyPresale(1,{ value: (1*(1*10**18 + 0.1*10**18)).toString()});
    //     var txn = await tx.wait();

    //     await token.connect(user).transfer(admin.address, (690*10**18).toString());
    //     await truffleAssert.reverts(sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()}), 'buying Limit exceeded');

    // });

    // it("PublicSale and privatesale validate or not", async function () {
    //     await ethers.provider.send("evm_increaseTime", [30*24*60*60])
    //     expect(sovNft.connect(user).buyPresale(1,{value: (1*(1*10**18 + 0.1*10**18)).toString()}), 'PrivateSale is InActive');

    //     var tx = await sovNft.connect(admin).mint([1, 3, 2, 0], ["demo", "demo1", "demo2", "demo3"]);

    // });
});
});