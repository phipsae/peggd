// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PeggdStableCoin} from "./PeggdStableCoin.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// import {ERC20MockOwn} from "../test/mocks/ERC20MockOwn.sol";
import {console} from "hardhat/console.sol";

/**
 * @title AnchrEngine
 * @author Phipsae
 *
 * The system is designed to maintain a peg to to the repective market value of the football club.
 * This stablecoin has the properties:
 * - Exogenous Collateral (ETH)
 * - Market Value Pegged
 * - Algorithmic Stable
 *
 *
 * OUR system should always be "overcollateralized." *
 */
contract AnchrEngine is Ownable {
    /////////////////
    /// Errors //////
    /////////////////

    error AnchrEngine__NeedsMoreThanZero();
    error AnchrEngine__TokenAddressesAndPriceFeedAddressesMustBeEqualLength();
    error AnchrEngine__NotAllowedToken();
    error ASCEngine__TransferFailed();
    error ASCEngine__MintFailed();
    error ASCEngine__HealthFactorBelowMinimum();

    //////////////////////////
    /// State Variables //////
    //////////////////////////
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    uint256 private constant LIQUIDATION_THRESHOLD = 50; // 200% overcollateralization
    uint256 private constant LIQUIDATAION_PRECISION = 100;
    uint256 private constant MIN_HEALTH_FACTOR = 1e18;

    mapping(address token => address priceFeed) public s_priceFeeds;
    mapping(address user => mapping(address token => uint256 amount)) public s_collateralDeposited;
    mapping(address user => uint256 amountAscMinted) private s_ascMinted;

    PeggdStableCoin public s_asc;

    address[] public s_collateralTokens;

    /////////////////////////
    /// Events //////////////
    /////////////////////////

    event CollateralDeposited(address indexed user, address indexed token, uint256 indexed amount);
    event CollateralRedeemed(
        address indexed user, address indexed tokenCollateralAddress, uint256 indexed amountCollateral
    );

    /////////////////
    /// Modifiers ///
    /////////////////

    modifier moreThanZero(uint256 _amount) {
        if (_amount == 0) {
            revert AnchrEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address token) {
        if (s_priceFeeds[token] == address(0)) {
            revert AnchrEngine__NotAllowedToken();
        }
        _;
    }

    /////////////////
    /// Functions ///
    /////////////////
    constructor(address[] memory tokenAddresses, address[] memory priceFeedAddresses) {
        // USD price feeds
        if (tokenAddresses.length != priceFeedAddresses.length) {
            revert AnchrEngine__TokenAddressesAndPriceFeedAddressesMustBeEqualLength();
        }
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            s_priceFeeds[tokenAddresses[i]] = priceFeedAddresses[i];
            s_collateralTokens.push(tokenAddresses[i]);
        }
    }

    ///////////////////////////
    /// External Functions ////
    ///////////////////////////

    function setAscContractAddress(address _ascAddress) external onlyOwner {
        s_asc = PeggdStableCoin(_ascAddress);
    }

    function setAllowance(address tokenCollateralAddress, uint256 amountCollateral) public {
        console.log("MSG.SENDER", msg.sender);
        console.log("Collateral Deposited address(this)", address(this));
        address spender = address(this);
        (bool successApprove) = IERC20(tokenCollateralAddress).approve(spender, amountCollateral);
        if (!successApprove) {
            revert ASCEngine__TransferFailed();
        }
    }

    /**
     * @notice Deposit collateral to mint Asc
     * @param tokenCollateralAddress The address of the collateral token
     * @param amountCollateral The amount of collateral to deposit
     */
    function depositCollateral(address tokenCollateralAddress, uint256 amountCollateral)
        public
        moreThanZero(amountCollateral)
        isAllowedToken(tokenCollateralAddress)
    {
        s_collateralDeposited[msg.sender][tokenCollateralAddress] += amountCollateral;
        emit CollateralDeposited(msg.sender, tokenCollateralAddress, amountCollateral);
        console.log("MSG.SENDER", msg.sender);
        console.log("Collateral Deposited address(this)", address(this));
        (bool successApprove) = IERC20(tokenCollateralAddress).approve(address(this), amountCollateral);
        if (!successApprove) {
            revert ASCEngine__TransferFailed();
        }
        // (bool success) = IERC20(tokenCollateralAddress).transferFrom(
        //   msg.sender, address(this), amountCollateral
        // );

        // if (!success) {
        //   revert ASCEngine__TransferFailed();
        // }
    }

    // /**
    //  * @notice Mint ASC
    //  * @param amountAscToMint The amount of ASC to mint
    //  * @notice tehy must have more collateral value than the minimum threshold
    //  */
    // function mintAsc(uint256 amountAscToMint) public moreThanZero(amountAscToMint) {
    //     s_ascMinted[msg.sender] += amountAscToMint;
    //     _revertIfHealthFactorIsBroken(msg.sender);
    //     bool minted = s_asc.mint(msg.sender, amountAscToMint);
    //     if (!minted) {
    //         revert ASCEngine__MintFailed();
    //     }
    // }

    // /////////////////////////////////////
    // /// Private & Internal Functions ////
    // /////////////////////////////////////

    // function _getAccountInformation(address user)
    //     private
    //     view
    //     returns (uint256 totalAscMinted, uint256 collateralValueInUsd)
    // {
    //     totalAscMinted = s_ascMinted[user];
    //     collateralValueInUsd = getAccountCollateralValue(user);
    // }

    // function _healthFactor(address user) internal view returns (uint256) {
    //     // total asc mined
    //     // total collateral VALUE
    //     (uint256 totalAscMinted, uint256 collateralValueInUsd) = _getAccountInformation(user);
    //     uint256 collateralAdjustedForThreshold = (collateralValueInUsd * LIQUIDATION_THRESHOLD) / LIQUIDATAION_PRECISION;
    //     return collateralAdjustedForThreshold / totalAscMinted;
    // }

    // function _revertIfHealthFactorIsBroken(address user) internal view {
    //     // 1. check Health Factor
    //     uint256 userHealthFactor = _healthFactor(user);
    //     if (userHealthFactor < MIN_HEALTH_FACTOR) {
    //         revert ASCEngine__HealthFactorBelowMinimum();
    //     }
    //     // 2. revert if not
    // }

    // //////////////////////////////////////////
    // /// Private & External View Functions ////
    // //////////////////////////////////////////
    // function getAccountCollateralValue(address user) public view returns (uint256 totalValueInUsd) {
    //     // loop through each collateral token, get the amount they have deposited and map it to the prioce to get the value
    //     for (uint256 i = 0; i < s_collateralTokens.length; i++) {
    //         address token = s_collateralTokens[i];
    //         uint256 amount = s_collateralDeposited[user][token];
    //         uint256 value = getUsdValue(token, amount);
    //         totalValueInUsd += value;
    //     }
    //     return totalValueInUsd;
    // }

    // function getUsdValue(address token, uint256 amount) public view returns (uint256) {
    //     // get the price feed for the token
    //     // get the price of the token
    //     // return the price * amount
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(s_priceFeeds[token]);
    //     (, int256 price,,,) = priceFeed.latestRoundData();

    //     // (1000 * 1e8) * 1e8 * 1000 * 1e18
    //     return (uint256(price) * ADDITIONAL_FEED_PRECISION * amount) / PRECISION;
    // }
}
