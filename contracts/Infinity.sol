// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";


contract Infinity is
    ERC20,
    ERC20Burnable,
    Pausable,
    Ownable,
    ERC20Permit,
    ERC20Votes
{
    address payable public ownerFunction;
    uint public unlockTime;
    address public _owner;
    event Withdrawal(uint amount, uint when);

    constructor(
        uint _unlockTime
    ) payable ERC20("Infinity", "INF") ERC20Permit("Infinity") {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        _owner = msg.sender;
        unlockTime = _unlockTime;
        ownerFunction = payable(msg.sender);
    }

    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == _owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        ownerFunction.transfer(address(this).balance);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint amount) public onlyOwner whenNotPaused {
        _mint(to, amount);
    }

    function burn(address to, uint amount) public onlyOwner whenNotPaused {
        _burn(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
