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