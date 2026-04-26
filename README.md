# Observatory Viewer

All of the custom software I have written to run my astrophotography observatory 100% remotely.

![View Client Screenshot](/view-client.jpg)

Includes:

- a server that integrates with AllSkEye to serve all sky camera images in real time
- a control server that can be run outside the observatory to keep a database of weather readings and roof status
- roof control scripts to control a DIY roll off roof (so you don't have to pay the egregious price for an ASCOM compliant roof opener...)
- a raspberry pi server to read temperature/humidity values from a DHT11 and update the control servers database periodically
- a view client to see the status of the roof, observatory sensors, observatory devices, and weather information in a centralized location. NINA status is a WIP, currently will show a screenshot of the desktop. Requires [NINA Astro HTTP API](https://github.com/christian-photo/ninaAPI) to be installed to work. If you build an ESP32 all sky camera controller like I did, you can also take advantage of the cooling fan/dew heater controls that are built into the "AllSky" section.
- ESP32 Async web server code to run a cooling fan and dew heater inside an all sky camera enclosure.

# Instructions for usage

If you plan to use any of these scripts to run your own remote observatory, just be aware that you will have to modify the codebase to fit your needs. This is what works for me given my setup and the software I am using. This software does not include any way to control a telescope or the accessories that go on it to do astrophotography. I assume you are already using NINA or similar programs to do that. This is purely for aggregating relevant information for an observing session and viewing DIY observatory features like a rool off roof and all sky camera.

### control-server

To run this software, I use `PM2` to keep the control server running on my home server. Take a look at the code and the `example_config.json` file. Modify it to your needs, and then rename it to `config.json` for the server to use it.

### view-client

I don't run the view-client in a production environment, and instead opt to use `npm run dev` in a `screen` session until this software is in a "complete" state. Again, take a look at and update the example config and rename it to `config.json`. Go to the [GOES Image Viewer](https://www.star.nesdis.noaa.gov/goes/index.php) to find the appropiate URLs for your observatory location. You can change the GOES top, left, and width settings to change how zoomed and cropped the satellite image appears.

### allskeye-server

The AllSkEye server runs on the same computer that runs AllSkEye and I have it autorun on startup. Make sure to update the config with where you have your "Latest Image" being saved in AllSkEye.

### roof

To use the roof opening scripts under the /roof folder, you will have to manually go in and type in your username, password, and IP address. I have a python script that runs on a raspberry pi that sends a signal to my gate opener to open my roof. You should engineer your own system for this, and possibly use an ESP32 with an async web server to save cost. The Pi was overkill for this, but it is nice to be able to VNC/SSH straight into the pi and manually send the signal to close/open the roof if anything goes wrong.

### rpi-py-server

An extra way to be able to open/close the roof and sends DHT11 readings from the pi to the control server. I don't really use it for these reasons myself, as the DHT11 is a terrible sensor and I rely on my ssh scripts to open/close my roof. The main reason this server exists is to watch the `roofstatus` file and send an update to the control server whenever it is modified. Then, the control server bounces that status update to any view-client sessions and the "Roof" status is updated.
