const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CypherKeysModule", (m) => {
    const initialOwner = m.getParameter("initialOwner", "0xBcd4042DE499D14e55001CcbB24a551F3b954096");
    const cypherKeys = m.contract("CypherKeys", [initialOwner]);
    return { cypherKeys };
});
