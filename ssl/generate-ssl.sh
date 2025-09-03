#!/bin/bash

# SSL Certificate Generation Script for Development/Testing
# For production, use certificates from a trusted CA like Let's Encrypt

echo "🔐 Generating SSL certificates for development..."

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Clean up CSR file
rm ssl/cert.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Files created:"
echo "   - ssl/cert.pem (certificate)"
echo "   - ssl/key.pem (private key)"
echo ""
echo "⚠️  IMPORTANT FOR PRODUCTION:"
echo "   - Replace these self-signed certificates with real certificates"
echo "   - Use Let's Encrypt, Cloudflare, or your preferred CA"
echo "   - Update nginx configuration with your domain name"