from dotenv import load_dotenv
from culqi.client import Culqi
import os
import json
import uuid

load_dotenv()

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RSA_PUBLIC_KEY = os.getenv("RSA_PUBLIC_KEY", "")
RSA_ID = os.getenv("RSA_ID", "")
MERCHANT_EMAIL = os.getenv("MERCHANT_EMAIL", "merchant@example.com")
MERCHANT_NAME = os.getenv("MERCHANT_NAME", "Mi Tienda")


def check_rsa_key_format(key):
    if not key:
        return False
    return "BEGIN PUBLIC KEY" in key


class Products:
    PRODUCTS = {
        "producto_001": {"name": "Camiseta Básica", "description": "Algodón 100%", "unit_price": 8900, "quantity": 1},
        "producto_002": {"name": "Zapatillas Running", "description": "Variedad de talles", "unit_price": 15900, "quantity": 1},
        "producto_003": {"name": "Mochila Urbana", "description": "Resistente al agua 20L", "unit_price": 12900, "quantity": 1},
        "producto_004": {"name": "Pantalón Casual", "description": "Slim fit", "unit_price": 11900, "quantity": 1},
        "combo_001": {"name": "Combo Verano", "description": "Camiseta + Pantalón + Mochila", "unit_price": 25900, "quantity": 1}
    }

    @classmethod
    def get(cls, product_id):
        return cls.PRODUCTS.get(product_id)

    @classmethod
    def list(cls):
        return cls.PRODUCTS

    @classmethod
    def get_items_for_order(cls, product_ids=None, custom_items=None):
        items = []
        if product_ids:
            for pid in product_ids:
                product = cls.get(pid)
                if product:
                    items.append({"name_id": pid, "name": product["name"], "quantity": product["quantity"], "unit_price": product["unit_price"]})
        if custom_items:
            items.extend(custom_items)
        return items


class CardSimulator:
    TEST_CARDS = {
        "visa": {"number": "4111111111111111", "cvv": "123", "exp_month": "09", "exp_year": "2026", "type": "Visa"},
        "mastercard": {"number": "5111111111111118", "cvv": "456", "exp_month": "12", "exp_year": "2027", "type": "Mastercard"},
        "amex": {"number": "341111111111111", "cvv": "7890", "exp_month": "06", "exp_year": "2026", "type": "American Express"},
        "dinners": {"number": "301111111111111", "cvv": "123", "exp_month": "11", "exp_year": "2025", "type": "Dinners Club"}
    }

    @classmethod
    def get_test_card(cls, card_type="visa"):
        return cls.TEST_CARDS.get(card_type, cls.TEST_CARDS["visa"])

    @classmethod
    def get_token_data(cls, card_type="visa", currency="PEN"):
        card = cls.get_test_card(card_type)
        return {"card_number": card["number"], "cvv": card["cvv"], "expiration_month": card["exp_month"], "expiration_year": card["exp_year"], "currency_code": currency, "email": "test@culqi.com", "device": {"type": "web", "name": "Web Simulator"}}


class CulqiSimulator:
    def __init__(self):
        self.client = Culqi(PUBLIC_KEY, PRIVATE_KEY)
        self.use_rsa = check_rsa_key_format(RSA_PUBLIC_KEY) and RSA_ID

    def create_token(self, card_type="visa"):
        data = CardSimulator.get_token_data(card_type)
        if self.use_rsa:
            return self.client.token.create(data=data, rsa_public_key=RSA_PUBLIC_KEY, rsa_id=RSA_ID)
        return self.client.token.create(data=data)

    def create_charge(self, token_id, amount, email=None, installments=None, is_recurrent=False):
        data = {"amount": amount, "currency_code": "PEN", "email": email or MERCHANT_EMAIL, "source_id": token_id, "metadata": {"merchant": MERCHANT_NAME}}
        if installments:
            data["installments"] = installments
        if is_recurrent:
            return self.client.charge.create(data=data, headers={"X-Charge-Channel": "recurrent"})
        return self.client.charge.create(data=data)

    def create_customer(self, email, name="Cliente", last_name="Demo", phone="999999999"):
        data = {"email": email, "first_name": name, "last_name": last_name, "phone_number": phone, "address": "Av. Lima 123", "address_city": "Lima", "country_code": "PE"}
        return self.client.customer.create(data=data)

    def create_card(self, customer_id, token_id):
        return self.client.card.create(data={"customer_id": customer_id, "token_id": token_id})


def run_full_simulation():
    simulator = CulqiSimulator()
    results = {}

    print("=" * 60)
    print("CULQI PYTHON SDK - SIMULADOR COMPLETO")
    print("=" * 60)

    print(f"\nClaves: PK={PUBLIC_KEY[:20] if PUBLIC_KEY else 'No configurada'}...")
    print(f"RSA configurado: {'Si' if simulator.use_rsa else 'No'}\n")

    print("-" * 60)
    print("[1] CREANDO TOKEN")
    try:
        token_result = simulator.create_token("visa")
        results["token"] = token_result
        if token_result["status"] == 201:
            token_id = token_result["data"]["id"]
            card = CardSimulator.get_test_card()
            print(f"    Token ID: {token_id}")
            print(f"    Tarjeta: {card['type']}")
        else:
            print(f"    Error: {token_result['data']}")
            return results
    except Exception as e:
        print(f"    Error: {e}")
        return results

    print("\n[2] CREANDO CARGO")
    try:
        charge_result = simulator.create_charge(token_id, amount=5000)
        results["charge"] = charge_result
        if charge_result["status"] == 201:
            charge_id = charge_result["data"]["id"]
            print(f"    Cargo ID: {charge_id}")
            print("    Monto: S/ 50.00")
            state = charge_result["data"].get("state", "N/A")
            print(f"    Estado: {state}")
        else:
            print(f"    Error: {charge_result['data']}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[3] CREANDO CLIENTE")
    try:
        customer_result = simulator.create_customer(email=f"cliente{uuid.uuid4().hex[:6]}@correo.com", name="Juan", last_name="Perez")
        results["customer"] = customer_result
        if customer_result["status"] == 201:
            customer_id = customer_result["data"]["id"]
            print(f"    Cliente ID: {customer_id}")
            print(f"    Email: {customer_result['data']['email']}")
        else:
            print(f"    Error: {customer_result['data']}")
            customer_id = None
    except Exception as e:
        print(f"    Error: {e}")
        customer_id = None

    if customer_id:
        print("\n[4] ASOCIANDO TARJETA AL CLIENTE")
        try:
            card_result = simulator.create_card(customer_id, token_id)
            results["card"] = card_result
            if card_result["status"] == 201:
                card_id = card_result["data"]["id"]
                print(f"    Tarjeta ID: {card_id}")
            else:
                print(f"    Error: {card_result['data']}")
        except Exception as e:
            print(f"    Error: {e}")

    print("\n[5] LISTA DE PRODUCTOS")
    print("-" * 40)
    for pid, product in Products.list().items():
        print(f"  {pid}: {product['name']} - S/ {product['unit_price']/100:.2f}")

    print("\n[6] TARJETAS DE PRUEBA")
    print("-" * 40)
    for card_type, card in CardSimulator.TEST_CARDS.items():
        print(f"  {card['type']}: {card['number']}")

    print("\n" + "=" * 60)
    print("SIMULACION COMPLETA")
    print("=" * 60)

    return results


if __name__ == "__main__":
    run_full_simulation()