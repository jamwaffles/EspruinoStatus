/* Copyright (c) 2015 Gordon Williams, Pur3 Ltd. Modified by James Waples 2018 */
/*
Library for interfacing to the EspressIF ESP8266. Uses the 'NetworkJS'
library to provide a JS endpoint for HTTP.

For EspressIF ESP8266 firmware 0.25
*/

var at;
var socks = [];
var sockData = ["","","","",""];
var MAXSOCKETS = 5;
var ENCR_FLAGS = ["open","wep","wpa_psk","wpa2_psk","wpa_wpa2_psk"];

/*
`socks` can have the following states:

undefined         : unused
true              : connected and ready
"DataClose"       : closed on esp8266, but with data still in sockData
"Wait"            : waiting for connection (client), or for data to be sent
"WaitClose"       : We asked to close it, but it hasn't been opened yet
"Accept"          : opened by server, waiting for 'accept' to be called
*/

var netCallbacks = {
  create : function(host, port) {
    /* Create a socket and return its index, host is a string, port is an integer.
    If host isn't defined, create a server socket */
    if (host===undefined) {
      sckt = MAXSOCKETS;
      socks[sckt] = "Wait";
      sockData[sckt] = "";
      at.cmd("AT+CIPSERVER=1,"+port+"\r\n", 10000, function(d) {
        if (d=="OK") {
          socks[sckt] = true;
        } else {
          socks[sckt] = undefined;
          setTimeout(function() {
            throw new Error("CIPSERVER failed ("+(d?d:"Timeout")+")");
          }, 0);
        }
      });
      return MAXSOCKETS;
    } else {
      var sckt = 0;
      while (socks[sckt]!==undefined) sckt++; // find free socket
      if (sckt>=MAXSOCKETS) return -7; // SOCKET_ERR_MAX_SOCK
      socks[sckt] = "Wait";
      sockData[sckt] = "";
      at.cmd('AT+CIPSTART='+sckt+',"TCP",'+JSON.stringify(host)+','+port+'\r\n',10000, function cb(d) {
        if (d!="OK") socks[sckt] = -6; // SOCKET_ERR_NOT_FOUND
      });
    }
    return sckt;
  },
  /* Close the socket. returns nothing */
  close : function(sckt) {
    if (socks[sckt]=="Wait")
      socks[sckt]="WaitClose";
    else if (socks[sckt]!==undefined) {
      // socket may already have been closed (eg. received 0,CLOSE)
      if (socks[sckt]<0)
        socks[sckt] = undefined;
      else
      // we need to a different command if we're closing a server
        at.cmd(((sckt==MAXSOCKETS) ? 'AT+CIPSERVER=0' : ('AT+CIPCLOSE='+sckt))+'\r\n',1000, function(d) {
          socks[sckt] = undefined;
        });
    }
  },
  /* Accept the connection on the server socket. Returns socket number or -1 if no connection */
  accept : function(sckt) {
    // console.log("Accept",sckt);
    for (var i=0;i<MAXSOCKETS;i++)
      if (socks[i]=="Accept") {
        //console.log("Socket accept "+i,JSON.stringify(sockData[i]),socks[i]);
        socks[i] = true;
        return i;
      }
    return -1;
  },
  /* Receive data. Returns a string (even if empty).
  If non-string returned, socket is then closed */
  recv : function(sckt, maxLen) {
    if (sockData[sckt]) {
      var r;
      if (sockData[sckt].length > maxLen) {
        r = sockData[sckt].substr(0,maxLen);
        sockData[sckt] = sockData[sckt].substr(maxLen);
      } else {
        r = sockData[sckt];
        sockData[sckt] = "";
        if (socks[sckt]=="DataClose")
          socks[sckt] = undefined;
      }
      return r;
    }
    if (socks[sckt]<0) return socks[sckt]; // report an error
    if (!socks[sckt]) return -1; // close it
    return "";
  },
  /* Send data. Returns the number of bytes sent - 0 is ok.
  Less than 0  */
  send : function(sckt, data) {
    if (at.isBusy() || socks[sckt]=="Wait") return 0;
    if (socks[sckt]<0) return socks[sckt]; // report an error
    if (!socks[sckt]) return -1; // close it
    //console.log("Send",sckt,data);

    var cmd = 'AT+CIPSEND='+sckt+','+data.length+'\r\n';
    at.cmd(cmd, 10000, function cb(d) {
      if (d=="OK") {
        at.register('> ', function() {
          at.unregister('> ');
          at.write(data);
          return "";
        });
        return cb;
      } else if (d=="Recv "+data.length+" bytes") {
        // all good, we expect this
        return cb;
      } else if (d=="SEND OK") {
        // we're ready for more data now
        if (socks[sckt]=="WaitClose") netCallbacks.close(sckt);
        socks[sckt]=true;
      } else {
        socks[sckt]=undefined; // uh-oh. Error.
        at.unregister('> ');
      }
    });
    // if we obey the above, we shouldn't get the 'busy p...' prompt
    socks[sckt]="Wait"; // wait for data to be sent
    return data.length;
  }
};


