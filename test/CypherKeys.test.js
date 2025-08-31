const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CypherKeys", function () {
    let CypherKeysFactory;
    let cypherKeys;
    let owner, user1, user2, otherAccount;

    const TOKEN_ID_0 = 0;
    const TOKEN_ID_1 = 1;
    const TOKEN_ID_10 = 10;
    const NON_EXISTENT_TOKEN_ID = 999;

    async function signAttestation(signer, contract, fromCypherKey, toCypherKey) {
        const domain = {
            name: 'CypherKey',
            version: '1',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: await contract.getAddress()
        };

        const types = {
            Attestation: [
                { name: 'fromCypherKey', type: 'uint256' },
                { name: 'toCypherKey', type: 'uint256' },
                { name: 'nonce', type: 'uint256' }
            ]
        };
        
        const signerIdentity = await contract.cypherIdentities(fromCypherKey);
        const nonce = await contract.nonces(signerIdentity);

        const value = {
            fromCypherKey,
            toCypherKey,
            nonce
        };

        return signer.signTypedData(domain, types, value);
    }

    beforeEach(async function () {
        [owner, user1, user2, otherAccount] = await ethers.getSigners();
        CypherKeysFactory = await ethers.getContractFactory("CypherKeys");
        cypherKeys = await CypherKeysFactory.deploy(owner.address);
        await cypherKeys.waitForDeployment();
    });

    describe("Deployment and Construction", function () {
        it("should set the correct owner", async function () {
            expect(await cypherKeys.owner()).to.equal(owner.address);
        });

        it("should set the ERC721 name and symbol correctly", async function () {
            expect(await cypherKeys.name()).to.equal("CypherKey");
            expect(await cypherKeys.symbol()).to.equal("CKEY");
        });

        it("should initialize cypherKeyCounter to 0", async function () {
            await cypherKeys.connect(user1).mint(user1.address);
            expect(await cypherKeys.ownerOf(TOKEN_ID_0)).to.equal(user1.address);
        });
    });

    describe("Minting (mint)", function () {
        it("should allow any user to mint a CypherKey for themselves", async function () {
            const mintTx = await cypherKeys.connect(user1).mint(user1.address);
            expect(await cypherKeys.ownerOf(TOKEN_ID_0)).to.equal(user1.address);
            expect(await cypherKeys.balanceOf(user1.address)).to.equal(1);
            expect(await cypherKeys.cypherIdentities(TOKEN_ID_0)).to.equal(user1.address);
            await expect(mintTx).to.emit(cypherKeys, "CypherKeyMinted").withArgs(TOKEN_ID_0, user1.address);
        });

        it("should allow a user to mint a CypherKey for another address", async function () {
            await cypherKeys.connect(user1).mint(user2.address);
            expect(await cypherKeys.ownerOf(TOKEN_ID_0)).to.equal(user2.address);
            expect(await cypherKeys.balanceOf(user2.address)).to.equal(1);
            expect(await cypherKeys.cypherIdentities(TOKEN_ID_0)).to.equal(user2.address);
        });

        it("should increment the cypherKeyCounter correctly on multiple mints", async function () {
            await cypherKeys.connect(user1).mint(user1.address);
            expect(await cypherKeys.ownerOf(TOKEN_ID_0)).to.equal(user1.address);
            await cypherKeys.connect(user2).mint(user2.address);
            expect(await cypherKeys.ownerOf(TOKEN_ID_1)).to.equal(user2.address);
        });
    });

    describe("Attestation (attest)", function () {
        beforeEach(async function() {
            await cypherKeys.connect(user1).mint(user1.address);
            await cypherKeys.connect(user2).mint(user2.address);
        });

        describe("Success Cases", function () {
            it("should successfully create a cryptographic link with a valid signature", async function () {
                const signature = await signAttestation(user1, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                const attestTx = await cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, signature);

                expect(await cypherKeys.cryptographyLinks(TOKEN_ID_0, TOKEN_ID_1)).to.be.true;
                expect(await cypherKeys.nonces(user1.address)).to.equal(1);
                await expect(attestTx).to.emit(cypherKeys, "CryptographyLinkCreated").withArgs(TOKEN_ID_0, TOKEN_ID_1);
            });
        });

        describe("Failure Cases and Reverts", function () {
            it("should revert if the sender is not the owner of the destination key (OnlyOwnerOfDestinationCanSubmit)", async function () {
                const signature = await signAttestation(user1, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                await expect(cypherKeys.connect(user1).attest(TOKEN_ID_0, TOKEN_ID_1, signature))
                    .to.be.revertedWithCustomError(cypherKeys, "OnlyOwnerOfDestinationCanSubmit");
            });

            it("should revert if the cryptographic link already exists (CryptographicLinkAlreadyExists)", async function () {
                let signature = await signAttestation(user1, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                await cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, signature);

                signature = await signAttestation(user1, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                await expect(cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, signature))
                    .to.be.revertedWithCustomError(cypherKeys, "CryptographicLinkAlreadyExists");
            });

            it("should revert if the identity of the source key is not defined (IdentityNotDefined)", async function () {
                await expect(cypherKeys.connect(user2).attest(NON_EXISTENT_TOKEN_ID, TOKEN_ID_1, "0x"))
                    .to.be.revertedWithCustomError(cypherKeys, "IdentityNotDefined");
            });

            it("should revert on a bad signature (wrong signer) (BadSignature)", async function () {
                const badSignature = await signAttestation(otherAccount, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                await expect(cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, badSignature))
                    .to.be.revertedWithCustomError(cypherKeys, "BadSignature");
            });
            
            it("should revert on a bad signature (replay attack with old nonce) (BadSignature)", async function () {
                const signatureForFirstLink = await signAttestation(user1, cypherKeys, TOKEN_ID_0, TOKEN_ID_1);
                await cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, signatureForFirstLink);

                const TOKEN_ID_2 = 2;
                await cypherKeys.connect(user2).mint(user2.address);

                await expect(
                    cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_2, signatureForFirstLink)
                ).to.be.revertedWithCustomError(cypherKeys, "BadSignature");
            });

            it("should revert on a bad signature (signed data mismatch) (BadSignature)", async function () {
                await cypherKeys.connect(otherAccount).mint(otherAccount.address);
                const OTHER_TOKEN_ID = 2;
                const signatureForOtherToken = await signAttestation(user1, cypherKeys, TOKEN_ID_0, OTHER_TOKEN_ID);

                await expect(cypherKeys.connect(user2).attest(TOKEN_ID_0, TOKEN_ID_1, signatureForOtherToken))
                    .to.be.revertedWithCustomError(cypherKeys, "BadSignature");
            });
        });
    });

    describe("Token URI (tokenURI)", function () {
        beforeEach(async function() {
            await cypherKeys.connect(user1).mint(user1.address);
            await cypherKeys.connect(user2).mint(user2.address);
            for (let i = 2; i < 11; i++) {
                await cypherKeys.connect(otherAccount).mint(otherAccount.address);
            }
        });

        it("should return a valid URI for tokenId 0", async function () {
            const tokenURI = await cypherKeys.tokenURI(TOKEN_ID_0);
            const base64String = tokenURI.split(',')[1];
            const metadata = JSON.parse(Buffer.from(base64String, 'base64').toString('utf-8'));
            expect(metadata.name).to.equal(`CypherKey #${TOKEN_ID_0}`);
        });

        it("should return a valid URI for a multi-digit tokenId", async function () {
            const tokenURI = await cypherKeys.tokenURI(TOKEN_ID_10);
            expect(tokenURI.startsWith("data:application/json;base64,")).to.be.true;
            
            const base64String = tokenURI.split(',')[1];
            const metadata = JSON.parse(Buffer.from(base64String, 'base64').toString('utf-8'));

            expect(metadata.name).to.equal(`CypherKey #${TOKEN_ID_10}`);
            expect(metadata.attributes[0].value.toLowerCase()).to.equal(otherAccount.address.toLowerCase());
        });

        it("should revert when querying the URI of a nonexistent token (NonexistentToken)", async function () {
            await expect(cypherKeys.tokenURI(NON_EXISTENT_TOKEN_ID))
                .to.be.revertedWithCustomError(cypherKeys, "NonexistentToken");
        });
    });
});