# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

### 加密env变量
```shell
npx env-enc set-pw

npx env-enc set
```

### hardhat compile
```shell
npx hardhat compile
```

### run deploy
you can run `hardhat --help` to see all available commands

```shell
npx hardhat run scripts/deployFundMe.js --network sepolia
# or
npx hardhat deploy-fundme --network sepolia
# or
npx hardhat deploy [--tags] [--network] [--reset] # reset 每次部署重新创建合约
```

### verify
```shell
npx hardhat verify --network sepolia [address]
```

### Test
```shell
npx hardhat test [--network sepolia]
```