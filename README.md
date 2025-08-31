# CypherKeys

> **NOTA**: *Este projeto é uma POC. (Este código é uma ferramenta. Não foi auditado por terceiros. A soberania exige responsabilidade. Use por sua própria conta e risco.)*

CypherKeys é um protocolo experimental de **identidade soberana** e **atestações P2P**.

Cada NFT não representa uma imagem. Ele **É uma identidade criptográfica** – um endereço Ethereum encapsulado em um token ERC-721. As interações entre tokens não acontecem via interações centralizadas, mas através de **provas criptográficas assinadas off-chain**.

O resultado teórico é um **sistema de reputação descentralizado (Web of Trust)** onde cada relação é registrada on-chain somente quando os participantes quiserem.

## Conceito

1. **Identidade como NFT**  
   - Cada token ERC-721 representa uma **CypherKey**, que carrega uma identidade (`cypherIdentity`) – um endereço.  
   - O dono da CypherKey controla a identidade e pode assinar mensagens.

2. **Atestações P2P (Peer-to-Peer)**  
   - O dono de uma CypherKey assina off-chain uma mensagem dizendo:  
     *"Eu, dono do token #X, atesto o token #Y."*  
   - Essa assinatura pode ser enviada diretamente ao outro usuário por qualquer canal P2P (mensagem, e-mail, etc).

3. **Registro On-chain (opcional)**  
   - O dono do token de destino pode submeter a assinatura ao contrato.  
   - O contrato valida criptograficamente a assinatura e, se for válida, registra o **Elo Criptográfico** (`cryptographicLinks[from][to] = true`).  
   - Isso cria uma rede imutável de confiança (Web of Trust) na blockchain.

Matematicamente a integridade do protocolo é **absoluta**. O **estado de uma identidade e suas relações são gerados e validados on-chain**, eliminando dependências de sistemas de arquivos externos como *IPFS* ou *Arweave*, que introduzem vetores de falha muitas vezes desnecessários.

## 🚀 Instalação

### Pré-requisitos

- Node.js (versão 18 ou superior)
- pnpm (recomendado) ou npm
- Hardhat

### Setup

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd Cypherkeys
   ```

2. **Instale as dependências**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

## 🏗️ Arquitetura

### Contrato Principal: `CypherKeys.sol`

```solidity
contract CypherKeys is ERC721, EIP712, Ownable {
    // Mapeamentos principais
    mapping(uint256 => address) public cypherIdentities;     // Token ID -> Identidade
    mapping(address => uint256) public nonces;               // Identidade -> Nonce
    mapping(uint256 => mapping(uint256 => bool)) public cryptographyLinks; // From -> To -> Link
    
    // Funções principais
    function mint(address to) public;                        // Criar nova CypherKey
    function attest(uint256 from, uint256 to, bytes calldata signature) public; // Registrar atestação
}
```

### Estrutura de Dados

- **CypherKey**: Token ERC-721 que representa uma identidade
- **CypherIdentity**: Endereço Ethereum associado à CypherKey
- **CryptographicLink**: Relação de confiança entre duas CypherKeys
- **Attestation**: Assinatura EIP-712 que prova uma atestação

## 📖 Uso

### 1. Deploy do Contrato

```bash
# Compilar o contrato
npx hardhat compile

# Deploy usando Hardhat Ignition
npx hardhat ignition deploy ignition/modules/CypherKeys.js --network localhost
```

### 2. Criar CypherKeys (Mint)

```bash
# Executar script de mint
npx hardhat run scripts/mint.js --network localhost
```

### 3. Criar Atestações

```bash
# Executar script de atestação
npx hardhat run scripts/attest.js --network localhost
```

## 🔧 Scripts Disponíveis

### `scripts/mint.js`
Cria CypherKeys para múltiplas contas.

**Funcionalidades:**
- Verifica existência do contrato
- Valida função de mint
- Cria CypherKeys para account1 e account2
- Exibe resumo das identidades criadas

### `scripts/attest.js`
Executa o processo completo de atestação criptográfica.

**Funcionalidades:**
- Verifica existência das CypherKeys
- Gera assinatura EIP-712 off-chain
- Submete atestação on-chain
- Valida criação do link criptográfico

## 🔐 Segurança

### EIP-712 Signatures

O protocolo utiliza assinaturas EIP-712 para garantir a integridade das atestações:

```javascript
const domain = {
    name: "CypherKey",
    version: "1",
    chainId: network.chainId,
    verifyingContract: contractAddress,
};

const types = {
    Attestation: [
        { name: "fromCypherKey", type: "uint256" },
        { name: "toCypherKey", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
};
```

### Validações On-chain

1. **Existência dos Tokens**: Verifica se as CypherKeys existem
2. **Propriedade**: Confirma que o msg.sender é o proprietário da CypherKey de destino
3. **Nonce**: Previne replay attacks usando nonces incrementais
4. **Assinatura**: Valida a assinatura EIP-712 usando ECDSA recovery

### Testes Disponíveis

- **Deploy**: Verifica se o contrato é deployado corretamente
- **Mint**: Testa a criação de CypherKeys

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.