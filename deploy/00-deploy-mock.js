const {
  DECIMAL,
  INITIAL_ANSWER,
  developmentChains,
} = require("../help-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  if (developmentChains.includes(network.name)) {
    const { firstAccount, secondAccount } = await getNamedAccounts();
    const { deploy } = deployments;
    await deploy("MockV3Aggregator", {
      from: firstAccount,
      args: [DECIMAL, INITIAL_ANSWER],
      log: true,
    });
  } else {
    console.log("env is not local, mock contract deployment is skipped");
  }
};

module.exports.tags = ["all", "mock"];
