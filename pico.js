require("FontDennis8").add(Graphics);
require("Font8x16").add(Graphics);

var g = undefined
const screenWidth = 128;
const screenHeight = 64;
const yellowBarHeight = 16;

var WebSocket = require("ws");

function connectToWifi(cb) {
  var esp = require("https://raw.githubusercontent.com/jamwaffles/EspruinoStatus/master/esp8266_0v25_hacked.min.js");

  digitalWrite(B9,1);

  Serial2.setup(115200, { rx: A3, tx : A2 });

  var wifi = esp.connect(Serial2);

  wifi.reset(function(e) {
    wifi.connect("ClownsUnderTheBed", "3dooty5g", function(e) {
      cb();
    });
  });
}

function connectToWebsocket(cb) {
  var host = '192.168.0.8';

  var ws = new WebSocket(host, { port: 8080 });

  ws.on('open', function() {
    console.log("Connected to server");

    cb(ws);
  });
}

function connectToDisplay(cb) {
  var s = new SPI();
  s.setup({mosi: B6 /* D1 */, sck:B5 /* D0 */});
  var g = require("SSD1306").connectSPI(s, A8 /* DC */, B7 /* RST - can leave as undefined */, function() {
    cb(g);
  });
}

function writeYellowBar(line1, line2, bigNumber) {
  const yellowBarTopleft = 48;

  if(line1 !== undefined) {
    g.setFontDennis8();
    g.drawString(line1, 0, yellowBarTopleft);
  }

  if(line2 !== undefined) {
    g.setFontDennis8();
    g.drawString(line2, 0, yellowBarTopleft + 8);
  }

  if(bigNumber !== undefined) {
    g.setFont8x16();

    // Clear this many pixels from the right
    const toClear = g.stringWidth(bigNumber) + 1

    g.drawString(bigNumber, screenWidth - (toClear + 1), yellowBarTopleft);
  }
}

function startDvdBouncer() {
  var dvd = {
    width : 34, height : 18, bpp : 1,
    transparent : 0,
    buffer : E.toArrayBuffer(atob("H/8H/gf/w//gB/DgPOD+dwc4e7nDzh78cOf/Hj/5/wcP+AABwAAAACAAAAf/4AD/4H/w/+AH/w////+AB//wAEkogoAMSTkQAROOOAA="))
  };

  var posx = 0;
  var posy = 0;
  var velx = 1;
  var vely = 0.8;
  var ylimit = screenHeight - yellowBarHeight;

  function dvdBouncer() {
    g.drawImage(dvd, posx, posy);

    posx += velx;
    posy += vely;

    if(posx + dvd.width > screenWidth || posx < 0) {
      velx *= -1;
    }

    if(posy + dvd.height > ylimit || posy < 0) {
      vely *= -1;
    }
  }

  return dvdBouncer
}

function start() {
  connectToDisplay(function(disp) {
    console.log("Connected to display");
    g = disp

    // Upside down display
    g.setRotation(2, false);

    g.clear();
    g.drawString("Connecting...",2,2);
    g.flip();

    connectToWifi(function() {
      console.log("Connected to wifi");
      g.clear();
      g.drawString("Opening socket...",2,2);
      g.flip();

      connectToWebsocket(function(ws) {
        console.log("All ready");
        g.clear();
        g.drawString("Waiting for messages...",2,2);
        g.flip();

        var time = "...";

        ws.on('message', function(msg) {
          time = msg;
        });

        var dvdBounceIter = startDvdBouncer();

        setInterval(function() {
          g.clear();

          dvdBounceIter();
          writeYellowBar("The", "time", time);

          g.flip();
        }, 16);
      });
    });
  });
}

E.on('init', start);
// start();
