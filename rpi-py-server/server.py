from flask import Flask, jsonify
import adafruit_dht
import board
import time
import requests
import threading
import json
import sys
import os

# Expected control server endpoints exposed:
# /dht11 for posting dht11 temp/humidity readings
# /roofupdate for posting when roof opens/closes

CONFIG_FILE = os.path.join(os.getcwd(), "config.json")
try:
    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)
except FileNotFoundError:
    print(f"Error: config file not found at {CONFIG_FILE}")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Error: invalid JSON in config file: {e}")
    sys.exit(1)

# Read configuration values with defaults
TARGET_SERVER_URL = config.get("target_server_url", "http://example.com/")
POST_INTERVAL = config.get("post_interval", 30)
DHT_PIN_NUMBER = config.get("dht_pin", 4)
ROOFSTATUS_PATH = config.get("roofstatus_path", "/home/user/roof")

# Map numeric pin to board constant
try:
    DHT_PIN = getattr(board, f"D{DHT_PIN_NUMBER}")
except AttributeError:
    print(f"Invalid GPIO pin number D{DHT_PIN_NUMBER} in config.json")
    sys.exit(1)

# ---------- Initialize ----------
dht = adafruit_dht.DHT11(DHT_PIN)
app = Flask(__name__)

# Global variables to store last valid readings
last_temperature = None
last_humidity = None
last_update_time = None


def read_dht():
    """Safely read temperature and humidity."""
    try:
        temperature = dht.temperature
        humidity = dht.humidity
        if temperature is not None and humidity is not None:
            return {"temperature": temperature, "humidity": humidity}
    except RuntimeError:
        pass
    return None


def post_data():
    """Background thread to update and send data periodically."""
    global last_temperature, last_humidity, last_update_time

    while True:
        data = read_dht()
        if data:
            last_temperature = data["temperature"]
            last_humidity = data["humidity"]
            last_update_time = time.strftime("%Y-%m-%d %H:%M:%S")

            # Try to POST to external server
            try:
                response = requests.post(TARGET_SERVER_URL + "dht11", json=data, timeout=5)
                print(f"POSTed data: {data} -> Status {response.status_code}")
            except requests.RequestException as e:
                print(f"Failed to send data: {e}")
        else:
            print("Invalid sensor read — keeping last valid values.")

        time.sleep(POST_INTERVAL)


@app.route("/")
def index():
    """Return the last valid DHT11 readings."""
    if last_temperature is not None and last_humidity is not None:
        return jsonify({
            "temperature": last_temperature,
            "humidity": last_humidity,
            "last_update": last_update_time
        })
    else:
        return jsonify({"error": "No valid readings yet"}), 503

# Reads the status of the roof from ROOFSTATUS_PATH when a GET request is made
# then makes a POST request to the control server to tell it the roof just opened/closed
# TODO: remove this and have rooftoggle.py make a POST request 
@app.route("/roofstatus", methods=["GET"])
def get_roof_status():
    try:
        if not os.path.exists(ROOFSTATUS_PATH):
            return jsonify({"error": "status file not found"}), 404

        with open(ROOFSTATUS_PATH, "r") as f:
            status = f.read().strip().lower()

        if status not in ("open", "closed"):
            return jsonify({"error": "invalid roof status"}), 500
        data = {"roof": status}

        # make post request to control server
        try:
            response = requests.post(TARGET_SERVER_URL + "roofupdate", json=data, timeout=5)
            print(f"POSTed data: {data} -> Status {response.status_code}")
        except requests.RequestException as e:
            print(f"Failed to send data: {e}")

        return jsonify({"roof": status})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    

if __name__ == "__main__":
    threading.Thread(target=post_data, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=False)
