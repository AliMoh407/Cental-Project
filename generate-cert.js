const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Create SSL directory if it doesn't exist
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

// Generate a new key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a new certificate
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// Set certificate attributes
const attrs = [{
    name: 'commonName',
    value: 'localhost'
}, {
    name: 'countryName',
    value: 'US'
}, {
    shortName: 'ST',
    value: 'State'
}, {
    name: 'localityName',
    value: 'City'
}, {
    name: 'organizationName',
    value: 'Car Rental'
}, {
    shortName: 'OU',
    value: 'Development'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Self-sign the certificate
cert.sign(keys.privateKey);

// Convert to PEM format
const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
const certificatePem = forge.pki.certificateToPem(cert);

// Save the files
fs.writeFileSync(path.join(sslDir, 'private.key'), privateKeyPem);
fs.writeFileSync(path.join(sslDir, 'certificate.crt'), certificatePem);

console.log('SSL certificates generated successfully!');
console.log('Private key saved to:', path.join(sslDir, 'private.key'));
console.log('Certificate saved to:', path.join(sslDir, 'certificate.crt')); 