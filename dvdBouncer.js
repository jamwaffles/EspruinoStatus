require("FontDennis8").add(Graphics);
require("Font8x16").add(Graphics);

var g = undefined;

function connectToDisplay(cb) {
  var s = new SPI();
  s.setup({mosi: B6 /* D1 */, sck:B5 /* D0 */});
  var g = require("SSD1306").connectSPI(s, A8 /* DC */, B7 /* RST - can leave as undefined */, function() {
    cb(g);
  });
}

function writeYellowBar(line1, line2, bigNumber) {
  const yellowBarTopleft = 48;
  const screenWidth = 128;

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

  const gw = 128;
  const gh = 64;
  const yellowBarHeight = 16;

  var posx = 0;
  var posy = 0;
  var velx = 0.5;
  var vely = 0.4;
  var ylimit = gh - yellowBarHeight;

  function dvdBouncer() {
    g.drawImage(dvd, posx, posy);

    posx += velx;
    posy += vely;

    if(posx + dvd.width > gw || posx < 0) {
      velx *= -1;
    }

    if(posy + dvd.height > ylimit || posy < 0) {
      vely *= -1;
    }
  }

  return dvdBouncer;
}

connectToDisplay(function(disp) {
  console.log("Connected to display");
  g = disp;

  // Upside down display
  g.setRotation(2, false);

  var dvdBounceIter = startDvdBouncer();
  var counter = 0;

  setInterval(function() {
    counter += 1;
  }, 1000);

  setInterval(function() {
    g.clear();

    dvdBounceIter();
    writeYellowBar("Seconds", undefined, counter);

    g.flip();
  }, 16);
});