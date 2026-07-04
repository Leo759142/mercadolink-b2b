# Culqi Python SDK - Simulador

SDK oficial de Culqi para Python con todas las integraciones.

## Instalación

```bash
pip install culqi python-dotenv pycryptodome
```

## Configuración

Crea `.env` con tus credenciales:

```env
PUBLIC_KEY=pk_test_tu_llave_publica
PRIVATE_KEY=sk_test_tu_llave_privada
RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
tu_clave_rsa
-----END PUBLIC KEY-----
RSA_ID=tu_rsa_id
```

## Archivos

- **culqi_integration.py** - Funciones básicas para token, cargo, cliente, tarjeta, plan, suscripción, orden
- **culqi_simulator.py** - Simulador que ejecuta todas las operaciones
- **culqi_rsa.py** - Encriptación RSA para datos sensibles
- **culqi_apis_reference.py** - Referencia completa de todas las APIs
- **app.py** - Servidor Flask con endpoints REST

## Tarjetas de Prueba

| Tipo                 | Número          |
| -------------------- | ---------------- |
| Visa                 | 4111111111111111 |
| Mastercard           | 5111111111111118 |
| Amex                 | 341111111111111  |
| Diners               | 301111111111111  |
| Fondos insuficientes | 4000000000000002 |
| Expirada             | 4000000000000069 |
| Declinada            | 4000000000000003 |

## Uso

```python
from culqi_integration import create_token, create_charge, create_customer

# Token
token = create_token({"card_number": "4111111111111111", "cvv": "123", ...})

# Cargo
charge = create_charge({"amount": 5000, "currency_code": "PEN", "email": "test@test.com", "source_id": token["data"]["id"]})

# Cliente
customer = create_customer({"email": "test@test.com", "name": "Juan", "last_name": "Perez"})
```

## RSA Encryption

Para encriptar datos sensibles:

```python
from culqi_rsa import create_token_with_rsa

token = create_token_with_rsa(card_data)
```

## Ejecutar Servidor

```bash
python app.py
# Servidor en http://localhost:5000
```

Endpoints:

- POST /pagar
- POST /token
- POST /cargo
- POST /cliente
- POST /tarjeta
- POST /plan
- POST /suscripcion
- POST /orden
- POST /devolucion
