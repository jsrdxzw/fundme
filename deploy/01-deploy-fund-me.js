const { network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
  LOCK_TIME,
  CONFIRMATION,
} = require("../help-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy } = deployments;

  let dataFeedAddr;
  let confirmation;

  if (developmentChains.includes(network.name)) {
    const mockDataFeed = await deployments.get("MockV3Aggregator");
    dataFeedAddr = mockDataFeed.address;
    confirmation = 0;
  } else {
    dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed;
    confirmation = CONFIRMATION;
  }

  const fundMe = await deploy("FundMe", {
    from: firstAccount,
    args: [LOCK_TIME, dataFeedAddr],
    log: true,
    waitConfirmations: confirmation,
  });

  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: fundMe.address,
      constructorArguments: [LOCK_TIME, dataFeedAddr],
    });
  } else {
    console.log("network is not sepolia, verification skipped");
  }
};

module.exports.tags = ["all", "fundme"];
