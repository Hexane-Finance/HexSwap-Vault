import { ethers, network, run } from "hardhat";
import config from "../config";
import { constants } from "@openzeppelin/test-helpers";

const main = async () => {
  // Get network name: hardhat, testnet or mainnet.
  const { name } = network;

  if (name == "mainnet") {
    if (!process.env.KEY_MAINNET) {
      throw new Error("Missing private key, refer to README 'Deployment' section");
    }
    if (!config.Admin[name] || config.Admin[name] === constants.ZERO_ADDRESS) {
      throw new Error("Missing admin address, refer to README 'Deployment' section");
    }
    if (!config.Treasury[name] || config.Treasury[name] === constants.ZERO_ADDRESS) {
      throw new Error("Missing treasury address, refer to README 'Deployment' section");
    }
    if (!config.sHexane[name] || config.sHexane[name] === constants.ZERO_ADDRESS) {
      throw new Error("Missing sHexane address, refer to README 'Deployment' section");
    }
    if (!config.Hexane[name] || config.Hexane[name] === constants.ZERO_ADDRESS) {
      throw new Error("Missing sHexane address, refer to README 'Deployment' section");
    }
    if (!config.MasterChef[name] || config.MasterChef[name] === constants.ZERO_ADDRESS) {
      throw new Error("Missing master address, refer to README 'Deployment' section");
    }
  }

  console.log("Deploying to network:", network);

  let Hexane, sHexane, masterchef, admin, treasury;

  if (name == "mainnet") {
    admin = config.Admin[name];
    treasury = config.Treasury[name];
    Hexane = config.Hexane[name];
    sHexane = config.sHexane[name];
    masterchef = config.MasterChef[name];
  } else {
    console.log("Deploying mocks");
    const HexaneContract = await ethers.getContractFactory("HexaneToken");
    const sHexaneContract = await ethers.getContractFactory("sHexaneBar");
    const MasterChefContract = await ethers.getContractFactory("MasterChef");
    const currentBlock = await ethers.provider.getBlockNumber();

    if (name === "hardhat") {
      const [deployer] = await ethers.getSigners();
      admin = deployer.address;
      treasury = deployer.address;
    } else {
      admin = config.Admin[name];
      treasury = config.Treasury[name];
    }

    Hexane = (await HexaneContract.deploy()).address;
    await Hexane.deployed();
    sHexane = (await sHexaneContract.deploy(Hexane)).address;
    await sHexane.deployed();
    masterchef = (await MasterChefContract.deploy(Hexane, sHexane, admin, ethers.BigNumber.from("1"), currentBlock))
      .address;

    await masterchef.deployed();

    console.log("Admin:", admin);
    console.log("Treasury:", treasury);
    console.log("Hexane deployed to:", Hexane);
    console.log("sHexane deployed to:", sHexane);
    console.log("MasterChef deployed to:", masterchef);
  }

  console.log("Deploying Hexane Vault...");

  const HexaneVaultContract = await ethers.getContractFactory("HexaneVault");
  const HexaneVault = await HexaneVaultContract.deploy(Hexane, sHexane, masterchef, admin, treasury);
  await HexaneVault.deployed();

  console.log("HexaneVault deployed to:", HexaneVault.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
