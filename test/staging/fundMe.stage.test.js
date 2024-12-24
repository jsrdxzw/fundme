const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { expect } = require("chai");
const { developmentChains } = require("../../help-hardhat-config");

// 真实测试网集成测试
developmentChains.includes(network.name)
  ? describe.skip
  : describe("test fundme contract", async () => {
      let fundMe, firstAccount;
      beforeEach(async () => {
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        const contract = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", contract.address);
      });

      // test fund and getFund successfully
      it("fund and getFund successfully", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.5") });
        await new Promise((resolve) => setTimeout(resolve, 181 * 1000));
        const getFundTx = await fundMe.getFund();
        const getFundReceipt = await getFundTx.wait();

        expect(getFundReceipt)
          .to.be.emit(fundMe, "FundWithDrawByOwner")
          .withArgs(ethers.parseEther("0.5"));
      });

      // test fund and refund successfully
      it("fund and refund successfully", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.01") });
        await new Promise((resolve) => setTimeout(resolve, 181 * 1000));
        const refundTx = await fundMe.refund();
        const refundReceipt = await refundTx.wait();

        expect(refundReceipt)
          .to.be.emit(fundMe, "RefundByFunder")
          .withArgs(firstAccount, ethers.parseEther("0.01"));
      });
    });
