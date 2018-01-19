// function start(){
// 	// write some text
// 	g.drawString("Hello World!",2,2);
// 	// write to the screen
// 	g.flip();
// }

// // SPI
// var s = new SPI();
// s.setup({mosi: B15 /* D1 */, sck:B13 /* D0 */});
// var g = require("SSD1306").connectSPI(s, B14 /* DC */, B10 /* RST - can leave as undefined */, start);

// function start_mono(){
// 	// write some text
// 	g_mono.drawString("Hello World!",2,2);
// 	// write to the screen
// 	g_mono.flip();
// }

// // I2C
// I2C1.setup({scl:B6,sda:B7});
// var g_mono = require("SSD1306").connect(I2C1, start_mono);

var esp = require("https://gist.githubusercontent.com/jamwaffles/5141e1a4a1c6258b81831b5315074336/raw/355f74ecc8981c5da778980511f86bdf1daa8c18/esp8266_0v25_fixed.js");

digitalWrite(B9,1);

Serial2.setup(115200, { rx: A3, tx : A2 });

var wifi = esp.connect(Serial2);

wifi.reset(function(e) {

  console.log("Connecting to WiFi");
  wifi.connect("ClownsUnderTheBed","3dooty5g", function(e) {
//    if (e) throw e;
    console.log("Connected");
    wifi.getIP(console.log);
    require("http").get("http://www.espruino.com", function(res) {
      console.log("Response: ",res);
      res.on('data', function(d) {
        console.log("--->"+d);
      });
    });
  });
});
