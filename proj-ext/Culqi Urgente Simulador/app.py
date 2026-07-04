from flask import Flask, request, jsonify
from dotenv import load_dotenv
from culqi.client import Culqi
import os

load_dotenv()

app = Flask(__name__)

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)


@app.route("/pagar", methods=["POST"])
def pagar():
    data = request.get_json()
    token = data.get("token")

    try:
        charge_data = {
            "amount": 5000,
            "currency_code": "PEN",
            "email": "cliente@correo.com",
            "source_id": token
        }
        charge = culqi.charge.create(data=charge_data)
        return jsonify(charge)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/token", methods=["POST"])
def crear_token():
    data = request.get_json()
    token = culqi.token.create(data=data)
    return jsonify(token)


@app.route("/cargo", methods=["POST"])
def crear_cargo():
    data = request.get_json()
    charge = culqi.charge.create(data=data)
    return jsonify(charge)


@app.route("/cliente", methods=["POST"])
def crear_cliente():
    data = request.get_json()
    customer = culqi.customer.create(data=data)
    return jsonify(customer)


@app.route("/tarjeta", methods=["POST"])
def crear_tarjeta():
    data = request.get_json()
    card = culqi.card.create(data=data)
    return jsonify(card)


@app.route("/plan", methods=["POST"])
def crear_plan():
    data = request.get_json()
    plan = culqi.plan.create(data=data)
    return jsonify(plan)


@app.route("/suscripcion", methods=["POST"])
def crear_suscripcion():
    data = request.get_json()
    subscription = culqi.subscription.create(data=data)
    return jsonify(subscription)


@app.route("/orden", methods=["POST"])
def crear_orden():
    data = request.get_json()
    order = culqi.order.create(data=data)
    return jsonify(order)


@app.route("/devolucion", methods=["POST"])
def crear_devolucion():
    data = request.get_json()
    refund = culqi.refund.create(data=data)
    return jsonify(refund)


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "CULQI SDK PYTHON - API REST",
        "endpoints": ["/pagar", "/token", "/cargo", "/cliente", "/tarjeta", "/plan", "/suscripcion", "/orden", "/devolucion"]
    })


if __name__ == "__main__":
    print("Servidor Flask corriendo en http://localhost:5000")
    print("Endpoints: /pagar, /token, /cargo, /cliente, /tarjeta, /plan, /suscripcion, /orden, /devolucion")
    app.run(host="0.0.0.0", port=5000, debug=True)