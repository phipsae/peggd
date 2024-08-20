// SPDX-License-Identifier: MIT

// This is considered an Exogenous, Decentralized, Anchored (pegged), Crypto Collateralized low volitility coin

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

pragma solidity ^0.8.19;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PeggdStableCoin
 * @author Phipsae
 * Collateral: ETH
 * Minting: algorithmic
 * Realtive Stability: Pegged to resepective market value of football clubs.
 *
 * This is the contract meant to be governed by AnchrEngine.
 * This contrract isthe ERC20 implemtation of our stablecoin.
 *
 */
contract PeggdStableCoin is ERC20Burnable, Ownable {
    error PeggdStableCoin__MostBeMoreThanZero();
    error PeggdStableCoin__BurnAmountExceedsBalance();
    error PeggdStableCoin__NotZeroAddress();

    constructor() ERC20("FCBarcelonaToken", "FBT") {}

    function burn(uint256 _amount) public override {
        uint256 balance = balanceOf(msg.sender);
        if (_amount <= 0) {
            revert PeggdStableCoin__MostBeMoreThanZero();
        }
        if (balance < _amount) {
            revert PeggdStableCoin__BurnAmountExceedsBalance();
        }
        super.burn(_amount);
    }

    function mint(address _to, uint256 _amount) external returns (bool) {
        if (_to == address(0)) {
            revert PeggdStableCoin__NotZeroAddress();
        }
        if (_amount <= 0) {
            revert PeggdStableCoin__MostBeMoreThanZero();
        }
        _mint(_to, _amount);
        return true;
    }
}
