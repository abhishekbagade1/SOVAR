import hre from "hardhat";

const { ethers, upgrades } = require("hardhat");

const Proxy1 = "0x2ca9CA145DB59c721a5c4296DC2C4caB25dF9c7c";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contract = await ethers.getContractFactory("SOVTokenRewards");
  const rewCon = await upgrades.upgradeProxy(Proxy1, contract);

  await rewCon.deployed();

  console.log("Contract upgraded to :", rewCon.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
