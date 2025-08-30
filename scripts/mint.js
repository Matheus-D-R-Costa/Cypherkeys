// scripts/01_mint.js
const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function verifyContractExists(contractAddress) {
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error(`Contrato não encontrado no endereço ${contractAddress}`);
    }
    return true;
}

async function verifyMintFunction(contract, address) {
    try {
        await contract.mint.staticCall(address);
        console.log("Função mint está disponível no contrato");
    } catch (error) {
        console.log("Erro ao verificar função mint:", error.message);
        throw error;
    }
}

function extractTokenIdFromTransferEvent(receipt) {
    const erc721Interface = new hre.ethers.Interface([
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ]);

    const transferEvent = receipt.logs.find(log => {
        try {
            const parsed = erc721Interface.parseLog(log);
            return parsed.name === 'Transfer';
        } catch {
            return false;
        }
    });

    if (!transferEvent) {
        throw new Error("Evento Transfer não encontrado no receipt");
    }

    const parsedEvent = erc721Interface.parseLog(transferEvent);
    const tokenId = parsedEvent.args.tokenId;
    
    return typeof tokenId === 'bigint' ? Number(tokenId) : tokenId;
}

async function mintCypherKey(contract, signer, recipientAddress) {
    console.log(`\nForjando uma CypherKey para: ${recipientAddress}...`);
    
    const tx = await contract.connect(signer).mint(recipientAddress);
    console.log(`Transação enviada: ${tx.hash}`);
    
    const receipt = await tx.wait();
    const tokenId = extractTokenIdFromTransferEvent(receipt);
    
    console.log(`CypherKey #${tokenId} forjada com sucesso!`);
    console.log(`Transaction: ${tx.hash}`);
    
    return tokenId;
}

function displayIdentitiesSummary(identities) {
    console.log("\nIdentidades Criptográficas Criadas:");
    console.log("=" .repeat(50));
    
    identities.forEach((identity, index) => {
        console.log(`${index + 1}. Dono: ${identity.address}`);
        console.log(`   CypherKey ID: #${identity.tokenId}`);
        console.log("");
    });
    
    console.log("Processo de mint concluído com sucesso!");
}

async function main() {
    try {
        // Obter signers
        const [account1, account2] = await hre.ethers.getSigners();
        
        // Verificar contrato
        console.log("Verificando contrato...");
        await verifyContractExists(CONTRACT_ADDRESS);
        console.log("Contrato encontrado!");
        
        // Obter instância do contrato
        const cypherKeys = await hre.ethers.getContractAt("CypherKeys", CONTRACT_ADDRESS);
        
        // Verificar função mint
        await verifyMintFunction(cypherKeys, account1.address);
        
        // Executar mints
        const tokenId1 = await mintCypherKey(cypherKeys, account1, account1.address);
        const tokenId2 = await mintCypherKey(cypherKeys, account2, account2.address);
        
        // Exibir resumo
        const identities = [
            { address: account1.address, tokenId: tokenId1 },
            { address: account2.address, tokenId: tokenId2 }
        ];
        
        displayIdentitiesSummary(identities);
        
    } catch (error) {
        console.error("Erro durante o processo de mint:", error.message);
        throw error;
    }
}

// Executar script
main()
    .then(() => {
        console.log("Script executado com sucesso!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Falha na execução do script:", error);
        process.exitCode = 1;
    });