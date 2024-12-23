const { task } = require("hardhat/config");

task("interact-fundme", "interact with fundme contract")
  .addParam("addr", "fundme contract address")
  .setAction(async (taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    const fundMe = fundMeFactory.attach(taskArgs.addr);

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
  });

module.exports = {};
