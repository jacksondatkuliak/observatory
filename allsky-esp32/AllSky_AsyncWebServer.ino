/**
* AllSky camera ESP32 dew heater and cooling fan control server
*
* Setup for Async web server taken from Rui Santos at https://randomnerdtutorials.com
* Uses Adafruit SHT4x sensor to get accurate temperature/humidity readings.
* NOTE: Let it run for about 10 seconds to initialize, needs 5 seconds to "warm up"
* SHT4x sensor then a few more to connect to WiFi.
* Includes an automatic and manual mode and can be configured through HTTP requests.
*/

// Web Server libraries and web server setup
// Required libraries: 
// - Adafruit BusIO
// - Adafruit SHT4X Library
// - ArduinoJson
// - Async TCP
// - ESP Async WebServer
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "Adafruit_SHT4x.h"

// connect to wifi
const char* ssid = "insert_your_ssid";
const char* password = "insert_your_password";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);

// Setup SHT45 Sensor
Adafruit_SHT4x sht4 = Adafruit_SHT4x();

// Define relay pins
#define COOLING_FAN_RELAY_PIN 23  // IO23 used for cooling fan relay control
#define DEW_HEATER_RELAY_PIN 19   // IO19 used for dew heater relay control

// Define control mode enum
// This will determine if the automatic control code will run,
// or if we will manually turn on/off the cooling fan and dew heater.
enum ControlMode {
  MODE_AUTO,
  MODE_MANUAL
};
// By default it will run in auto mode
volatile ControlMode controlMode = MODE_AUTO;

// Define variables for control (some of these can be manually changed through REST endpoints)
int WAIT_TIME = 5000;                // milliseconds, how long between readings
int TOGGLE_WAIT_TIME = 60000;        // 1 minute wait after turning on/off cooling fan/dew heater (prevents it from repeatedly switching relay)
int COOLING_FAN_THRESHOLD = 26;      // about 80*F
int COOLING_FAN_ABS_THRESHOLD = 32;  // about 90*F, we should not turn on the dew heater at all if it is this hot
int DEW_HEATER_THRESHOLD = 5;        // 5 degrees away from dew point -> turn on dew heater
int DEW_HEATER_ABS_THRESHOLD = 3;    // about 37*F, we should absolutely turn on the dew heater if it is this cold out
int WIFI_RECONNECT_INTERVAL = 5000;  // 5 seconds between WiFi reconnection attempts

// global variables to get sensor data through web server
float last_temp = -99;
float last_humidity = -99;
float last_dew_point = -99;

#define SERIAL_DEBUG true  // turn off to turn off serial messages

// use these to know the current power state of the cooling fan and dew heater
bool COOLING_FAN_ON = false;
bool DEW_HEATER_ON = false;

// This will be used to determine if enough time has elapsed to run the automatic control loop
uint32_t lastUpdate = 0;
uint32_t previousMillis = millis();

// Turns the dew heater on or off and updates global state variables
void dewHeaterPower(bool state) {
  if (state == DEW_HEATER_ON) {
    // there is nothing to update, return
    return;
  }
  if (state == true) {
    // turn the dew heater on
    if (SERIAL_DEBUG) {
      Serial.println("Turning ON the dew heater");
    }
    DEW_HEATER_ON = true;
    digitalWrite(DEW_HEATER_RELAY_PIN, HIGH);
  } else {
    // turn the dew heater off
    if (SERIAL_DEBUG) {
      Serial.println("Turning OFF the dew heater");
    }
    DEW_HEATER_ON = false;
    digitalWrite(DEW_HEATER_RELAY_PIN, LOW);
  }
}

// Turns the cooling fan on or off and updates global state variables
void coolingFanPower(bool state) {
  if (state == COOLING_FAN_ON) {
    // there is nothing to update, return
    return;
  }
  if (state == true) {
    // turn the cooling fan on
    if (SERIAL_DEBUG) {
      Serial.println("Turning ON the cooling fan");
    }
    COOLING_FAN_ON = true;
    digitalWrite(COOLING_FAN_RELAY_PIN, HIGH);
  } else {
    // turn the cooling fan off
    if (SERIAL_DEBUG) {
      Serial.println("Turning OFF the cooling fan");
    }
    COOLING_FAN_ON = false;
    digitalWrite(COOLING_FAN_RELAY_PIN, LOW);
  }
}

