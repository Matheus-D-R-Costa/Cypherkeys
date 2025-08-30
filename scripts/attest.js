// scripts/02_attest.js
const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Configuração dos CypherKeys (baseado nos IDs criados anteriormente)
const ATTESTATION_CONFIG = {
    fromCypherKey: 5, // CypherKey de Alice (account1)
    toCypherKey: 6    // CypherKey de Bob (account2)
};

/**
 * Verifica se o contrato existe no endereço especificado
 * @param {string} contractAddress - Endereço do contrato
 * @returns {Promise<boolean>} - True se o contrato existe
 */
async function verifyContractExists(contractAddress) {
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error(`Contrato não encontrado no endereço ${contractAddress}`);
    }
    return true;
}

async function verifyCypherKeys(contract, fromCypherKey, toCypherKey) {
    console.log("Verificando existência das CypherKeys...");
    
    try {
        const fromOwner = await contract.ownerOf(fromCypherKey);
        const toOwner = await contract.ownerOf(toCypherKey);
        
        console.log(`CypherKey #${fromCypherKey} pertence a: ${fromOwner}`);
        console.log(`CypherKey #${toCypherKey} pertence a: ${toOwner}`);
        
        return { fromOwner, toOwner };
    } catch (error) {
        throw new Error(`Erro ao verificar CypherKeys: ${error.message}`);
    }
}

async function checkExistingLink(contract, fromCypherKey, toCypherKey) {
    const linkExists = await contract.cryptographyLinks(fromCypherKey, toCypherKey);
    if (linkExists) {
        console.log(`Link criptográfico de #${fromCypherKey} para #${toCypherKey} já existe!`);
        return true;
    }
    return false;
}

async function generateAttestationSignature(contract, signer, fromCypherKey, toCypherKey) {
    console.log("Gerando assinatura EIP-712...");
    
    // Obter nonce atual
    const signerIdentity = await contract.cypherIdentities(fromCypherKey);
    const nonce = await contract.nonces(signerIdentity);
    
    console.log(`Nonce atual para ${signerIdentity}: ${nonce}`);
    console.log(`Signer address: ${signer.address}`);
    console.log(`SignerIdentity: ${signerIdentity}`);
    
    if (signerIdentity.toLowerCase() !== signer.address.toLowerCase()) {
        throw new Error(`Signer ${signer.address} não é a identidade da CypherKey #${fromCypherKey} (identidade: ${signerIdentity})`);
    }
    
    const domain = {
        name: "CypherKey",
        version: "1",
        chainId: (await hre.ethers.provider.getNetwork()).chainId,
        verifyingContract: CONTRACT_ADDRESS,
    };
    
    console.log("Domínio EIP-712:", domain);
    
    const types = {
        Attestation: [
            { name: "fromCypherKey", type: "uint256" },
            { name: "toCypherKey", type: "uint256" },
            { name: "nonce", type: "uint256" },
        ],
    };
    
    const value = {
        fromCypherKey: fromCypherKey,
        toCypherKey: toCypherKey,
        nonce: nonce,
    };
    
    console.log("Dados para assinatura:", value);
    
    const signature = await signer.signTypedData(domain, types, value);
    console.log("Assinatura EIP-712 gerada com sucesso!");
    console.log("Assinatura:", signature);
    
    return signature;
}

