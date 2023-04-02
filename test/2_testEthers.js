const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const {
  catchRevert,
  createAddress2,
  nameToSalt,
  encodeParams,
} = require("./utils/utils.js");

const {
  bytecode: zombieBytecode,
} = require("../artifacts/contracts/Zombie.sol/Zombie.json");

// const ZombieTemp = artifacts.require("ZombieTemp"); 나중에 쓸거임

describe("ZombieFactory", async (accounts) => {
  let factory;

  before(async () => {
    this.GILDONG = "Gildong";
    this.CHULSOO = "Chulsoo";

    this.Factory = await ethers.getContractFactory("ZombieFactory");
    factory = await this.Factory.deploy();
    await factory.deployed();
    console.log("Deployed Factory: ", factory.address);
  });

  const createZombieFixture = async (name) => {
    const Zombie = await ethers.getContractFactory("Zombie");
    const tx = await factory.createRandomZombie(name);

    // console.log(tx);
    /*
    Ethers.js에서 tx 대신 wait 후 receipt를 사용하는 이유
    to wait till tx confirmed.
    https://stackoverflow.com/questions/69013697/get-events-from-a-transaction-receipt-in-hardhat
    */
    const receipt = await tx.wait();

    let [address, dna] = ethers.utils.defaultAbiCoder.decode(
      ["address", "uint"],
      receipt.events[0].data
    );
    dna = +dna;

    const contract = Zombie.attach(address);

    return { address, dna, contract };
  };

  // create2
  const create2ZombieFixture = async (name) => {
    const tx = await this.factory.createRandomZombieV2(name);

    let address;
    // address from tx(or event log)

    const contract = await this.Zombie.attach(address);

    // returns address and contract
    return { address, contract };
  };

  const selfdestructFixture = async (contract) => {
    await contract.destroy();
  };

  describe("'CREATE' and 'CREATE2", () => {
    it("'CREATE'로 생성시 두 컨트랙트의 주소가 달라야 합니다.", async () => {
      const { gildongAddress, gildongDNA, gildongContract } = await loadFixture(
        createZombieFixture(this.GILDONG)
      );
      console.log("after fixture", gildongAddress, gildongDNA);

      let name = await gildongContract.name();
      expect(this.GILDONG).to.equal(
        name,
        `Expect ${this.GILDONG}, got ${name}`
      );

      const { chulsooAddress, chulsooContract } = await loadFixture(
        createZombieFixture(this.CHULSOO)
      );
      name = await chulsooContract.name();
      expect(this.CHULSOO).to.equal(
        name,
        `Expect ${this.CHULSOO}, got ${name}`
      );
      // gildongAddress, chulsooAddress
      expect(gildongAddress).to.not.equal(
        chulsooAddress,
        `
        Gildong: ${gildongAddress}
        Chulsoo: ${chulsooAddress}
        `
      );
    });

    /*
    it("이름이 같은 좀비를 생성시 실패해야 합니다.", async () => {
      const errMessage =
        "Returned error: VM Exception while processing transaction: revert without reason string";
      await catchRevert(zombieFactory.createRandomZombieV2(name1), errMessage);
    });

    it("좀비의 주소가 오프체인에서 특정한 주소와 같아야 합니다.", async () => {
      console.log("created2", zombie1.address);
      dna = +(await zombie1.dna());
      dnaString = dna.toString();
      name = await zombie1.name();

      const params = encodeParams(["string", "uint"], [name, dnaString]);

      const bytecode = `${zombieBytecode}${params.slice(2)}`;
      const bytecodeFromContract = await zombieFactory.getBytecode(name, dna);
      assert.equal(bytecodeFromContract, bytecode, "bytecode differs ");

      const salt = nameToSalt(name1);
      assert.equal(await zombieFactory.getSalt(name), salt, "salt differs");

      const computeAddr = createAddress2(zombieFactory.address, name, bytecode);
      assert.equal(zombie1Addr.toLowerCase(), computeAddr, "addr differs");
    });

    it("이름이 다른 두 좀비의 주소가 달라야 합니다.", async () => {
      const tx = await zombieFactory.createRandomZombieV2(name2);
      var { zombie, dna } = tx.logs[0].args;
      let zombie2Addr = zombie;
      let zombie2 = await Zombie.at(zombie2Addr);
      name = await zombie2.name();
      assert.strictEqual(name, name2);
      assert.notStrictEqual(zombie1Addr, zombie2Addr);
    });*/
  });

  /*
  describe("Modifying state with delegatecall", () => {
    let tx, zombie1Addr, name, zombieDNA, zombie1;
    const dnaModified = 12345678;

    beforeEach(async () => {
      tx = await zombieFactory.createRandomZombie(name1);
      var { zombie, dna } = tx.logs[0].args;
      zombie1Addr = zombie;
      zombie1 = await Zombie.at(zombie1Addr);
      name = await zombie1.name();
      zombieDNA = +dna;
    });

    it("setDNA로 변경시 Zombie contract의 상태가 바뀌어야 합니다.", async () => {
      const res = await zombie1.setDNA(zombieTemp.address, dnaModified);

      dna = await zombie1.dna();

      assert.strictEqual(+dna, dnaModified, `DNA should be ${dnaModified}`);
    });

    it("setDNA로 변경시 ZombieTemp contract의 상태가 바뀌지 않아야 합니다.", async () => {
      const res = await zombie1.setDNA(zombieTemp.address, dnaModified);
      dna = await zombieTemp.dna();
      console.log("dna state of zombieTemp contract", +dna);
      assert.notStrictEqual(
        +dna,
        dnaModified,
        `DNA should not be ${dnaModified}`
      );
    });
  });

  describe("Staticcall", () => {
    let tx, zombie1Addr, name, zombieDNA, zombie1;
    const dnaModified = 12345678;
    beforeEach(async () => {
      tx = await zombieFactory.createRandomZombie(name1);
      var { zombie, dna } = tx.logs[0].args;
      zombie1Addr = zombie;
      zombie1 = await Zombie.at(zombie1Addr);
      name = await zombie1.name();
      zombieDNA = +dna;
    });
    it("staticcall로 state 변경하려고 하면?", async () => {
      const res = await zombie1.setDNAbyStaticcall(
        zombieTemp.address,
        dnaModified
      );
      // staticcall은 call처럼 zombieTemp의 상태변수를 바꿔야한다.
      dna = await zombieTemp.dna();
      console.log("dna state of zombieTemp contract", +dna);
      assert.notStrictEqual(
        +dna,
        dnaModified,
        `DNA should not be ${dnaModified}`
      );
    });
  });
  */
});
