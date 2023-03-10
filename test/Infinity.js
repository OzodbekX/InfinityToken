const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Token contract", function () {
  async function deployTokenFixture() {
    const Token = await ethers.getContractFactory("Infinity");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await Token.deploy();

    await hardhatToken.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { Token, hardhatToken, owner, addr1, addr2 };
  }
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Infinity");

    const hardhatToken = await Token.deploy();

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
  it("Should transfer tokens between accounts", async function () {
    const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
      deployTokenFixture
    );
    await hardhatToken.mint(owner.address, 1000000000000000000n)

    // Transfer 50 tokens from owner to addr1
    await expect(
      hardhatToken.transfer(addr1.address, 50)
    ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

    // Transfer 50 tokens from addr1 to addr2
    // We use .connect(signer) to send a transaction from another account
    await expect(
      hardhatToken.connect(addr1).transfer(addr2.address, 50)
    ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
  });
  it("Test pause and unpause functions", async function () {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Infinity");
    const hardhatToken = await Token.deploy();
    await hardhatToken.mint(owner.address, 1000000000000000000n)
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    await hardhatToken.pause();
    try {
      await hardhatToken.mint(owner.address, 1000000000000000000n)
    } catch {
      null
    }
    await hardhatToken.unpause();
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
  it("Should assign the total supply of tokens to the owner", async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
  it.skip("Test burn function", async function () {
    const {Token, hardhatToken, owner, addr1, addr2 } = await loadFixture(
      deployTokenFixture
    );
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    await hardhatToken.mint(owner.address, 1000000000000000000n)
    // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    console.log("hardhatToken",);
    Token?.interface?.functions?.burn(owner.address, 1000000000000000000n)
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);

  });
});