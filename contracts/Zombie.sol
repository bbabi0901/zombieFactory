// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract Zombie {
  string public name;
  uint public dna;

  constructor(string memory _name, uint _dna) {
    name = _name;
    dna = _dna;
  }

  event Set(bool res);

  function destroy(address payable recipient) public {
    selfdestruct(recipient);
  }

  function setDNA(
    address _contract,
    uint _dna
  ) public returns (bool, bytes memory) {
    (bool success, bytes memory data) = _contract.delegatecall(
      abi.encodeWithSignature("setVars(uint256)", _dna)
    );
    emit Set(success);
    return (success, data);
  }

  function setDNAbyStaticcall(address _contract, uint _dna) public {
    (bool success, bytes memory data) = _contract.staticcall(
      abi.encodeWithSignature("setVars(uint256)", _dna)
    );
    emit Set(success);
  }
}
