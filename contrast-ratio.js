const fs = require('fs');

const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
};

// storeData(string, path);

const ColorUtil = (function buildColorUtil() {
  return {
    intToHex(int) {
      return int.toString(16).padStart(2, '0');
    },

    getRandomRGBColor() {
      const red = MathUtil.getRandomInt(255);
      const green = MathUtil.getRandomInt(255);
      const blue = MathUtil.getRandomInt(255);

      return {
        red,
        green,
        blue,
      };
    },

    getRandomHexColor() {
      const rgbColor = this.getRandomRGBColor();
      return this.rgbToHex(rgbColor);
    },

    getRandomHslColor() {
      const rgbColor = this.getRandomRGBColor();
      return this.rgbToHsl(rgbColor);
    },

    rgbToHex({ red, green, blue }) {
      const redHex = this.intToHex(red);
      const greenHex = this.intToHex(green);
      const blueHex = this.intToHex(blue);

      return `#${redHex}${greenHex}${blueHex}`;
    },

    hexToRgb(hexColor) {
      let hexValue;

      if (hexColor.startsWith('#')) {
        hexValue = hexColor.slice(1);
      } else {
        hexValue = hexColor;
      }

      const redHexStr = hexValue.slice(0, 2);
      const greenHexStr = hexValue.slice(2, 4);
      const blueHexStr = hexValue.slice(4, 6);

      const redInt = Number.parseInt(redHexStr, 16);
      const greenInt = Number.parseInt(greenHexStr, 16);
      const blueInt = Number.parseInt(blueHexStr, 16);

      return { red: redInt, green: greenInt, blue: blueInt };
    },

    rgbToHsl({ red: r, green: g, blue: b }) {
      // This function taken from this CSS Tricks article:
      // https://css-tricks.com/converting-color-spaces-in-javascript/

      // Make r, g, and b fractions of 1
      r /= 255;
      g /= 255;
      b /= 255;

      // Find greatest and smallest channel values
      let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

      // Calculate hue
      // No difference
      if (delta == 0) h = 0;
      // Red is max
      else if (cmax == r) h = ((g - b) / delta) % 6;
      // Green is max
      else if (cmax == g) h = (b - r) / delta + 2;
      // Blue is max
      else h = (r - g) / delta + 4;

      h = Math.round(h * 60);

      // Make negative hues positive behind 360°
      if (h < 0) {
        h += 360;
      }

      // Calculate lightness
      l = (cmax + cmin) / 2;

      // Calculate saturation
      s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

      // Multiply l and s by 100
      s = +(s * 100).toFixed(1);
      l = +(l * 100).toFixed(1);

      return { h, s, l };
    },
  };
})();

function relativeLuminance(red, green, blue) {
  const channels = [red, green, blue];

  const channelsDecimal = channels.map((channel) => {
    const channelDecimal = channel / 255;

    if (channelDecimal > 0.03928) {
      return ((channelDecimal + 0.055) / 1.055) ** 2.4;
    } else {
      return channelDecimal / 12.92;
    }
  });

  const convertedRed = channelsDecimal[0];
  const convertedGreen = channelsDecimal[1];
  const convertedBlue = channelsDecimal[2];

  return (
    0.2126 * convertedRed + 0.7152 * convertedGreen + 0.0722 * convertedBlue
  );
}

function sortLuminances(lumiOne, lumiTwo) {
  const [higherLuminance, lowerLuminance] = [lumiOne, lumiTwo].sort().reverse();
  return { higherLuminance, lowerLuminance };
}

function contrastRatio(colorOne, colorTwo) {
  const luminanceOne = relativeLuminance(...colorOne);
  const luminanceTwo = relativeLuminance(...colorTwo);

  const { higherLuminance, lowerLuminance } = sortLuminances(
    luminanceOne,
    luminanceTwo
  );

  return (higherLuminance + 0.05) / (lowerLuminance + 0.05);
}

function getContrastRatioAgainstWhite(red, green, blue) {
  const rgbWhite = [255, 255, 255];
  return contrastRatio([red, green, blue], rgbWhite);
}

function getContrastRatioAgainstBlack(red, green, blue) {
  const rgbBlack = [0, 0, 0];
  return contrastRatio([red, green, blue], rgbBlack);
}

function logRelativeLuminance(red, green, blue) {
  const luminance = relativeLuminance(red, green, blue);
  console.log(
    `Relative luminance for (${red}, ${green}, ${blue}): ${luminance}`
  );
}

function logContrastRatioAgainstWhiteAndBlack(red, green, blue) {
  const ratioAgainstWhite = getContrastRatioAgainstWhite(red, green, blue);
  const ratioAgainstBlack = getContrastRatioAgainstBlack(red, green, blue);
  console.log(
    `\nContrast ratios for (${red}, ${green}, ${blue}):\nAgainst white 1:${ratioAgainstWhite}\nAgainst black 1:${ratioAgainstBlack}`
  );
}

// const colors = [
//   [255, 255, 255],
//   [127, 127, 127],
//   [0, 0, 0],
// ];

function buildColorsArray(bitsPerChannel = 3, logInterval = 10000) {
  let array = [];
  const channelLimit = 2 ** bitsPerChannel;
  const channelCount = 3;
  const totalLimit = channelLimit ** channelCount;
  const ONE_MILLION = 1000000;
  let counter = 0;
  let millionCounter = 0;

  for (let red = 0; red < channelLimit; red += 1) {
    for (let green = 0; green < channelLimit; green += 1) {
      for (let blue = 0; blue < channelLimit; blue += 1) {
        const hex = ColorUtil.rgbToHex({ red, green, blue });
        const {
          h: hueDegrees,
          s: saturationPercentage,
          l: lightnessPercentage,
        } = ColorUtil.rgbToHsl({ red, green, blue });
        const contrastRatioAgainstWhite = getContrastRatioAgainstWhite(
          red,
          green,
          blue
        );
        const contrastRatioAgainstBlack = getContrastRatioAgainstBlack(
          red,
          green,
          blue
        );
        const colorObject = {
          red,
          green,
          blue,
          hex,
          hueDegrees,
          saturationPercentage,
          lightnessPercentage,
          contrastRatioAgainstWhite,
          contrastRatioAgainstBlack,
        };

        array.push(colorObject);

        counter += 1;
        if (counter % logInterval === 0) {
          console.log(`${counter} colors`);
        }

        // if (counter === 1) {
        //   debugger;
        // }

        // if (counter === 2097152) {
        //   debugger;
        // }

        if (counter % ONE_MILLION === 0 || counter === totalLimit) {
          millionCounter += 1;
          const path = `${bitsPerChannel}bits-part-${millionCounter}.json`;
          storeData(array, path);
          array = [];
        }
      }
    }
  }

  return array;
}

const bitStart = 7;
const bitEnd = 7;
const logInterval = 100000;
buildColorsArray(8, logInterval);
// for (let bits = bitStart; bits <= bitEnd; bits += 1) {
//   const colors = buildColorsArray(bits, logInterval);
//   const colorCount = (2 ** bits) ** 3;
//   const path = `${bits}bits-${colorCount}colors.json`;
// }

// {
//   "red": 84,
//   "green": 44,
//   "blue": 250,
//   "label": "blue-ish",
//   "colorHex": "#542cfa"
// }

// fs.writeFile(path, JSON.stringify(array), (err) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
// });
