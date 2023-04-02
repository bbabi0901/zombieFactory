// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Zombie.sol";

contract ZombieFactory {
  // declare our event here

  uint dnaDigits = 16;
  uint dnaModulus = 10 ** dnaDigits;

  Zombie[] public zombies;

  event Created(address zombie, uint dna);

  function _createZombie(
    string memory _name,
    uint _dna
  ) private returns (address) {
    Zombie zombie = new Zombie(_name, _dna);

    console.log("created", address(zombie));

    zombies.push(zombie);

    emit Created(address(zombie), _dna);

    return address(zombie);
  }

  function _generateRandomDna(string memory _str) private view returns (uint) {
    uint rand = uint(keccak256(abi.encodePacked(_str)));
    return rand % dnaModulus;
  }

  function createRandomZombie(string memory _name) public returns (address) {
    uint randDna = _generateRandomDna(_name);
    return _createZombie(_name, randDna);
  }

  function _createZombieV2(string memory _name, uint _dna) private {
    address zombie;
    bytes32 salt = keccak256(abi.encodePacked(_name));
    bytes memory bytecode = abi.encodePacked(
      type(Zombie).creationCode,
      abi.encode(_name, _dna)
    );
    assembly {
      zombie := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
      if iszero(extcodesize(zombie)) {
        revert(0, 0)
      }
    }
    zombies.push(Zombie(zombie));

    emit Created(zombie, _dna);
  }

  function createRandomZombieV2(string memory _name) public {
    uint randDna = _generateRandomDna(_name);
    _createZombieV2(_name, randDna);
  }

  function getSalt(string memory _name) public pure returns (bytes32) {
    bytes32 salt = keccak256(abi.encodePacked(_name));
    return salt;
  }

  function getBytecode(
    string memory _name,
    uint _dna
  ) public pure returns (bytes memory) {
    bytes memory bytecode = type(Zombie).creationCode;

    return abi.encodePacked(bytecode, abi.encode(_name, _dna));
  }
}
