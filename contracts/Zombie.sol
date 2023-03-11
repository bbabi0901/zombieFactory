// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract Zombie {
  string public name;
  uint public dna;
  address public factory;

  constructor(string memory _name, uint _dna) {
    name = _name;
    dna = _dna;
    factory = msg.sender;
  }

  function destroy(address payable recipient) public {
    require(msg.sender == factory);
    selfdestruct(recipient);
  }
}