async function submitAttestation(contract, submitter, fromCypherKey, toCypherKey, signature) {
    console.log("Submetendo atestação on-chain...");
    
    const toOwner = await contract.ownerOf(toCypherKey);
    console.log(`Verificando proprietário da CypherKey #${toCypherKey}: ${toOwner}`);
    console.log(`Endereço do submitter: ${submitter.address}`);
    
    if (toOwner.toLowerCase() !== submitter.address.toLowerCase()) {
        throw new Error(`Submitter ${submitter.address} não é o proprietário da CypherKey #${toCypherKey} (proprietário: ${toOwner})`);
    }
    
    const tx = await contract.connect(submitter).attest(fromCypherKey, toCypherKey, signature);
    console.log(`Transação enviada: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log("Atestação confirmada na blockchain!");
    
    return tx.hash;
}

async function verifyAttestationResult(contract, fromCypherKey, toCypherKey) {
    const linkExists = await contract.cryptographyLinks(fromCypherKey, toCypherKey);
    
    if (linkExists) {
        console.log(`Link criptográfico verificado: #${fromCypherKey} → #${toCypherKey}`);
        return true;
    } else {
        console.log(`Link criptográfico não foi criado: #${fromCypherKey} → #${toCypherKey}`);
        return false;
    }
}

/**
 * Exibe o resumo da atestação
 * @param {Object} attestationData - Dados da atestação
 */
function displayAttestationSummary(attestationData) {
    console.log("\nResumo da Atestação Criptográfica:");
    console.log("=" .repeat(50));
    console.log(`Assinante: ${attestationData.fromOwner}`);
    console.log(`   CypherKey: #${attestationData.fromCypherKey}`);
    console.log("");
    console.log(`Receptor: ${attestationData.toOwner}`);
    console.log(`   CypherKey: #${attestationData.toCypherKey}`);
    console.log("");
    console.log(`Link: #${attestationData.fromCypherKey} → #${attestationData.toCypherKey}`);
    console.log(`Transaction: ${attestationData.txHash}`);
    console.log("");
    console.log("Atestação criptográfica concluída com sucesso!");
}

async function main() {
    try {
        const { fromCypherKey, toCypherKey } = ATTESTATION_CONFIG;
        const [account1, account2] = await hre.ethers.getSigners();
        
        console.log("iniciando processo de atestação criptográfica...");
        console.log(`Configuração: CypherKey #${fromCypherKey} → CypherKey #${toCypherKey}`);
        
        // Verificar contrato
        console.log("\nVerificando contrato...");
        await verifyContractExists(CONTRACT_ADDRESS);
        console.log("Contrato encontrado!");
        
        // Obter instância do contrato
        const cypherKeys = await hre.ethers.getContractAt("CypherKeys", CONTRACT_ADDRESS);
        
        // Verificar CypherKeys
        const { fromOwner, toOwner } = await verifyCypherKeys(cypherKeys, fromCypherKey, toCypherKey);
        
        // Verificar se o link já existe
        const linkExists = await checkExistingLink(cypherKeys, fromCypherKey, toCypherKey);
        if (linkExists) {
            console.log("⏭Pulando criação do link (já existe)");
            return;
        }
        
        // FASE 1: Geração da assinatura (off-chain)
        console.log("\nFASE 1: Geração da Assinatura (Off-Chain)");
        console.log("-" .repeat(50));
        
        const signature = await generateAttestationSignature(
            cypherKeys, 
            account1, 
            fromCypherKey, 
            toCypherKey
        );
        
        // FASE 2: Submissão on-chain
        console.log("\nFASE 2: Submissão On-Chain");
        console.log("-" .repeat(50));
        
        const txHash = await submitAttestation(
            cypherKeys, 
            account2, 
            fromCypherKey, 
            toCypherKey, 
            signature
        );
        
        // Verificar resultado
        console.log("\nFASE 3: Verificação do Resultado");
        console.log("-" .repeat(50));
        
        const success = await verifyAttestationResult(cypherKeys, fromCypherKey, toCypherKey);
        
        if (success) {
            // Exibir resumo
            const attestationData = {
                fromOwner,
                toOwner,
                fromCypherKey,
                toCypherKey,
                txHash
            };
            
            displayAttestationSummary(attestationData);
        }
        
    } catch (error) {
        console.error("Erro durante o processo de atestação:", error.message);
        throw error;
    }
}

// Executar script
main()
    .then(() => {
        console.log("Script de atestação executado com sucesso!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Falha na execução do script:", error);
        process.exitCode = 1;
    });