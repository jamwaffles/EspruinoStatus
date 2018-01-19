// function start_mono(){
//  // write some text
//  g_mono.drawString("Hello World!",2,2);
//  // write to the screen
//  g_mono.flip();
// }

// // I2C
// I2C1.setup({scl:B6,sda:B7});
// var g_mono = require("SSD1306").connect(I2C1, start_mono);

var WebSocket = require("ws");

function connectToWifi(cb) {
  var esp = require("https://raw.githubusercontent.com/jamwaffles/EspruinoStatus/master/esp8266_0v25_hacked.js");

  digitalWrite(B9,1);

  Serial2.setup(115200, { rx: A3, tx : A2 });

  var wifi = esp.connect(Serial2);

  wifi.reset(function(e) {
    wifi.connect("ClownsUnderTheBed","3dooty5g", function(e) {
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
    console.log("Noice");
    cb(g);
  });
}

function drawTime(d, time){
  d.clear();
  // write some text
  d.drawString("Da tiem:",2,2);

  d.drawString(time,2,20);
  // write to the screen
  d.flip();
}

console.log("Starting");

connectToDisplay(function(disp) {
  console.log("Connected to display");

  disp.clear();
  disp.drawString("Connecting...",2,2);
  disp.flip();

  connectToWifi(function() {
    console.log("Connected to wifi");
    disp.clear();
    disp.drawString("Opening socket...",2,2);
    disp.flip();

    connectToWebsocket(function(ws) {
      console.log("All ready");
      disp.clear();
      disp.drawString("Waiting for messages...",2,2);
      disp.flip();

      ws.on('message', function(msg) {
        drawTime(disp, msg);
      });
    });
  });
});