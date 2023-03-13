// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract Zombie {
  string public name;
  uint public dna;

  constructor(string memory _name, uint _dna) {
    name = _name;
    dna = _dna;
  }

  function destroy(address payable recipient) public {
    selfdestruct(recipient);
  }
}
