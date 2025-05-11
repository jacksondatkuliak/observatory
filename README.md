Very simple script to facilitate opening and closing of my observatories roof while I am away.

Works with a cheap gate opener from Amazon. The gate openers control circuit has a place to wire in two manual control wires.
All you have to do is send a HIGH (5v) signal from the Raspberry Pi to those wires and the gate opener will open/close.
Extra code is just for keeping a log of roof state for troubleshooting. 
Batch file works on Windows with PuTTY installed and the commands.txt file in the PuTTY directory. 
Put any commands you want to be run on the Pi in the commands.txt file (ie the command to run the Python script to set the GPIO pin to high).
