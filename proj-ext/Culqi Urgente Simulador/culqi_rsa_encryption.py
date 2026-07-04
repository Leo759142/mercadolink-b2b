from dotenv import load_dotenv
from culqi.client import Culqi
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64
import json
import os

load_dotenv()

PUBLIC_KEY = os.getenv("PUBLIC_KEY", "")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
RSA_PUBLIC_KEY = os.getenv("RSA_PUBLIC_KEY", "")
RSA_ID = os.getenv("RSA_ID", "")


def encrypt_with_rsa(data, public_key_pem):
    rsa_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_v1_5.new(rsa_key)
    json_data = json.dumps(data)
    encrypted = cipher.encrypt(json_data.encode())
    return base64.b64encode(encrypted).decode()


def create_token_encrypted(card_data):
    culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)
    
    if RSA_ID and RSA_PUBLIC_KEY:
        options = {
            "rsa_public_key": RSA_PUBLIC_KEY,
            "rsa_id": RSA_ID
        }
        return culqi.token.create(data=card_data, **options)
    else:
        raise ValueError("RSA_ID y RSA_PUBLIC_KEY son requeridos para encriptación")


def create_charge_encrypted(charge_data):
    culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)
    
    if RSA_ID and RSA_PUBLIC_KEY:
        encrypted_payload = encrypt_with_rsa(charge_data, RSA_PUBLIC_KEY)
        options = {
            "rsa_public_key": RSA_PUBLIC_KEY,
            "rsa_id": RSA_ID
        }
        return culqi.charge.create(data={"encrypted_data": encrypted_payload}, **options)
    else:
        raise ValueError("RSA_ID y RSA_PUBLIC_KEY son requeridos para encriptación")


TOKEN_ENCRYPTED_DATA = {
    "card_number": "4111111111111111",
    "cvv": "123",
    "expiration_month": "09",
    "expiration_year": "2026",
    "currency_code": "PEN"
}

CHARGE_ENCRYPTED_DATA = {
    "amount": 5000,
    "currency_code": "PEN",
    "email": "cliente@correo.com",
    "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"
}


if __name__ == "__main__":
    print("=== Culqi Python SDK - Encriptación RSA ===\n")

    if not RSA_ID or not RSA_PUBLIC_KEY:
        print("ERROR: Configura RSA_PUBLIC_KEY y RSA_ID en .env")
        print("Obtenlas desde CulqiPanel > Desarrollo > RSA Keys\n")
    else:
        print("1. Creando token con RSA...")
        token = create_token_encrypted(TOKEN_ENCRYPTED_DATA)
        print(f"   Token creado: {token}\n")

        print("2. Creando cargo con RSA...")
        charge = create_charge_encrypted(CHARGE_ENCRYPTED_DATA)
        print(f"   Cargo creado: {charge}\n")

    print("=== Ejemplo completado ===")