All of the custom software I have written to run my astrophotography observatory 100% remote.

Includes:

- a server that integrates with AllSkeye to serve all sky camera images in real time
- a control server that can be run outside the observatory to keep a database of weather readings and roof status
- roof control scripts to control a DIY roll off roof (so you don't have to pay the egregious price for an ASCOM compliant roof opener...)
- a raspberry pi server to read temperature/humidity values and update the control servers database periodically
- a view client to see the status of the roof, observatory sensors, and weather information in a centralized location

If you plan to use any of these scripts to run your own remote observatory, just be aware that you will have to modify the codebase to fit your needs. This is what works for me given my setup and the software I am using. This software does not include any way to control a telescope or the accessories that go on it to do astrophotography. I assume you are already using NINA or similar programs to do that. This is purely for aggregating relevant information for an observing session and controlling DIY observatory features like a rool off roof and all sky camera.
