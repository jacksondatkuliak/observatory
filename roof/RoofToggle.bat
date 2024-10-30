REM Batch file to connect to Raspberry Pi using plink (PuTTY CLI) and run the rooftoggle.py script
REM Replace with your own ip, username, and password, then put the command to execute the python 
REM script in commands.txt in the PuTTY folder

set plink="C:\Program Files\PuTTY\plink.exe"
set ip=[ip]
set name=[name]
set password=[password]
set commands="C:\Program Files\PuTTY\commands.txt"
%plink% -ssh %ip% -l %name% -pw %password% -m %commands% -batch

