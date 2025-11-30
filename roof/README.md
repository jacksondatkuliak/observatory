Simple python script that sends a HIGH signal to a GPIO pin and keeps a log and status file of whether or not the observatory roof is open.
Designed to work with cheap gate openers that can be bought on Amazon. Note that if you manually open or close the roof, there is no way to sync the roofstatus back up other than doing it manually. Shouldn't be an issue if using in a remotely operated observatory.

Batch file works on Windows with PuTTY installed and the commands.txt file in the PuTTY directory.
Chose a batch file for this because it can very easily be run as an instruction in NINA (https://nighttime-imaging.eu)
Put any commands you want to be run on the Pi in the commands.txt file (ie the command to run the Python script to set the GPIO pin to high).

If you end up using this, here is a small tutorial on how to wire up the gate opener:
The gate openers control circuit has a place to wire in two manual control wires.
All you have to do is send a HIGH (5v) signal from the Raspberry Pi GPIO to those wires and the gate opener will open/close.
Extra code is just for keeping a log of roof state for troubleshooting. Note that the gate opener I have (and I assume most others)
require that the HIGH signal be present for at least half a second for it to trigger. I assume this is a built in protection to
insure the gate opener doesn't accidentally toggle with erroneous signals. However, I would strongly recommend using a GPIO pin that
defaults to LOW. I also used a 5V relay with the Pi's 5V rail wired to NO (normally open) to insure that the signal going to the roof would without a doubt be registered as HIGH. This also gives some extra protection from erroneous signals.

Example gate opener: https://www.amazon.com/dp/B078GQCF6G (buy one that is rated a decent amount above the weight of your roof. don't ask how I know)
