const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { developmentChains } = require("../../help-hardhat-config");

developmentChains.includes(network.name)
  ? describe("test fundme contract", async () => {
      let fundMe, secondFundMe, firstAccount, secondAccount, mockV3Aggregator;
      beforeEach(async () => {
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        secondAccount = (await getNamedAccounts()).secondAccount;
        const contract = await deployments.get("FundMe");
        mockV3Aggregator = await deployments.get("MockV3Aggregator");
        fundMe = await ethers.getContractAt("FundMe", contract.address);
        secondFundMe = await ethers.getContractAt(
          "FundMe",
          contract.address,
          await ethers.getSigner(secondAccount)
        );
      });

      it("test if owner is msg.sender", async () => {
        await fundMe.waitForDeployment();
        assert.equal(await fundMe.owner(), firstAccount);
      });

      it("test if data feed is assigned correctly", async () => {
        await fundMe.waitForDeployment();
        assert.equal(await fundMe.dataFeed(), mockV3Aggregator.address);
      });

      it("window closed, value greater than minimum, fund failed", async () => {
        await helpers.time.increase(200);
        await helpers.mine(); // 模拟挖矿
        await expect(
          fundMe.fund({ value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("window is closed");
      });

      it("window open, value is less than miminum, fund failed", async () => {
        await expect(
          fundMe.fund({ value: ethers.parseEther("0.001") })
        ).to.be.revertedWith("Send more eth!");
      });

      it("window open, value is greater than miminum, fund success", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        const balance = await fundMe.fundersToAmount(firstAccount);
        await expect(balance).to.equal(ethers.parseEther("0.1"));
      });

      // test for getFund
      it("not owner, window closed, target reached, getFund failed", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(secondFundMe.getFund()).to.be.revertedWith(
          "this function can only be called by owner"
        );
      });

      it("window open, target reached", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await expect(fundMe.getFund()).to.be.revertedWith(
          "window is not closed"
        );
      });

      it("window closed, target not reached", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.01") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(fundMe.getFund()).to.be.revertedWith(
          "target is not reached"
        );
      });

      it("window closed, target reached, get fund success", async () => {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(fundMe.getFund())
          .to.be.emit(fundMe, "FundWithDrawByOwner")
          .withArgs(ethers.parseEther("1"));
      });

      it("window is not closed, refund failed", async () => {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await expect(fundMe.refund()).to.be.revertedWith(
          "window is not closed"
        );
      });

      it("window is closed, target is reached, refund failed", async () => {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(fundMe.refund()).to.be.revertedWith("target is reached");
      });

      it("window is closed, target is not reached, funder does not have balance", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.01") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(secondFundMe.refund()).to.be.revertedWith(
          "there is no fund for you"
        );
      });

      it("window is closed, target is not reached, funder have balance", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.01") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(fundMe.refund())
          .to.be.emit(fundMe, "RefundByFunder")
          .withArgs(firstAccount, ethers.parseEther("0.01"));
      });
    })
  : describe.skip;
