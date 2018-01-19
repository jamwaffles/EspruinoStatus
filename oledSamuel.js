// OLED screen has 15 yellow rows at top

require("Font8x12").add(Graphics);

function printLine(lineNumber, text) {
  g.drawString(text, 2, (lineNumber * 16) + 3);
}

var img = {
  width : 59, height : 49, bpp : 1,
  transparent : 0,
  buffer : E.toArrayBuffer(atob("Bh///8AAABDA9//4AAACGDj//wAAAAkvD//YAAAAB+H/8wAAAcD4P/8AAAAxHz9+YAAAAgHmAYAAAABgf4AAAAQAHA/gAAAAQAPB+AAAAEgAfDwABgAIgAAHMAPgIQAAAeogxgAQACA/YGDAHwAFj48wGAHAAOXz6AMAAAAcOjwAYAAAAAYAABzAAACAwAAH+AAgMDgAx/sAHgcHABI8EAfA4OAGggIA+B2eAZAAQB8D+8Bz/AAP4G18HA/gAfwfv8eB/gB/g5P/4H/AD+Dxf/gf4AH8H7//D/wAP4e3/8f+AAfw9v/5/AAAfhzv//8AAA+HXf//p/gB8Xv//4h/AD4PfH/3/4AHwP/P/vwAALh/4P//gAAyH/wf//wCBAP3g///gOCA//h///4fEB/fg//x4AAPs/wf/HwAAMZ/gP8PAAAYz/A94+AB/wH/B/30AD/iP/D/+AAH3Ef9zv8AAP+//52PwAAf9+A="))
};


function start(){
  g.setFont8x12();

  g.clear();
  g.setColor(1);
  g.fillRect(0, 0, 128, 15);

  g.setColor(0);
  printLine(0, "Motherfucka!");

  g.setColor(1);
  g.drawImage(img, 0, 15);

  g.flip();
}

// SPI
var s = new SPI();
s.setup({mosi: B6 /* D1 */, sck:B5 /* D0 */});
var g = require("SSD1306").connectSPI(s, A8 /* DC */, B7 /* RST - can leave as undefined */, start);