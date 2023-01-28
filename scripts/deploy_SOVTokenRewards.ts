import hre from "hardhat";

const { ethers, upgrades } = require("hardhat");

const name = "SOVAR";
const symbol = "SOV";
const _nftaddress = "0xE76dAE9B8a926F1F46eC02192a83F2F51f590B61";
const _SovTokenAddr = "0xcAB7E2499Df2e4E4d74AF83f6a0484E25E3F1C32";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contract = await ethers.getContractFactory("SOVTokenRewards");
  const rewards = await upgrades.deployProxy(contract, [_nftaddress, _SovTokenAddr], { initializer: "initialize" });

  await rewards.deployed();

  console.log("Contract deployed to :", rewards.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.info("check");
    console.error(error);
    process.exit(1);
  });
