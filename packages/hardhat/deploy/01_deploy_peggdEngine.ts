import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract, parseEther } from "ethers";
import { hardhat, sepolia } from "viem/chains";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const DECIMALS = 8;
  const ETH_USD_PRICE = 2000e8;

  console.log("Deployer", deployer);

  let tokenAddresses: string[] = [];
  let priceFeedAddresses: string[] = [];
  const actualChainId = await hre.getChainId();

  if (hardhat.id === Number(actualChainId)) {
    // Deploy weth contract
    const erc20MockOwn = await deploy("ERC20MockOwn", {
      from: deployer,
      // Contract constructor arguments
      args: ["wEth", "WETH", deployer, 1000e8],
      log: true,
      // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
      // automatically mining the contract deployment transaction. There is no effect on live networks.
      autoMine: true,
    });

    const erc20MockOwnContract = await hre.ethers.getContract<Contract>("ERC20MockOwn", deployer);

    console.log("WETH minted", await erc20MockOwnContract.mint(deployer, parseEther("100")));
    /// Deploy price feed contract
    const priceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      // Contract constructor arguments
      args: [DECIMALS, ETH_USD_PRICE],
      log: true,
      // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
      // automatically mining the contract deployment transaction. There is no effect on live networks.
      autoMine: true,
    });
    // const priceFeed = await hre.ethers.getContract<Contract>("MockV3Aggregator", deployer);
    // console.log("PriceFeed", priceFeed.address);
    tokenAddresses = [erc20MockOwn.address];
    priceFeedAddresses = [priceFeed.address];
  } else if (sepolia.id === Number(actualChainId)) {
    tokenAddresses = ["0xdd13E55209Fd76AfE204dBda4007C227904f0a81"];
    priceFeedAddresses = ["0x694AA1769357215DE4FAC081bf1f309aDC325306"];
  }

  /// Deplpy engine contract with weth and price feed contract
  // const tokenAddresses = [erc20MockOwn.address];
  // const priceFeedAddresses = [priceFeed.address];
  // console.log("tokenAddresses", tokenAddresses);
  // console.log("priceFeedAddresses", priceFeedAddresses);
  const anchrEngine = await deploy("AnchrEngine", {
    from: deployer,
    // Contract constructor arguments
    args: [tokenAddresses, priceFeedAddresses],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  const anchrEngineContract = await hre.ethers.getContract<Contract>("AnchrEngine", deployer);
  // console.log("AnchrEngine", anchrEngine);

  if (hardhat.id === Number(actualChainId)) {
    const erc20MockOwnContract = await hre.ethers.getContract<Contract>("ERC20MockOwn", deployer);
    console.log("set Weth allowance", await erc20MockOwnContract.approve(anchrEngine.address, parseEther("10")));
    const erc20MockAddress = await erc20MockOwnContract.getAddress();
    console.log(
      "Deposit collateral to engine",
      await anchrEngineContract.depositCollateral(erc20MockAddress, parseEther("1")),
    );
  }

  // Deploy peggd contract and asign owner engine contract
  const peggdStableCoin = await deploy("PeggdStableCoin", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  // const peggdStableCoin = await hre.ethers.getContract<Contract>("PeggdStableCoin", deployer);
  // console.log("AnchrEngine", peggdStableCoin);
  // console.log("Pegged Address", anchrEngine);
  console.log("WETH minted", await anchrEngineContract.setAscContractAddress(peggdStableCoin.address));

  // await deploy("AnchrEngine", {
  //   from: deployer,
  //   // Contract constructor arguments
  //   args: [deployer],
  //   log: true,
  //   // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
  //   // automatically mining the contract deployment transaction. There is no effect on live networks.
  //   autoMine: true,
  // });

  // Get the deployed contract to interact with it after deploying.
  // const yourContract = await hre.ethers.getContract<Contract>("ERC20Mock", deployer);
  // console.log("👋 Initial greeting:", await yourContract.greeting());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["YourContract"];
