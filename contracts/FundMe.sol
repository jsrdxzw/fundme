// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract FundMe {
    AggregatorV3Interface public dataFeed;

    mapping(address => uint256) public fundersToAmount;

    uint256 constant MINIMUM_VALUE = 10 * 10 ** 18; // USD

    uint256 constant TARGET = 100 * 10 ** 18; // USD

    address public owner;

    uint256 deploymentTimestamp;
    uint256 lockTime;

    address erc20Addr;

    bool public getFundSuccess;

    event FundWithDrawByOwner(uint256);

    event RefundByFunder(address, uint256);

    constructor(uint256 _lockTime, address dataFeedAddr) {
        dataFeed = AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "Send more eth!");
        require(
            block.timestamp < deploymentTimestamp + lockTime,
            "window is closed"
        );
        fundersToAmount[msg.sender] += msg.value;
    }

    /**
     * Returns the latest answer. 1 eth = ? USD / 10**8
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ethAmount * ethPrice) / (10 ** 8);
    }

    function getFund() external windowClosed onlyOwner {
        require(
            convertEthToUsd(address(this).balance) >= TARGET,
            "target is not reached"
        );
        bool success;
        uint256 balance = address(this).balance;
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;
        // emit event
        emit FundWithDrawByOwner(balance);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function refund() external windowClosed {
        require(
            convertEthToUsd(address(this).balance) < TARGET,
            "target is reached"
        );
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");
        bool success;
        uint256 balance = fundersToAmount[msg.sender];
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender, balance);
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    function setFunderToAmount(
        address funder,
        uint256 amountToUpdate
    ) external {
        require(
            msg.sender == erc20Addr,
            "you do not have permission to call this function"
        );
        fundersToAmount[funder] = amountToUpdate;
    }

    modifier windowClosed() {
        require(
            block.timestamp >= deploymentTimestamp + lockTime,
            "window is not closed"
        );
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "this function can only be called by owner"
        );
        _;
    }
}
