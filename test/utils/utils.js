const Web3 = require("web3");
const ganache = require("ganache");

const provider = ganache.provider();
const web3 = new Web3(provider);

function createAddress2(address, salt, byteCode) {
  return `0x${web3.utils
    .sha3(
      `0xff${[address, nameToBytes32(salt), web3.utils.sha3(byteCode)]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    )
    .slice(-40)}`.toLowerCase();
}

function nameToBytes32(name) {
  return web3.utils.sha3(name);
}

function numberToUint256(value) {
  const hex = value.toString(16);
  return `0x${"0".repeat(64 - hex.length)}${hex}`;
}

function encodeParam(dataType, data) {
  return web3.eth.abi.encodeParameter(dataType, data);
}

async function isDeployed(address) {
  const code = await web3.eth.getCode(address);
  return code.slice(2).length > 0;
}

module.exports = {
  createAddress2,
  numberToUint256,
  encodeParam,
  isDeployed,
};
