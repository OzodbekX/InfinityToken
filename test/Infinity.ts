import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
const { BigNumber } = require("ethers");

describe("Infinity", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Infinity = await ethers.getContractFactory("Infinity");
    const infinity = await Infinity.deploy(unlockTime, { value: lockedAmount });

    return { infinity, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { infinity, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await infinity.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { infinity, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await infinity.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to infinity", async function () {
      const { infinity, lockedAmount } = await loadFixture(deployOneYearLockFixture);

      expect(await ethers.provider.getBalance(infinity.address)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Infinity = await ethers.getContractFactory("Infinity");
      await expect(Infinity.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { infinity } = await loadFixture(deployOneYearLockFixture);

        await expect(infinity.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { infinity, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use infinity.connect() to send a transaction from another account
        await expect(infinity.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { infinity, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(infinity.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { infinity, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(infinity.withdraw())
          .to.emit(infinity, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { infinity, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(infinity.withdraw()).to.changeEtherBalances(
          [owner, infinity],
          [lockedAmount, -lockedAmount]
        );
      });
    });


    describe("Token contract", function () {
      it("Deployment should assign the total supply of tokens to the owner", async function () {
        const [owner] = await ethers.getSigners();
        const { infinity } = await loadFixture(deployOneYearLockFixture);
        const ownerBalance = await infinity.balanceOf(owner.address);
        expect(await infinity.totalSupply()).to.equal(ownerBalance);
      });
      it("Should transfer tokens between accounts", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const { infinity } = await loadFixture(deployOneYearLockFixture);

        await infinity.mint(owner.address, 1000000000000000)

        // Transfer 50 tokens from owner to addr1
        await expect(
          infinity.transfer(addr1.address, 50)
        ).to.changeTokenBalances(infinity, [owner, addr1], [-50, 50]);

        // Transfer 50 tokens from addr1 to addr2
        // We use .connect(signer) to send a transaction from another account
        await expect(
          infinity.connect(addr1).transfer(addr2.address, 50)
        ).to.changeTokenBalances(infinity, [addr1, addr2], [-50, 50]);
      });
      it("Test pause and unpause functions", async function () {
        const [owner] = await ethers.getSigners();
        const { infinity } = await loadFixture(deployOneYearLockFixture);
        await infinity.mint(owner.address, 1000000000000000)
        const ownerBalance = await infinity.balanceOf(owner.address);
        await infinity.pause();
        try {
          await infinity.mint(owner.address, 1000000000000000)
        } catch {
          null
        }
        await infinity.unpause();
        expect(await infinity.totalSupply()).to.equal(ownerBalance);
      });
      it("Should assign the total supply of tokens to the owner", async function () {
        const [owner] = await ethers.getSigners();
        const { infinity } = await loadFixture(deployOneYearLockFixture);
        const ownerBalance = await infinity.balanceOf(owner.address);
        expect(await infinity.totalSupply()).to.equal(ownerBalance);
      });
      it("Test burn function", async function () {
        const [owner] = await ethers.getSigners();
        const { infinity } = await loadFixture(deployOneYearLockFixture);
        const ownerBalance = await infinity.balanceOf(owner.address);
        await infinity.mint(owner.address, 1000000000000000)
        await infinity["burn(address,uint256)"](owner.address, 1000000000000000)
        expect(BigNumber.from(await infinity.totalSupply()).toString()).to.equal(BigNumber.from(ownerBalance).toString());
      });
    });
  });
});
