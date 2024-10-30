import RPi.GPIO as GPIO
from time import sleep
from datetime import datetime

# NOTE: a roofstatus file with either "open" or "closed" being the only
# contents of the file needs to be present in the directory of the 
# script for it to work correctly. A rooflog file will be created if not
# found and a log of roof openings/closings will be kept for future
# reference. Additionally, the script and it's associated files need
# to be readable and writable by the user, so it is recommended to keep
# them in the home folder.

# Before toggling roof, we will update it's status locally and add the
# status to the roof log

# Open file and read it's contents
path = "/home/jackson/roof/" # input directory here
f = open(path + "roofstatus", "r")
status = f.read()
f.close()

# Log roof status and update local roof state
f = open(path + "roofstatus", "w")
log = open(path + "rooflog", "a")
now = datetime.now()
dt_string = now.strftime("%m/%d/%Y %H:%M:%S") # note American mdy format
if (status == "open"):
	f.write("closed")
	log.write("\n" + dt_string + " Roof closed")
elif (status == "closed"):
	f.write("open")
	log.write("\n" + dt_string + " Roof opened")
else:
	f.write(status) # Restoring botched roof status for troubleshooting
	log.write("\n" + dt_string + " Unable to determine roof status, sending toggle anyway : Unknown status: " + status)
f.close()
log.close()

# GPIO pins 0-8 have default state HIGH (3.3v), 9-27 default state is 
# LOW (0V). We want to ensure we are using a pin with default state LOW
# to ensure no accidental roof openings when pi boots up.

# Set GPIO pin number and pulse length (seconds)
pin = 12 # (GPIO 18)
pulseLength = 0.5

# Using physical pin numbers for GPIO control
GPIO.setmode(GPIO.BOARD)

# Initialize GPIO and set as output pin
GPIO.setup(pin, GPIO.OUT)

# Send HIGH pulse
GPIO.output(pin, GPIO.HIGH)
sleep(pulseLength)
GPIO.output(pin, GPIO.LOW)

# Cleanup
GPIO.cleanup()
