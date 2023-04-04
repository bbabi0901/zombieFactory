const { ethers } = require("hardhat");
// const {
//   Bytecode,
// } = require("hardhat/internal/hardhat-network/stack-traces/model");

const PREFIX = "0xff";

async function catchRevert(promise, errMessage) {
  try {
    await promise;
    throw null;
  } catch (err) {
    assert(err, "Expected an error but did not get one");
    assert(
      err.message === errMessage,
      `Expected ${errMessage}, 
      but got ${err.message}`
    );
  }
}

function createAddress2(address, salt, byteCode) {
  return `0x${hash(
    `${PREFIX}${[address, nameToSalt(salt), hash(byteCode)]
      .map((x) => x.replace(/0x/, ""))
      .join("")}`
  ).slice(-40)}`.toLowerCase();
}

function hash(data) {
  return ethers.utils.keccak256(data);
}

function nameToSalt(name) {
  return hash(ethers.utils.toUtf8Bytes(name));
}

function encodeParams(dataTypes, data) {
  // return web3.eth.abi.encodeParameters(dataTypes, data);
  return ethers.utils.defaultAbiCoder.encode(dataTypes, data);
}

const EVENT_TYPES_CREATE = ["address", "uint"];

/*
  Ethers.js에서 tx 대신 wait 후 receipt를 사용하는 이유
  to wait till tx confirmed.
  https://stackoverflow.com/questions/69013697/get-events-from-a-transaction-receipt-in-hardhat
*/

const decodeEvent = (types, receipt) => {
  return ethers.utils.defaultAbiCoder.decode(types, receipt.events[0].data);
};

module.exports = {
  catchRevert,
  createAddress2,
  nameToSalt,
  encodeParams,
  decodeEvent,
  EVENT_TYPES_CREATE,
};
