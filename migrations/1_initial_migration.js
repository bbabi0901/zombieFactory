const Factory = artifacts.require("ZombieFactory");
const ZombieTemp = artifacts.require("ZombieTemp");

module.exports = async function (deployer, network) {
  console.log(`Deploying ON : ** ${network.toUpperCase()} **`);

  const factory = await deployer.deploy(Factory);

  console.log("Factory ADDR: ", Factory.address);

  const zombieTemp = await deployer.deploy(ZombieTemp);

  console.log("ZombieTemp ADDR: ", ZombieTemp.address);
};