void setup() {
  if (SERIAL_DEBUG) {
    Serial.begin(115200);
  }
  // Set last update to now - WAIT_TIME so it runs the control loop
  // as soon as we exit
  lastUpdate = millis() - WAIT_TIME;
  // setup relay pins
  pinMode(COOLING_FAN_RELAY_PIN, OUTPUT);
  pinMode(DEW_HEATER_RELAY_PIN, OUTPUT);
  // turn everything off to begin
  digitalWrite(COOLING_FAN_RELAY_PIN, LOW);
  digitalWrite(DEW_HEATER_RELAY_PIN, LOW);
  // turn off LED
  pinMode(2, INPUT);
  digitalWrite(2, LOW);
  // setup SHT4 sensor
  sht4.begin();
  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);
  // do a couple readings from the temperature sensor to "warm it up"
  // Note that this delay will mess with web server stuff so give it
  // some time before trying to connect
  for (int i = 0; i < 5; i++) {
    sensors_event_t humidity_e, temp_e;
    sht4.getEvent(&humidity_e, &temp_e);  // populate temp and humidity objects with fresh data
    delay(1000);
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    if (SERIAL_DEBUG) {
      Serial.println("Connecting to WiFi..");
    }
  }
  // Route for root / web page (just sends OK response)
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/plain", "OK");
  });

  /**
  * Update state and return json object with new state variables
  * /update?output=<output>&state=<state>
  */
  server.on("/update", HTTP_GET, [](AsyncWebServerRequest* request) {
    if (request->hasParam("output") && request->hasParam("state")) {
      String output;
      String state;
      output = request->getParam("output")->value();
      state = request->getParam("state")->value();
      // start formatting json response
      StaticJsonDocument<64> doc;
      String json;
      if ((output == "dew" || output == "fan") && controlMode == MODE_MANUAL) {
        if (output == "dew" && state == "on") {
          dewHeaterPower(true);
          doc["dew"] = "on";
        } else if (output == "dew" && state == "off") {
          dewHeaterPower(false);
          doc["dew"] = "off";
        } else if (output == "fan" && state == "on") {
          coolingFanPower(true);
          doc["fan"] = "on";
        } else if (output == "fan" && state == "off") {
          coolingFanPower(false);
          doc["fan"] = "off";
        } else {
          request->send(400, "text/plain", "Incorrectly formatted update request. Unknown state: expected \"on\" or \"off\".");
          return;
        }
      } else if ((output == "dew" || output == "fan") && controlMode == MODE_AUTO) {
        request->send(400, "text/plain", "Please change mode to manual.");
        return;
      } else if (output == "mode" && state == "auto") {
        controlMode = MODE_AUTO;
        doc["mode"] = "auto";
        if (SERIAL_DEBUG) {
          Serial.println("Updated control mode to auto");
        }
      } else if (output == "mode" && state == "manual") {
        controlMode = MODE_MANUAL;
        doc["mode"] = "manual";
        if (SERIAL_DEBUG) {
          Serial.println("Updated control mode to manual");
        }
      } else if (output == "wait_time") {
        WAIT_TIME = state.toInt();
        doc["wait_time"] = WAIT_TIME;
      } else if (output == "toggle_wait_time") {
        TOGGLE_WAIT_TIME = state.toInt();
        doc["toggle_wait_time"] = TOGGLE_WAIT_TIME;
      } else if (output == "cooling_fan_threshold") {
        COOLING_FAN_THRESHOLD = state.toInt();
        doc["cooling_fan_threshold"] = COOLING_FAN_THRESHOLD;
      } else if (output == "cooling_fan_abs_threshold") {
        COOLING_FAN_ABS_THRESHOLD = state.toInt();
        doc["cooling_fan_abs_threshold"] = COOLING_FAN_ABS_THRESHOLD;
      } else if (output == "dew_heater_threshold") {
        DEW_HEATER_THRESHOLD = state.toInt();
        doc["dew_heater_threshold"] = DEW_HEATER_THRESHOLD;
      } else if (output == "dew_heater_abs_threshold") {
        DEW_HEATER_ABS_THRESHOLD = state.toInt();
        doc["dew_heater_abs_threshold"] = DEW_HEATER_ABS_THRESHOLD;
      } else {
        if (SERIAL_DEBUG) {
          Serial.println("Recieved incorrectly formatted update request. Unknown output or state.");
        }
        request->send(400, "text/plain", "Incorrectly formatted update request. Unknown output or state.");
        return;
      }
      // finalize json and send response
      serializeJson(doc, json);
      request->send(200, "application/json", json);
      return;
    } else {
      request->send(400, "text/plain", "Incorrectly formatted update request");
      if (SERIAL_DEBUG) {
        Serial.println("Recieved incorrectly formatted update request");
      }
      return;
    }
  });

  /**
  * Get Status, returns json object with status parameters
  */
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest* request) {
    String var;
    if (request->hasParam("var")) {
      var = request->getParam("var")->value();
      if (var == "all") {
        // make json object with all of the variables as response
        StaticJsonDocument<256> doc;
        String json;
        doc["temp"] = last_temp;
        doc["humidity"] = last_humidity;
        doc["dewpoint"] = last_dew_point;
        doc["fan"] = COOLING_FAN_ON ? "on" : "off";
        doc["dew"] = DEW_HEATER_ON ? "on" : "off";
        doc["wait_time"] = WAIT_TIME;
        doc["toggle_wait_time"] = TOGGLE_WAIT_TIME;
        doc["cooling_fan_threshold"] = COOLING_FAN_THRESHOLD;
        doc["cooling_fan_abs_threshold"] = COOLING_FAN_ABS_THRESHOLD;
        doc["dew_heater_threshold"] = DEW_HEATER_THRESHOLD;
        doc["dew_heater_abs_threshold"] = DEW_HEATER_ABS_THRESHOLD;
        doc["mode"] = (controlMode == MODE_AUTO) ? "auto" : "manual";
        serializeJson(doc, json);
        request->send(200, "application/json", json);
        return;
      }

      // if request was not all, we can start formatting the json
      StaticJsonDocument<64> doc;
      String json;
      if (var == "temp") {
        doc["temp"] = last_temp;
      } else if (var == "humidity") {
        doc["humidity"] = last_humidity;
      } else if (var == "dewpoint") {
        doc["dewpoint"] = last_dew_point;
      } else if (var == "fan") {
        doc["fan"] = COOLING_FAN_ON ? "on" : "off";
      } else if (var == "dew") {
        doc["dew"] = DEW_HEATER_ON ? "on" : "off";
      } else if (var == "wait_time") {
        doc["wait_time"] = WAIT_TIME;
      } else if (var == "toggle_wait_time") {
        doc["toggle_wait_time"] = TOGGLE_WAIT_TIME;
      } else if (var == "cooling_fan_threshold") {
        doc["cooling_fan_threshold"] = COOLING_FAN_THRESHOLD;
      } else if (var == "cooling_fan_abs_threshold") {
        doc["cooling_fan_abs_threshold"] = COOLING_FAN_ABS_THRESHOLD;
      } else if (var == "dew_heater_threshold") {
        doc["dew_heater_threshold"] = DEW_HEATER_THRESHOLD;
      } else if (var == "dew_heater_abs_threshold") {
        doc["dew_heater_abs_threshold"] = DEW_HEATER_ABS_THRESHOLD;
      } else if (var == "mode") {
        doc["mode"] = (controlMode == MODE_AUTO) ? "auto" : "manual";
      } else {
        request->send(400, "text/plain", "Incorrectly formatted update request. Unknown var.");
        return;
      }
      // send response
      serializeJson(doc, json);
      request->send(200, "application/json", json);
      return;
    } else {
      request->send(400, "text/plain", "Incorrectly formatted update request.");
      return;
    }
  });

  // Start server
  server.begin();
}

