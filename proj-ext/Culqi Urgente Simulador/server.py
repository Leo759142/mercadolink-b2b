from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from culqi.client import Culqi
import os

load_dotenv()

app = Flask(__name__)
app.static_folder = '.'

PUBLIC_KEY = os.getenv("PUBLIC_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
RSA_PUBLIC_KEY = os.getenv("RSA_PUBLIC_KEY", "")
RSA_ID = os.getenv("RSA_ID", "")

def check_rsa_key_format(key):
    return key and "BEGIN PUBLIC KEY" in key

def get_rsa_options():
    if check_rsa_key_format(RSA_PUBLIC_KEY) and RSA_ID:
        return {"rsa_public_key": RSA_PUBLIC_KEY, "rsa_id": RSA_ID}
    return {}

culqi = Culqi(PUBLIC_KEY, PRIVATE_KEY)


@app.route("/")
def index():
    return send_from_directory('.', 'index.html')


@app.route("/api/token", methods=["POST"])
def api_token():
    data = request.get_json()
    options = get_rsa_options()
    token = culqi.token.create(data=data, **options) if options else culqi.token.create(data=data)
    return jsonify(token)


@app.route("/api/charge", methods=["POST"])
def api_charge():
    data = request.get_json()
    charge = culqi.charge.create(data=data)
    return jsonify(charge)


@app.route("/api/customer", methods=["POST"])
def api_customer():
    data = request.get_json()
    customer = culqi.customer.create(data=data)
    return jsonify(customer)


@app.route("/api/card", methods=["POST"])
def api_card():
    data = request.get_json()
    card = culqi.card.create(data=data)
    return jsonify(card)


@app.route("/api/plan", methods=["POST"])
def api_plan():
    data = request.get_json()
    plan = culqi.plan.create(data=data)
    return jsonify(plan)


@app.route("/api/subscription", methods=["POST"])
def api_subscription():
    data = request.get_json()
    subscription = culqi.subscription.create(data=data)
    return jsonify(subscription)


@app.route("/api/order", methods=["POST"])
def api_order():
    data = request.get_json()
    order = culqi.order.create(data=data)
    return jsonify(order)


@app.route("/api/refund", methods=["POST"])
def api_refund():
    data = request.get_json()
    refund = culqi.refund.create(data=data)
    return jsonify(refund)


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": "ok",
        "rsa_configured": check_rsa_key_format(RSA_PUBLIC_KEY) and RSA_ID,
        "public_key_set": bool(PUBLIC_KEY),
        "private_key_set": bool(PRIVATE_KEY)
    })


if __name__ == "__main__":
    print("Servidor Flask corriendo en http://localhost:5000")
    print("Endpoints: /api/token, /api/charge, /api/customer, /api/card, /api/plan, /api/subscription, /api/order, /api/refund")
    app.run(host="0.0.0.0", port=5000, debug=True)