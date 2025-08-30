// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @author Copyright (c) 2025 Matheus Costa
 * @notice CypherKeys is a cryptographic identity and attestation contract.
 * Each cypherKey is an identity. Interactions are cryptographic signatures verified on-chain.
 */
contract CypherKeys is ERC721, EIP712, Ownable {

    uint256 private _cypherKeyCounter;    
    mapping(uint256 => address) public cypherIdentities;
    mapping(address => uint256) public nonces;
    bytes32 private constant ATTESTATION_TYPEHASH = keccak256("Attestation(uint256 fromCypherKey, uint256 toCypherKey, uint256 nonce)");
    mapping(uint256 => mapping(uint256 => bool)) public cryptographyLinks;
    struct Attestation {
        uint256 fromCypherKey;
        uint256 toCypherKey;
        uint256 nonce;
    }

    event CypherKeyMinted(uint256 indexed cypherKey, address indexed owner);
    event CryptographyLinkCreated(uint256 indexed fromCypherKey, uint256 indexed toCypherKey);

    error NonexistentToken();
    error OnlyOwnerOfDestinationCanSubmit();
    error IdentityNotDefined();
    error BadSignature();
    error CryptographicLinkAlreadyExists();

    constructor(address initialOwner)
        ERC721("CypherKey", "CKEY")
        EIP712("CypherKey", "1")
        Ownable(initialOwner)
    {}

    function mint(address to) public {
        uint256 cypherKey;

        unchecked {
            cypherKey = _cypherKeyCounter;
            _cypherKeyCounter++;
        }

        _safeMint(to, cypherKey);
        cypherIdentities[cypherKey] = to;

        emit CypherKeyMinted(cypherKey, to);
    }

    function attest(uint256 fromCypherKey, uint256 toCypherKey, bytes calldata signature) public {
        address toOwner = ownerOf(toCypherKey);
        if (toOwner != msg.sender) revert OnlyOwnerOfDestinationCanSubmit();
        
        if (cryptographyLinks[fromCypherKey][toCypherKey]) revert CryptographicLinkAlreadyExists();

        address signerIdentity = cypherIdentities[fromCypherKey];
        if (signerIdentity == address(0)) revert IdentityNotDefined();

        uint256 nonce = nonces[signerIdentity];
        bytes32 structHash = keccak256(abi.encode(ATTESTATION_TYPEHASH, fromCypherKey, toCypherKey, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);

        address recoveredAddress = ECDSA.recover(digest, signature);
        if (recoveredAddress != signerIdentity) revert BadSignature();

        unchecked {
            nonces[signerIdentity]++;
        }

        cryptographyLinks[fromCypherKey][toCypherKey] = true;

        emit CryptographyLinkCreated(fromCypherKey, toCypherKey);
    }

    function exists(uint256 tokenId) private view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!exists(tokenId)) revert NonexistentToken();
        address identityAddress = cypherIdentities[tokenId];

        string memory name = string(abi.encodePacked("CypherKey #", _toString(tokenId)));
        string memory identity = _toHexString(identityAddress);
        string memory description = "A sovereign cryptographic identity.";

        return string(abi.encodePacked(
            _baseURI(),
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"', name, '",',
                '"description":"', description, '",',
                '"attributes":[{ "trait_type": "Cypher Identity", "value": "', identity, '"}]}'
            )))
        ));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    function _toHexString(address addr) internal pure returns (string memory) {
        bytes20 value = bytes20(addr);
        bytes memory buffer = new bytes(42);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            buffer[2+i*2] = _forHex(uint8(value[i] >> 4));
            buffer[3+i*2] = _forHex(uint8(value[i] & 0x0f));
        }

        return string(buffer);
    }

    function _forHex(uint8 halfbyte) internal pure returns (bytes1) {
        return halfbyte < 10 ? bytes1(uint8(48 + halfbyte)) : bytes1(uint8(87 + halfbyte));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }
}
