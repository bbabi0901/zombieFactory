const Web3 = require("web3");
const ganache = require("ganache");

const provider = ganache.provider();
const web3 = new Web3(provider);

async function catchRevert(promise) {
  const errMessage =
    "Returned error: VM Exception while processing transaction: revert";
  try {
    await promise;
    throw null;
  } catch (err) {
    assert(err, "Expected an error but did not get one");
    assert(
      err.message === errMessage,
      `Expected ${errMessage}, but got ${err.message}`
    );
  }
}

function createAddress2(address, salt, byteCode) {
  return `0x${web3.utils
    .sha3(
      `0xff${[address, nameToSalt(salt), web3.utils.sha3(byteCode)]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    )
    .slice(-40)}`.toLowerCase();
}

function nameToSalt(name) {
  return web3.utils.sha3(name);
}

function encodeParams(dataTypes, data) {
  return web3.eth.abi.encodeParameters(dataTypes, data);
}

module.exports = {
  catchRevert,
  createAddress2,
  nameToSalt,
  encodeParams,
};
