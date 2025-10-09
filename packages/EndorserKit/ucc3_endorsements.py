import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def sign_endorsement(endorsement_data, endorser_name, private_key_pem: str = None, private_key_object=None):
    """
    Signs an endorsement using an RSA private key.

    Args:
        endorsement_data: The endorsement object/data to be signed.
                          It should have a __str__ method or be directly convertible to string.
        endorser_name (str): The name of the endorser (used for context, not for key loading).
        private_key_pem (str, optional): The RSA private key as a PEM-formatted string.
        private_key_object: An already loaded cryptography RSA private key object.
                            If private_key_pem is not provided, this object must be.

    Returns:
        The endorsement_data object with a 'signature' attribute added.

    Raises:
        ValueError: If neither private_key_pem nor private_key_object is provided.
        Exception: For issues with key loading or signing.
    """
    if private_key_pem:
        try:
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None,  # Assuming no password, adjust if needed
                backend=default_backend()
            )
        except Exception as e:
            raise Exception(f"Error loading private key from PEM string: {e}")
    elif private_key_object:
        private_key = private_key_object
    else:
        raise ValueError("Either 'private_key_pem' (as a string) or 'private_key_object' must be provided.")

    if not hasattr(private_key, 'sign'):
        raise Exception("Provided private key object does not have a 'sign' method (is it an RSA private key?).")

    # Convert endorsement data to bytes
    # Assuming endorsement_data can be converted to a string, similar to PowerShell's .ToString()
    bytes_to_sign = str(endorsement_data).encode('utf-8')

    try:
        signature = private_key.sign(
            bytes_to_sign,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
    except Exception as e:
        raise Exception(f"Error during signing: {e}")

    # Add the base64 encoded signature to the endorsement data
    # Assuming endorsement_data is a mutable object (e.g., a dictionary or a custom class instance)
    # If it's immutable, you'll need to return a new object or a tuple.
    if isinstance(endorsement_data, dict):
        endorsement_data['signature'] = base64.b64encode(signature).decode('utf-8')
    else:
        # For custom objects, you might need to set an attribute
        setattr(endorsement_data, 'signature', base64.b64encode(signature).decode('utf-8'))

    return endorsement_data
