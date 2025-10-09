from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os

KEY_FILE = "private_key.pem"

def generate_private_key():
    """Generates a 2048-bit RSA private key and saves it as private_key.pem if it doesn't exist."""
    if os.path.exists(KEY_FILE):
        print(f"🔑 Private key file ''{KEY_FILE}'' already exists. Skipping generation.")
        return

    print("🔑 Generating new private key...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    with open(KEY_FILE, "wb") as f:
        f.write(pem)
    
    print(f"✅ Private key saved to ''{KEY_FILE}'' successfully.")

if __name__ == "__main__":
    generate_private_key()
