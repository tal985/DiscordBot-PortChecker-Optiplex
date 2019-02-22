const Client = require("ssh2").Client;
const Discord = require("discord.js");
const bot = new Discord.Client();
const prefix = require("./settings.json").prefix;
const url = "https://wtfismyip.com/json";
const token = require("./auth.json").token;
const wol = require("wake_on_lan");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const isPortReachable = require('is-port-reachable');
const ipOpti = "192.168.1.136", ipPi = "192.168.1.146";
const optiPass = require("./auth.json").optiPass;

const settings = 
{
  host: ipOpti,
  username: "server",
  port: 222,
  password: optiPass,
  pty: true
}

var botIP;
var optiplexOn;

///Initialize Discord Bot.
bot.on("ready", () => 
{
    botIP = getBotIP();
    initStatusOptiplex();
    console.log("Logged in as " + bot.user.tag + ".");
});

bot.on("message", message =>
{   
    //Listen for ! commands.
    if(message.content.substring(0, prefix.length).toLocaleLowerCase() == prefix) 
    {
        var msg = null;
        var args = message.content.substring(prefix.length).split(" ");
        var cmd = message.content.substring(prefix.length).split(" ")
        

        switch (args[0].toLowerCase())
        {
            case "h":
            case "help":
                msg =
                "__**Available Commands (Case Insensitive)**__\
                \n!help - This command. (alias !h) \
                \n!check <ip_address> <port_number> - Check availability of a port at IP address. \
                \n!botIP - Check bot's IP address. \
                \n!botIPClearCache - Clear out bot's cached IP address. (alias !cc) \
                \n!wakeOptiplex - Wake the Optiplex. (alias !wo) \
                \n!statusOptiplex - Checks to see if Optiplex is online or not. (alias !so) \
                \n!shutdownOptiplex - Turns off the Optiplex if on. (alias !sdo) \
                \n!rebootOptiplex - Reboots the Optiplex if on. (alias !rbo)";
                break;
            case "cip":
            case "check":
                if(args[1] != null && args[2] != null)
                    checkIPArgs(args[1], args[2], message);
                else
                    msg = "ERROR: Missing arguments! See !help for syntax.";
                break;
            case "bip":
            case "botip":
                msg = botIP;
                break;
            case "cc":
            case "botipclearcache":
                botIP = getBotIP();
                msg = "Clearing cache! Reacquiring Bot's IP.";
                break;
            case "wo":
            case "wakeoptiplex":
                if(!optiplexOn)
                {
                    wol.wake("B8CA3AB65DB6");
                    msg = "Attempting to wake the Optiplex! Please wait a couple minutes for it to turn on!";
                    optiplexOn = true;
                }   
                else
                    msg = "ERROR: Optiplex already on! If Optiplex is desynchronized from the Discord Bot, run !so before running !wo again";
                break;
            case "so":
            case "statusoptiplex":
                getStatusOptiplex(message);
                break;
            case "sdo":
            case "shutdownoptiplex":
            {
                if(optiplexOn)
                {
                    doSSH("sudo shutdown \n" + optiPass + "\n");
                    msg = "Attempting to shutdown the Optiplex!";   
                    optiplexOn = false;
                }
                else
                    msg = "ERROR: Optiplex already off! If Optiplex is desynchronized from the Discord Bot, run !so before running !sdo again";
                break;
            }
            case "rbo":
            case "rebootoptiplex":
            {
                if(optiplexOn)
                {
                    doSSH("sudo shutdown -r\n" + optiPass + "\n");
                    msg = "Attempt to reboot the Optiplex! Please wait a couple minutes for it to turn on!";
                }
                else
                    msg = "ERROR: Optiplex already off! If Optiplex is desynchronized from the Discord Bot, run !so before running !rbo again";
                break;
            }
        }
        
        if(msg != null)
        {
            message.channel.send(msg);
            msg = null;
        }
    }
});

function doSSH(cmd)
{
    var conn = new Client();

    conn.on("ready", () => 
    {
        console.log("SSH Client Ready!");

        conn.shell((error, stream) => 
        {
            if (error) 
                throw error;

            stream.on("close", () =>
            {
                console.log("Closing Stream!");
                conn.end();
            })
            .on("data", (data) =>
            {
                console.log("STDOUT: " + data);
            })
            .stderr.on("data", (data) => 
            {
                console.log("STDERR: " + data);
            });
            stream.end(cmd);
        });
    })
    .connect(settings);
}

//Async function to check arguments and do port checking.
function checkIPArgs(ip_address, port_number, message)
{;
    var ip = ip_address;
    var port = port_number;
    
    if(!validIP(ip))
    {
        message.channel.send("ERROR: " + ip + " is not a valid IP address!");
        return;
    }
    else if(!/^[0-9]*$/.test(port) || parseInt(port) < 0 || parseInt(port) > 65535)
    {
        message.channel.send("ERROR: " + port + " is not a valid port!");
        return;
    }

    port = parseInt(port)

    if(ip == botIP)
    {
        isPortReachable(port, {host: EIPtoIIP(port)}).then(reachable => 
        {
            if(reachable)
                message.channel.send(ip + ":" + port + " is open.");
            else
                message.channel.send(ip + ":" + port + " is closed.");
        });
    }
    else
    {
        isPortReachable(port, {host: ip}).then(reachable => 
        {
            if(reachable)
                message.channel.send(ip + ":" + port + " is open.");
            else
                message.channel.send(ip + ":" + port + " is closed.");
        });
    }
    
}

//Check if inputted IP is bot's IP, then transforms it to the internal IP if it is.
function EIPtoIIP(port)
{
    switch(port)
    {
        case(222):
            return ipOpti;
        case(2222):
            return ipPi;
    }

    return botIP;
}

//Get the Bot's external IP, which should be the same as the Optiplex's.
function getBotIP()
{
    var Http = new XMLHttpRequest();
    Http.open("GET", url, false);
    Http.send(null);
    if(Http.status == 200)
    {
        var myArr = JSON.parse(Http.responseText);
        return myArr["YourFuckingIPAddress"];
    }
}

//Check if IP is valid.
function validIP(input) 
{
    var ip = input.split(".");

    if (ip.length != 4)
        return false;

    for (i = 0; i < ip.length; i++)
    {
        if (ip[i] == "")
            return false;
        temp = parseInt(ip[i]);
        if (i == 0 && (temp == 192 || temp == 10))
            return false;
        if (temp > 255 || temp < 0)
            return false;
    }

    return true;
}

//Bot checks if Optiplex is on.
function getStatusOptiplex(message)
{
    isPortReachable(222, {host: ipOpti}).then(reachable => 
    {
        if(reachable)
        {
            optiplexOn = true;
            message.channel.send("Optiplex is on!");
        }
        else
        {
            optiplexOn = false;
            message.channel.send("Optiplex is off or is turning on!");
        }
    });
}

//Initial check to see if Optiplex is on.
function initStatusOptiplex()
{
    isPortReachable(222, {host: ipOpti}).then(reachable => 
        {
            if(reachable)
                optiplexOn = true;
            else
                optiplexOn = false;    
        });
}

bot.login(token);