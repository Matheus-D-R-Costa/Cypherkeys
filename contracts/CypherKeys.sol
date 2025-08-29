// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

 * @author Copyright (c) 2025 Matheus Costa
 * @Notice CypherKeys é um contrato de identidade criptográfica e atestados.
 * Cada cypherKey é uma identidade. As interações são assinaturas criptográficas verificadas on-chain.
contract CypherKeys is ERC721, EIP712, Ownable {

    using Counters for Counters.Counter;

    Counters.Counter private _cypherKeyCounter;

    mapping(uint256 => address) public cypherIdentities;

    event CypherKeyMinted(uint256 indexed cypherKey, address indexed owner);

    constructor(address initialOwner)
        ERC721("CypherKey", "CKEY")
        EIP712("CypherKey", "1")
        Ownable(initialOwner)
    {}

    function mint(address to) public {
        uint256 cypherKey;

        unchecked {
            cypherKey = _cypherKeyCounter.current();
            _cypherKeyCounter.increment();
        }

        _safeMint(to, cypherKey);
        cypherIdentities[cypherKey] = to;
    
        emit CypherKeyMinted(cypherKey, to);
    }
}
