# **Port Checker Discord Bot + Home Server Automation**

This bot was written to help my friends remotely turn on a Dell Optiplex that we use as our server. 
Most of this only works on my home network unless repurposed with new internal IP addresses. The port checker functionality works on every device though. 
My "auth.json" is omitted due to containing tokens and passwords. See authexample.json to get an idea of what auth.json should look like.

# Available Commands (Case Insensitive)

| Commands | Aliases | Description |
| -------- | ------- | ----------- |
| !help | !h | This command |
| !check <ip> <port> | !cip | Check availability of a port at IP address. |
| !botIP | !bip | Check bot's IP address. | 
| !botIPClearCache | !cc | Clear out bot's cached IP address. |
| !wakeOptiplex | !wo | Wake the Optiplex. |
| !statusOptiplex | !so | Checks to see if Optiplex is online or not. |
| !shutdownOptiplex | !sdo | Turns off the Optiplex if on. |
| !rebootOptiplex | !rbo | Reboots the Optiplex if on. |

# TODO:
- [x] Implement basic TCP portchecking
- [x] Set up turning on, off, and restarting the Optiplex
- [ ] Set up permissions for turning off and rebooting the Optiplex