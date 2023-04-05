const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const {
  createAddress2,
  nameToSalt,
  encodeParams,
  decodeEvent,
  EVENT_TYPES_CREATE,
} = require("./utils/utils.js");

const {
  bytecode: zombieBytecode,
} = require("../artifacts/contracts/Zombie.sol/Zombie.json");

const REVERT_MESSAGE =
  "VM Exception while processing transaction: revert without reason string";

// const ZombieTemp = artifacts.require("ZombieTemp"); 나중에 쓸거임

describe("ZombieFactory", async () => {
  let factory, zombieTemp;
  const dnaModified = 1234567890;
  before(async () => {
    this.GILDONG = "Gildong";
    this.CHULSOO = "Chulsoo";
    this.WONKI = "Wonki";

    this.Factory = await ethers.getContractFactory("ZombieFactory");
    factory = await this.Factory.deploy();
    await factory.deployed();
    console.log("Deployed Factory: ", factory.address);

    this.Zombie = await ethers.getContractFactory("Zombie");

    this.ZombieTemp = await ethers.getContractFactory("ZombieTemp");
    zombieTemp = await this.ZombieTemp.deploy();
    await zombieTemp.deployed();
  });

  const createZombie = async (name) => {
    // tx ~ res 가져오는거는 utils에 구현, decode에 들어가는 배열은 인자로 받는 형식으로
    const tx = await factory.createRandomZombie(name);

    const receipt = await tx.wait();

    let [address, dna] = decodeEvent(EVENT_TYPES_CREATE, receipt);
    dna = +dna;
    const contract = this.Zombie.attach(address);

    return { address, dna, contract };
  };

  // create2
  const create2Zombie = async (name) => {
    const tx = await factory.createRandomZombieV2(name);

    const receipt = await tx.wait();

    let [address, dna] = decodeEvent(EVENT_TYPES_CREATE, receipt);
    dna = +dna;
    const contract = this.Zombie.attach(address);

    // returns address and contract
    return { address, dna, contract };
  };

  const selfdestruct = async (contract) => {
    await contract.destroy(factory.address);
  };

  describe("'CREATE' and 'CREATE2", () => {
    it("'CREATE'로 생성시 두 컨트랙트의 주소가 달라야 합니다.", async () => {
      const { address: gildongAddress, contract: gildongContract } =
        await createZombie(this.GILDONG);

      let name = await gildongContract.name();

      expect(this.GILDONG).to.equal(
        name,
        `Expect ${this.GILDONG}, got ${name}`
      );

      const { address: chulsooAddress, contract: chulsooContract } =
        await createZombie(this.CHULSOO);
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

    it("'CREATE'로 생성하는 좀비의 이름이 같아도 성공해야 합니다.", async () => {
      const { contract: gildongContract } = await createZombie(this.GILDONG);
      await gildongContract.deployed();

      const { contract: gildong2Contract } = await createZombie(this.GILDONG);
      await gildong2Contract.deployed();
    });

    it("'CREATE2'로 생성하는 좀비의 이름이 같으면 실패해야 합니다.", async () => {
      const { contract: gildongContract } = await create2Zombie(this.GILDONG);

      await gildongContract.deployed();

      await expectRevert(
        factory.createRandomZombieV2(this.GILDONG),
        REVERT_MESSAGE
      );

      selfdestruct(gildongContract);
    });

    it("'CREAT2'로 생성된 주소와 오프체인에서 특정한 주소와 같아야 합니다.", async () => {
      const {
        address: gildongAddress,
        dna: gildongDNA,
        contract: gildongContract,
      } = await create2Zombie(this.GILDONG);

      dnaString = (+gildongDNA).toString();

      const params = encodeParams(
        ["string", "uint"],
        [this.GILDONG, dnaString]
      );

      const bytecode = `${zombieBytecode}${params.slice(2)}`;
      const bytecodeFromContract = await factory.getBytecode(
        this.GILDONG,
        +gildongDNA
      );
      assert.equal(bytecodeFromContract, bytecode, "bytecode differs ");

      const salt = nameToSalt(this.GILDONG);
      assert.equal(await factory.getSalt(this.GILDONG), salt, "salt differs");

      const computeAddr = createAddress2(
        factory.address,
        this.GILDONG,
        bytecode
      );
      assert.equal(gildongAddress.toLowerCase(), computeAddr, "addr differs");

      selfdestruct(gildongContract);
    });

    it("이름이 다른 두 좀비의 주소가 달라야 합니다.", async () => {
      const { address: gildongAddress } = await create2Zombie(this.GILDONG);
      const { address: chulsooAddress } = await create2Zombie(this.CHULSOO);

      expect(gildongAddress).not.to.equal(
        chulsooAddress,
        "Address should not be same"
      );
    });
  });

  describe("Modifying state with delegatecall", () => {
    beforeEach(async () => {
      let { address, dna, contract } = await createZombie(this.GILDONG);
      this.gildongAddress = address;
      this.gildongDNA = dna;
      this.gildongContract = contract;
    });

    it("setDNA로 변경시 Zombie contract의 상태가 바뀌어야 합니다.", async () => {
      // set event 확인할 필요 있다.
      await this.gildongContract.setDNA(zombieTemp.address, dnaModified);

      const dna = await this.gildongContract.dna();

      expect(+dna).to.equal(dnaModified);
    });

    it("setDNA로 변경시 ZombieTemp contract의 상태가 바뀌지 않아야 합니다.", async () => {
      await this.gildongContract.setDNA(zombieTemp.address, dnaModified);

      const dnaTemp = await zombieTemp.dna();
      console.log("dna state of zombieTemp contract", +dnaTemp);
      expect(+dnaTemp).not.to.equal(dnaModified);
      expect(+dnaTemp).to.equal(0);
    });
  });

  describe("Staticcall", () => {
    beforeEach(async () => {
      let { address, dna, contract } = await createZombie(this.GILDONG);
      this.gildongAddress = address;
      this.gildongDNA = dna;
      this.gildongContract = contract;
    });

    it("staticcall로 state 변경하려고 하면 reverts", async () => {
      await this.gildongContract.setDNAbyStaticcall(
        zombieTemp.address,
        dnaModified
      );
      // staticcall은 call처럼 zombie의 상태변수를 바꿔야한다.
      dnaTemp = await zombieTemp.dna();
      console.log("dna state of zombieTemp contract", +dnaTemp);
      expect(+dnaTemp).to.equal(dnaModified);
    });
  });
});
