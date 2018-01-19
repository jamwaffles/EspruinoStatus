// OLED screen has 15 yellow rows at top

require("Font8x12").add(Graphics);

function printLine(lineNumber, text) {
  g.drawString(text, 2, (lineNumber * 16) + 3);
}

function start(){
  g.setFont8x12();

  g.clear();
  g.setColor(1);
  g.fillRect(0, 0, 128, 15);

  g.setColor(0);
  printLine(0, "Hello World!");
  g.setColor(1);
  printLine(1, "All good");
  printLine(2, "In tha");
  printLine(3, "Hood");

  g.flip();
}

// SPI
var s = new SPI();
s.setup({mosi: B6 /* D1 */, sck:B5 /* D0 */});
var g = require("SSD1306").connectSPI(s, A8 /* DC */, B7 /* RST - can leave as undefined */, start);