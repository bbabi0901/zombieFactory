// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract ZombieTemp {
  string public name;
  uint public dna;

  function setVars(uint _dna) public {
    dna = _dna;
  }
}
