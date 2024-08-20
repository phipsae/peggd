// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// mock class using ERC20
contract ERC20MockOwn is ERC20 {
    address public s_sender;

    constructor(string memory name, string memory symbol, address initialAccount, uint256 initialBalance)
        payable
        ERC20(name, symbol)
    {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function writeMsgSender() public {
        s_sender = msg.sender;
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    }
}