//Handle +IPD input data from ESP8266
function ipdHandler(line) {
  var colon = line.indexOf(":");
  if (colon<0) return line; // not enough data here at the moment
  var parms = line.substring(5,colon).split(",");
  parms[1] = 0|parms[1];
  var len = line.length-(colon+1);
  if (len>=parms[1]) {
   // we have everything
   sockData[parms[0]] += line.substr(colon+1,parms[1]);
   return line.substr(colon+parms[1]+1); // return anything else
  } else {
   // still some to get
   sockData[parms[0]] += line.substr(colon+1,len);
   return "+IPD,"+parms[0]+","+(parms[1]-len)+":"; // return IPD so we get called next time
  }
}

var wifiFuncs = {
    ipdHandler:ipdHandler,
  "debug" : function() {
    return {
      socks:socks,
      sockData:sockData
    };
  },
  // initialise the ESP8266
  "init" : function(callback) {
    at.cmd("ATE0\r\n",1000,function cb(d) { // turn off echo
      if (d=="ATE0") return cb;
      if (d=="OK") {
        at.cmd("AT+CIPMUX=1\r\n",1000,function(d) { // turn on multiple sockets
          if (d!="OK") callback("CIPMUX failed: "+(d?d:"Timeout"));
          else callback(null);
        });
      }
      else callback("ATE0 failed: "+(d?d:"Timeout"));
    });
  },
  "reset" : function(callback) {
    at.cmd("\r\nAT+RST\r\n", 10000, function cb(d) {
      //console.log(">>>>>"+JSON.stringify(d));
      // 'ready' for 0.25, 'Ready.' for 0.50
      setTimeout(function() { wifiFuncs.init(callback); }, 1000);
    });
  },
  "connect" : function(ssid, key, callback) {
    at.cmd("AT+CWMODE=1\r\n", 1000, function(cwm) {
      // console.log("CWM", cwm);
      at.cmd("AT+CWJAP="+JSON.stringify(ssid)+","+JSON.stringify(key)+"\r\n", 20000, function cb(d) {
        // console.log('d', d);
        if (["WIFI DISCONNECT","WIFI CONNECTED","WIFI GOT IP","+CWJAP:1"].indexOf(d)>=0) return cb;
        if (d!="OK") setTimeout(callback,0,"WiFi connect failed: "+(d?d:"Timeout"));
        else setTimeout(callback,0,null);
      });
    });
  }
};

function sckOpen(ln) {
  //console.log("CONNECT", JSON.stringify(ln));
  socks[ln[0]] = socks[ln[0]]=="Wait" ? true : "Accept";
}
function sckClosed(ln) {
  //console.log("CLOSED", JSON.stringify(ln));
  socks[ln[0]] = sockData[ln[0]]!="" ? "DataClose" : undefined;
}

exports.connect = function(usart) {
  wifiFuncs.at = at = require("AT").connect(usart);
  require("NetworkJS").create(netCallbacks);

  at.register("+IPD", ipdHandler);
  at.registerLine("0,CONNECT", sckOpen);
  at.registerLine("1,CONNECT", sckOpen);
  at.registerLine("2,CONNECT", sckOpen);
  at.registerLine("3,CONNECT", sckOpen);
  at.registerLine("4,CONNECT", sckOpen);
  at.registerLine("0,CLOSED", sckClosed);
  at.registerLine("1,CLOSED", sckClosed);
  at.registerLine("2,CLOSED", sckClosed);
  at.registerLine("3,CLOSED", sckClosed);
  at.registerLine("4,CLOSED", sckClosed);

  return wifiFuncs;
};
