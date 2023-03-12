const Factory = artifacts.require("./ZombieFactory.sol");

module.exports = async function (deployer, network) {
  console.log(`Deploying ON : ** ${network.toUpperCase()} **`);

  const factory = await deployer.deploy(Factory);

  console.log("FactoryV1 ADDR: ", Factory.address);
};
