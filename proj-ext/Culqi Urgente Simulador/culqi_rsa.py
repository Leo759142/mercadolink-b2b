from dotenv import load_dotenv
from culqi.client import Culqi
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64
import json
import os

load_dotenv()

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RSA_PUBLIC_KEY = os.getenv("RSA_PUBLIC_KEY")
RSA_ID = os.getenv("RSA_ID")


def encrypt_payload(data, rsa_public_key):
    rsa_key = RSA.import_key(rsa_public_key)
    cipher = PKCS1_v1_5.new(rsa_key)
    json_data = json.dumps(data)
    encrypted = cipher.encrypt(json_data.encode())
    return base64.b64encode(encrypted).decode()


def create_token_with_rsa(card_data):
    culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)
    if RSA_PUBLIC_KEY and RSA_ID:
        return culqi.token.create(
            data=card_data,
            rsa_public_key=RSA_PUBLIC_KEY,
            rsa_id=RSA_ID
        )
    raise ValueError("Configura RSA_PUBLIC_KEY y RSA_ID en .env")


TOKEN_DATA = {
    "card_number": "4111111111111111",
    "cvv": "123",
    "expiration_month": "09",
    "expiration_year": "2026",
    "currency_code": "PEN"
}


if __name__ == "__main__":
    print("=== Culqi Python SDK - RSA Encryption ===\n")

    if RSA_PUBLIC_KEY and RSA_ID:
        token = create_token_with_rsa(TOKEN_DATA)
        print(f"Token con RSA: {json.dumps(token, indent=2)}")
    else:
        print("Configura RSA_PUBLIC_KEY y RSA_ID en .env")
        print("Obtén estas claves desde: CulqiPanel > Desarrollo > RSA Keys\n")

        print("Encryption helper function available:")
        print("  encrypt_payload(data, rsa_public_key)")
        print("  create_token_with_rsa(card_data)")