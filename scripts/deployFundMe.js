const { ethers } = require("hardhat");

async function main() {
  const fundMeFactory = await ethers.getContractFactory("FundMe");
  const fundMe = await fundMeFactory.deploy(300);
  await fundMe.waitForDeployment();
  console.log(
    `contract has been deployed successfully, contract address is ${fundMe.target}`
  );

  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("waiting for 5 confirmation");
    await fundMe.deploymentTransaction().wait(5);
    await verifyFundMe(fundMe.target, [300]);
  } else {
    console.log("verify skipped...");
  }

  // init 2 accounts
  const [firstAccount, secondAccount] = await ethers.getSigners();

  // fund contarct with first account
  const fundTx = await fundMe
    .connect(firstAccount)
    .fund({ value: ethers.parseEther("0.01") });
  await fundTx.wait();

  // check balance of contract
  let balanceOfContract = await ethers.provider.getBalance(fundMe.target);
  console.log(`balance of contract is ${balanceOfContract}`);

  // fund contarct with second account
  const fundTxWithSecondAccount = await fundMe
    .connect(secondAccount)
    .fund({ value: ethers.parseEther("0.01") });
  await fundTxWithSecondAccount.wait();

  // check balance of contract
  balanceOfContract = await ethers.provider.getBalance(fundMe.target);
  console.log(`balance of contract is ${balanceOfContract}`);

  // check mapping
  const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(
    firstAccount.address
  );
  const seondAccountBalanceInFundMe = await fundMe.fundersToAmount(
    secondAccount.address
  );
  console.log(
    `balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`
  );
  console.log(
    `balance of second account ${secondAccount.address} is ${seondAccountBalanceInFundMe}`
  );
}

async function verifyFundMe(fundMeAddr, args) {
  console.log("Verifying contract on Etherscan...");
  await hre.run("verify:verify", {
    address: fundMeAddr,
    constructorArguments: args,
  });
}

main()
  .then()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