// Reads sensor and updates global variables
void readSensor() {
  sensors_event_t humidity_e, temp_e;
  sht4.getEvent(&humidity_e, &temp_e);  // populate temp and humidity objects with fresh data
  float humidity = humidity_e.relative_humidity;
  float temperature = temp_e.temperature;

  // Check if any reads failed and exit early
  if (isnan(humidity) || isnan(temperature)) {
    if (SERIAL_DEBUG) {
      Serial.println("Failed to read from SHT4 sensor!");
    }
    return;
  }

  // Calculate how close we are to dew point
  // Because the sensors are inherently inaccurate anyway, we will use the "Simple Approximation"
  // from the Dew Point wikipedia page and just start warming up the dew heater once we get
  // within a few degrees of the dew point (https://en.wikipedia.org/wiki/Dew_point#Simple_approximation)
  float T_dry = temperature - ((100 - humidity) / 5);
  // update global variables
  last_humidity = humidity;
  last_temp = temperature;
  last_dew_point = T_dry;

  if (SERIAL_DEBUG) {
    // Print the humidity and temperature
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.print("\t");
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" *C");
    Serial.print("\t");
    Serial.print("Dew point temperature: ");
    Serial.print(T_dry);
    Serial.println(" *C");
  }
}

// The function to run when testing if we should turn on the dew heater or cooling fan in auto mode
void runAutomaticControl() {
  // Read sensor repeatedly
  readSensor();
  // update function variables
  float temperature = last_temp;
  float humidity = last_humidity;
  float T_dry = last_dew_point;
  // first check to see if we are near freezing, if we are, turn on the dew heater
  // this ensures snow/frost doesn't build up on the enclosure
  if (temperature < DEW_HEATER_ABS_THRESHOLD) {
    if (SERIAL_DEBUG) {
      Serial.println("Temperature <3*C");
    }
    // don't bother with cooling fan if it is this cold
    if (COOLING_FAN_ON) {
      coolingFanPower(false);
    }
    // if the dew heater is not on
    if (!DEW_HEATER_ON) {
      // turn dew heater on
      dewHeaterPower(true);
      delay(TOGGLE_WAIT_TIME);
    }
    return;
  }
  // check if its stupid hot outside. if it is, turn off the dew heater
  // and turn on the cooling fan. this ensures the dew heater doesn't
  // turn on if it is a hot humid day
  if (temperature > COOLING_FAN_ABS_THRESHOLD) {
    if (SERIAL_DEBUG) {
      Serial.println("Temperature >30*C");
    }
    // if the dew heater is on
    if (DEW_HEATER_ON) {
      // turn dew heater off
      dewHeaterPower(false);
    }
    // if the cooling fan is not on
    if (!COOLING_FAN_ON) {
      // turn the cooling fan on
      coolingFanPower(true);
      delay(TOGGLE_WAIT_TIME);
    }
    return;
  }

  // if it is not freezing or very hot outside
  // check to see if we are in the threshold to turn on the dew heater
  if ((temperature - T_dry) < DEW_HEATER_THRESHOLD) {
    if (SERIAL_DEBUG) {
      Serial.println("Dew point threshold met");
    }
    // we should turn on the dew heater, so make sure the cooling fan is OFF
    if (COOLING_FAN_ON) {
      coolingFanPower(false);
      // don't return yet, we want to turn the dew heater on
    }
    // if we are in the dew point threshold and the dew heater is not on
    if (!DEW_HEATER_ON) {
      // turn the dew heater on
      dewHeaterPower(true);
      // wait at least 5 minutes before changing state again
      delay(TOGGLE_WAIT_TIME);
      return;
    }
  }

  // if the dew heater is on and we are not in the dew heater threshold, make sure
  // we are at least a degree above the threshold before turning it off to prevent
  // the dew heater from turning on and off unecessarily when hovering around
  // the threshold temperature
  if (DEW_HEATER_ON && ((temperature - T_dry) < (DEW_HEATER_THRESHOLD + 1))) {
    // it's still safe to keep the dew heater on, so return now without changing state
    return;
  } else {
    // if the dew heater is on and we are well clear of hitting the dew point, turn it off
    dewHeaterPower(false);
    // don't return, it may be appropiate to turn on the cooling fan now
  }

  // if we did not return from the last 3 statements, we are in the zone where we may want to turn on the cooling fan
  // so we should check if it is hot enough to turn on the cooling fan
  // I'm not as worried about the cooling fan turning on and off if the temperature is around the threshold
  // as it won't be able to affect the images coming from the allsky camera. if it becomes an issue,
  // I may add an extra condition like I did for the dew heater
  if (temperature > COOLING_FAN_THRESHOLD) {
    // if it is hot out, turn on the cooling fan
    coolingFanPower(true);
    // wait at least 5 minutes before changing state again
    delay(TOGGLE_WAIT_TIME);
    return;
  } else {
    // if we are not at the threshold, just turn the fan off
    coolingFanPower(false);
    // wait at least 5 minutes before changing state again
    delay(TOGGLE_WAIT_TIME);
    return;
  }
  return;
}


void loop() {
  // if we are not connected to wifi, try to reconnect
  uint32_t currentMillis = millis();
  if ((WiFi.status() != WL_CONNECTED) && (currentMillis - previousMillis >= WIFI_RECONNECT_INTERVAL)) {
    if (SERIAL_DEBUG) {
      Serial.println("Reconnecting to WiFi...");
    }
    WiFi.reconnect();
    previousMillis = currentMillis;
  }
  // if manual control mode is on, continue reading sensor, but don't run control code
  if (controlMode == MODE_MANUAL) {
    if (currentMillis - lastUpdate >= WAIT_TIME) {
      lastUpdate = currentMillis;
      // Read sensor only
      readSensor();
    }
  } else {
    // if automatic control mode is on, check and see if we have waited long enough to
    // run the control loop again. Otherwise, continue the loop()
    if (currentMillis - lastUpdate >= WAIT_TIME) {
      lastUpdate = currentMillis;
      // Run sensor control code
      runAutomaticControl();
    }
  }
  return;
}
