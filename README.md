# CypherKeys

[](https://opensource.org/licenses/MIT)
[](https://hardhat.org/)
[](https://soliditylang.org/)

**Identidade Soberana e Reputação Descentralizada na Blockchain.**

> **AVISO**: Este projeto é uma Prova de Conceito (POC). O código é uma ferramenta experimental e não foi auditado por terceiros. A soberania digital exige responsabilidade. Use por sua própria conta e risco.

-----

**CypherKeys** é um protocolo para **identidade soberana** e **atestações P2P (peer-to-peer)**.

Em vez de um NFT representar uma imagem, aqui, ele **É uma identidade criptográfica** – um endereço Ethereum encapsulado em um token ERC-721. As interações entre identidades não ocorrem através de sistemas centralizados, mas sim por meio de **provas criptográficas assinadas off-chain**.

O resultado é um sistema de reputação descentralizado (**Web of Trust**), onde cada elo de confiança pode ser registrado on-chain de forma imutável, se e quando os participantes decidirem.

## Tabela de Conteúdos

  - [Visão Geral](https://www.google.com/search?q=%23-vis%C3%A3o-geral)
  - [Princípios Fundamentais](https://www.google.com/search?q=%23-princ%C3%ADpios-fundamentais)
  - [Arquitetura](https://www.google.com/search?q=%23-arquitetura)
  - [Começando](https://www.google.com/search?q=%23-come%C3%A7ando)
      - [Pré-requisitos](https://www.google.com/search?q=%23pr%C3%A9-requisitos)
      - [Instalação e Deploy](https://www.google.com/search?q=%23instala%C3%A7%C3%A3o-e-deploy)
  - [Comandos Disponíveis](https://www.google.com/search?q=%23-comandos-dispon%C3%ADveis)
  - [Segurança](https://www.google.com/search?q=%23-seguran%C3%A7a)
      - [Análise com Slither](https://www.google.com/search?q=%23an%C3%A1lise-com-slither)
  - [Testes](https://www.google.com/search?q=%23-testes)
  - [Recursos Adicionais](https://www.google.com/search?q=%23-recursos-adicionais)
  - [Licença](https://www.google.com/search?q=%23-licen%C3%A7a)

## 🔭 Visão Geral

O CypherKeys busca resolver a dependência de plataformas centralizadas para gerenciamento de identidade e reputação. O protocolo permite que qualquer pessoa crie uma identidade soberana e estabeleça laços de confiança verificáveis com outras identidades de forma direta e segura.

> A integridade do protocolo é **matematicamente absoluta**. O estado de uma identidade e suas relações são gerados e validados inteiramente on-chain, eliminando dependências de sistemas de arquivos externos como *IPFS* ou *Arweave*, que podem introduzir vetores de falha.

## ✨ Princípios Fundamentais

1.  **🆔 Identidade como NFT**

      - Cada token ERC-721 é uma **CypherKey**, que encapsula uma identidade (`cypherIdentity`) – um endereço Ethereum.
      - O proprietário da CypherKey tem controle total sobre a identidade, podendo assinar mensagens em seu nome.

2.  **✍️ Atestações P2P (Peer-to-Peer)**

      - O dono de uma CypherKey pode assinar uma mensagem off-chain com o seguinte teor: *"Eu, dono do token \#X, atesto a confiança no token \#Y."*
      - Essa assinatura criptográfica pode ser compartilhada por qualquer canal P2P (mensagens, e-mail, etc.), sem a necessidade de um intermediário.

3.  **🔗 Registro On-chain (Opcional)**

      - A parte que recebe a atestação pode, opcionalmente, submeter a assinatura ao smart contract.
      - O contrato valida a prova criptográfica. Se for válida, ele registra um **Elo Criptográfico** (`cryptographicLinks`) imutável na blockchain.

## 🏗️ Arquitetura

### Contrato Principal: `CypherKeys.sol`

O contrato é construído sobre padrões sólidos como `ERC721` (NFTs), `EIP712` (assinaturas tipadas) e `Ownable` (controle de acesso).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CypherKeys is ERC721, EIP712, Ownable {
    // Mapeamentos principais
    mapping(uint256 => address) public cypherIdentities;
    mapping(address => uint256) public nonces;
    mapping(uint256 => mapping(uint256 => bool)) public cryptographicLinks;

    // Eventos
    event CypherKeyMinted(uint256 indexed tokenId, address indexed identity, address indexed owner);
    event AttestationRecorded(uint256 indexed from, uint256 indexed to);

    // Funções principais
    function mint(address to) public;
    function attest(uint256 fromTokenId, uint256 toTokenId, bytes calldata signature) public;
}
```

## 🚀 Começando

### Pré-requisitos

  - Node.js (v18 ou superior)
  - PNPM
  - Docker

### Instalação e Deploy

1.  **Clone o repositório**

    ```bash
    git clone <repository-url>
    cd CypherKeys
    ```

2.  **Instale as dependências**

    ```bash
    pnpm install
    ```

3.  **Configure as variáveis de ambiente**
    Crie uma cópia do arquivo de exemplo e preencha com suas chaves e URLs.

    ```bash
    cp .env.example .env
    ```

4.  **Compile o contrato**

    ```bash
    pnpm run compile
    ```

5.  **Faça o deploy (em uma rede local)**

    ```bash
    pnpm run deploy:localhost
    ```

## 🔧 Comandos Disponíveis

Todos os comandos principais do projeto podem ser executados via `pnpm run`.

  - `pnpm run compile`

      - Compila os smart contracts do projeto.

  - `pnpm run deploy:localhost`

      - Faz o deploy do contrato na rede local (`localhost`).

  - `pnpm run mint:localhost`

      - Executa o script `scripts/mint.js` para criar novas CypherKeys na rede local.

  - `pnpm run attest:localhost`

      - Executa o script `scripts/attest.js` para criar e registrar uma atestação na rede local.

  - `pnpm test`

      - Roda a suíte de testes do projeto.

  - `pnpm run coverage`

      - Gera um relatório de cobertura dos testes.

  - `pnpm run slither:build`

      - Constrói a imagem Docker para a análise de segurança com Slither.

  - `pnpm run slither`

      - Executa a análise de segurança com Slither usando a imagem Docker pré-construída.

  - `pnpm run slither:report`

      - Executa o Slither e salva os resultados em um arquivo `slither-report.json`.

## 🔐 Segurança

### Análise com Slither

A análise de segurança estática é feita com o Slither em um ambiente Docker autossuficiente. Essa abordagem garante que todas as dependências e ferramentas estejam corretamente configuradas, proporcionando resultados consistentes.

**Pré-requisitos:**

  - Docker instalado e em execução.
  - Um arquivo `Dockerfile.slither` na raiz do projeto.

**Como usar:**

O fluxo de trabalho consiste em construir a imagem e depois executá-la.

**Passo 1: Construir a imagem Docker**

Este comando precisa ser executado apenas uma vez ou sempre que você alterar as dependências do Node.js (`package.json`).

```bash
pnpm run slither:build
```

**Passo 2: Executar a análise**

Depois que a imagem for construída, use os seguintes comandos para analisar os contratos:

  - **Análise padrão (saída no terminal):**

    ```bash
    pnpm run slither
    ```

  - **Gerar um relatório em arquivo JSON:**

    ```bash
    pnpm run slither:json > slither-report.json
    ```

## 🧪 Testes

O projeto possui uma suíte de testes completa para garantir a qualidade e a segurança do código.

**Como executar os testes:**

  - **Rodar todos os testes:**

    ```bash
    pnpm test
    ```

  - **Gerar relatório de cobertura de testes:**

    ```bash
    pnpm run coverage
    ```

## 📚 Recursos Adicionais

  - [Documentação do Slither](https://github.com/crytic/slither)
  - [Hardhat Documentation](https://hardhat.org/docs)
  - [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
  - [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo [LICENSE](https://www.google.com/search?q=LICENSE) para mais detalhes.