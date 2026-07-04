from dotenv import load_dotenv
from culqi.client import Culqi
import os

load_dotenv()

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RSA_PUBLIC_KEY = os.getenv("RSA_PUBLIC_KEY")
RSA_ID = os.getenv("RSA_ID")

culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)

APIS = {
    "Tokens": {
        "create": "culqi.token.create(data={card_number, cvv, expiration_month, expiration_year, currency_code})",
        "read": "culqi.token.read(token_id)",
        "list": "culqi.token.list(page, per_page)"
    },
    "Cargos": {
        "create": "culqi.charge.create(data={amount, currency_code, email, source_id})",
        "read": "culqi.charge.read(charge_id)",
        "capture": "culqi.charge.capture(id_=charge_id, data={})",
        "list": "culqi.charge.list(page, per_page)"
    },
    "Devoluciones": {
        "create": "culqi.refund.create(data={charge_id, amount, reason})",
        "read": "culqi.refund.read(refund_id)",
        "list": "culqi.refund.list(page, per_page)"
    },
    "Clientes": {
        "create": "culqi.customer.create(data={email, name, last_name, phone, address, metadata})",
        "read": "culqi.customer.read(customer_id)",
        "update": "culqi.customer.update(id_=customer_id, data={})",
        "delete": "culqi.customer.delete(customer_id)",
        "list": "culqi.customer.list(page, per_page)"
    },
    "Tarjetas": {
        "create": "culqi.card.create(data={customer_id, token_id})",
        "read": "culqi.card.read(card_id)",
        "delete": "culqi.card.delete(card_id)",
        "list": "culqi.card.list(customer_id)"
    },
    "Planes": {
        "create": "culqi.plan.create(data={name, currency_code, amount, interval, interval_count, metadata})",
        "read": "culqi.plan.read(plan_id)",
        "update": "culqi.plan.update(id_=plan_id, data={})",
        "delete": "culqi.plan.delete(plan_id)",
        "list": "culqi.plan.list(page, per_page)"
    },
    "Suscripciones": {
        "create": "culqi.subscription.create(data={plan_id, customer_id, source_id, metadata})",
        "read": "culqi.subscription.read(subscription_id)",
        "update": "culqi.subscription.update(id_=subscription_id, data={})",
        "delete": "culqi.subscription.delete(subscription_id)",
        "list": "culqi.subscription.list(page, per_page)"
    },
    "Órdenes": {
        "create": "culqi.order.create(data={amount, currency_code, description, client_details, items, payment_methods, metadata})",
        "read": "culqi.order.read(order_id)",
        "update": "culqi.order.update(id_=order_id, data={})",
        "delete": "culqi.order.delete(order_id)",
        "list": "culqi.order.list(page, per_page)"
    },
    "RSA Encryption": {
        "install": "pip install pycryptodome",
        "usage": "culqi.token.create(data=data, rsa_public_key=RSA_PUBLIC_KEY, rsa_id=RSA_ID)",
        "note": "Obtén RSA keys desde CulqiPanel > Desarrollo > RSA Keys"
    }
}

TEST_CARDS = {
    "Visa (aprobada)": "4111111111111111",
    "Mastercard (aprobada)": "5111111111111118",
    "Amex (aprobada)": "341111111111111",
    "Diners (aprobada)": "301111111111111",
    "Fondos insuficientes": "4000000000000002",
    "Tarjeta expirada": "4000000000000069",
    "Tarjeta declinada": "4000000000000003",
    "CVV incorrecto": "4000000000000011",
    "Tarjeta perdida": "4000000000000005",
    "Tarjeta robada": "4000000000000007",
    "Tarjeta no verificada": "4000000000000009"
}

EXAMPLES = {
    "token_basic": {
        "card_number": "4111111111111111",
        "cvv": "123",
        "expiration_month": "09",
        "expiration_year": "2026",
        "currency_code": "PEN"
    },
    "charge_basic": {
        "amount": 5000,
        "currency_code": "PEN",
        "email": "juan@example.com",
        "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "charge_recurrent": {
        "amount": 5000,
        "currency_code": "PEN",
        "email": "juan@example.com",
        "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX",
        "metadata": {"recurrent": True}
    },
    "charge_installments": {
        "amount": 5000,
        "currency_code": "PEN",
        "email": "juan@example.com",
        "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX",
        "installments": 3
    },
    "customer_basic": {
        "email": "juan@example.com",
        "name": "Juan",
        "last_name": "Perez",
        "phone": "999999999",
        "address": "Av. Lima 123"
    },
    "card_basic": {
        "customer_id": "cus_test_XXXXXXXXXXXXXXXXXXXXXXXX",
        "token_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "plan_basic": {
        "name": "Plan Premium",
        "currency_code": "PEN",
        "amount": 10000,
        "interval": "meses",
        "interval_count": 1
    },
    "subscription_basic": {
        "plan_id": "pln_test_XXXXXXXXXXXXXXXXXXXXXXXX",
        "customer_id": "cus_test_XXXXXXXXXXXXXXXXXXXXXXXX",
        "source_id": "tkn_test_XXXXXXXXXXXXXXXXXXXXXXXX"
    },
    "order_basic": {
        "amount": 10000,
        "currency_code": "PEN",
        "description": "Compra de producto",
        "client_details": {
            "email": "juan@example.com",
            "name": "Juan Perez"
        },
        "items": [
            {"name": "Producto", "quantity": 1, "unit_price": 10000}
        ]
    },
    "order_pagoefectivo": {
        "amount": 10000,
        "currency_code": "PEN",
        "description": "Pago con PagoEfectivo",
        "client_details": {"email": "juan@example.com", "name": "Juan Perez"},
        "items": [{"name": "Servicio", "quantity": 1, "unit_price": 10000}],
        "payment_methods": {"card": {"status": "disabled"}, "cash": {"status": "active"}}
    }
}


def print_apis():
    print("\n" + "=" * 70)
    print("APIS DISPONIBLES EN CULQI PYTHON SDK")
    print("=" * 70)
    for api_name, methods in APIS.items():
        print(f"\n{api_name}:")
        for method, usage in methods.items():
            print(f"  - {method}: {usage}")


def print_test_cards():
    print("\n" + "=" * 70)
    print("TARJETAS DE PRUEBA CULQI (Entorno de Integración)")
    print("=" * 70)
    for name, number in TEST_CARDS.items():
        print(f"  {name}: {number}")


def print_examples():
    print("\n" + "=" * 70)
    print("EJEMPLOS DE DATOS")
    print("=" * 70)
    for name, data in EXAMPLES.items():
        print(f"\n{name}:")
        for key, value in data.items():
            if isinstance(value, dict):
                print(f"  {key}:")
                for k, v in value.items():
                    print(f"    {k}: {v}")
            else:
                print(f"  {key}: {value}")


if __name__ == "__main__":
    print_apis()
    print_test_cards()
    print_examples()

    print("\n" + "=" * 70)
    print("CONFIGURACIÓN")
    print("=" * 70)
    print(f"PUBLIC_KEY: {'Configurada' if PUBLIC_KEY else 'No configurada'}")
    print(f"PRIVATE_KEY: {'Configurada' if PRIVATE_KEY else 'No configurada'}")
    print(f"RSA_PUBLIC_KEY: {'Configurada' if RSA_PUBLIC_KEY else 'No configurada'}")
    print(f"RSA_ID: {'Configurado' if RSA_ID else 'No configurado'}")
    print("\nConfigura estas variables en .env o .env.example")