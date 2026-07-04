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


class CulqiIntegration:
    def __init__(self):
        self.culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)

    def create_token(self, data=None, use_rsa=False):
        data = data or {"card_number": "4111111111111111", "cvv": "123", "expiration_month": "09", "expiration_year": "2026", "currency_code": "PEN"}
        if use_rsa and RSA_PUBLIC_KEY and RSA_ID:
            return self.culqi.token.create(data=data, rsa_public_key=RSA_PUBLIC_KEY, rsa_id=RSA_ID)
        return self.culqi.token.create(data=data)

    def create_charge(self, data, use_rsa=False, recurrent=False, installments=None):
        options = {}
        if use_rsa and RSA_PUBLIC_KEY and RSA_ID:
            options["rsa_public_key"] = RSA_PUBLIC_KEY
            options["rsa_id"] = RSA_ID
        if recurrent:
            options["custom_headers"] = {"X-Charge-Channel": "recurrent"}
        if installments:
            data["installments"] = installments
        return self.culqi.charge.create(data=data, **options)

    def get_charge(self, charge_id):
        return self.culqi.charge.read(charge_id)

    def capture_charge(self, charge_id, data=None):
        return self.culqi.charge.capture(id_=charge_id, data=data or {})

    def create_refund(self, data):
        return self.culqi.refund.create(data=data)

    def get_refund(self, refund_id):
        return self.culqi.refund.read(refund_id)

    def create_customer(self, data):
        return self.culqi.customer.create(data=data)

    def update_customer(self, customer_id, data):
        return self.culqi.customer.update(id_=customer_id, data=data)

    def get_customer(self, customer_id):
        return self.culqi.customer.read(customer_id)

    def delete_customer(self, customer_id):
        return self.culqi.customer.delete(customer_id)

    def list_customers(self, page=1, per_page=10):
        return self.culqi.customer.list(page=page, per_page=per_page)

    def create_card(self, data):
        return self.culqi.card.create(data=data)

    def get_card(self, card_id):
        return self.culqi.card.read(card_id)

    def delete_card(self, card_id):
        return self.culqi.card.delete(card_id)

    def list_cards(self, customer_id):
        return self.culqi.card.list(customer_id)

    def create_plan(self, data):
        return self.culqi.plan.create(data=data)

    def update_plan(self, plan_id, data):
        return self.culqi.plan.update(id_=plan_id, data=data)

    def get_plan(self, plan_id):
        return self.culqi.plan.read(plan_id)

    def delete_plan(self, plan_id):
        return self.culqi.plan.delete(plan_id)

    def create_subscription(self, data):
        return self.culqi.subscription.create(data=data)

    def update_subscription(self, subscription_id, data):
        return self.culqi.subscription.update(id_=subscription_id, data=data)

    def get_subscription(self, subscription_id):
        return self.culqi.subscription.read(subscription_id)

    def delete_subscription(self, subscription_id):
        return self.culqi.subscription.delete(subscription_id)

    def create_order(self, data):
        return self.culqi.order.create(data=data)

    def get_order(self, order_id):
        return self.culqi.order.read(order_id)


TEST_CARDS = {
    "Visa": "4111111111111111",
    "Mastercard": "5111111111111118",
    "Amex": "341111111111111",
    "Diners": "301111111111111",
    "Fondos insuficientes": "4000000000000002",
    "Expirada": "4000000000000069",
    "Declinada": "4000000000000003"
}


def simulate_all():
    api = CulqiIntegration()

    print("=" * 60)
    print("CULQI PYTHON SDK - SIMULADOR COMPLETO CON RSA")
    print("=" * 60)
    print(f"\nRSA configurado: {'Sí' if RSA_ID and RSA_PUBLIC_KEY else 'No'}")

    print("\n[1] TOKEN")
    try:
        token = api.create_token()
        print(f"    Creado: {token}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[2] CARGO")
    try:
        charge = api.create_charge({"amount": 5000, "currency_code": "PEN", "email": "test@test.com", "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"})
        print(f"    Creado: {charge}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[3] CARGO RECURRENTE")
    try:
        charge = api.create_charge({"amount": 5000, "currency_code": "PEN", "email": "test@test.com", "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"}, recurrent=True)
        print(f"    Creado: {charge}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[4] CARGO CON CUOTAS (3)")
    try:
        charge = api.create_charge({"amount": 5000, "currency_code": "PEN", "email": "test@test.com", "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"}, installments=3)
        print(f"    Creado: {charge}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[5] CLIENTE")
    try:
        customer = api.create_customer({"email": "test@test.com", "name": "Juan", "last_name": "Perez"})
        print(f"    Creado: {customer}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[6] ORDEN")
    try:
        order = api.create_order({"amount": 10000, "currency_code": "PEN", "description": "Test", "client_details": {}, "items": []})
        print(f"    Creado: {order}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[7] PLAN")
    try:
        plan = api.create_plan({"name": "Plan Test", "currency_code": "PEN", "amount": 10000, "interval": "meses", "interval_count": 1})
        print(f"    Creado: {plan}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n[8] SUSCRIPCIÓN")
    try:
        sub = api.create_subscription({"plan_id": "pln_test_XXXXXXXXXXXXXXXXXXXXXXXX", "customer_id": "cus_test_XXXXXXXXXXXXXXXXXXXXXXXX", "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"})
        print(f"    Creada: {sub}")
    except Exception as e:
        print(f"    Error: {e}")

    print("\n" + "=" * 60)
    print("TARJETAS DE PRUEBA")
    print("=" * 60)
    for name, num in TEST_CARDS.items():
        print(f"  {name}: {num}")
    print("=" * 60)


if __name__ == "__main__":
    simulate_all()