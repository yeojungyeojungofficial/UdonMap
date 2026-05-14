/* eslint-disable @typescript-eslint/no-require-imports */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function readResponsiveValues() {
  return JSON.parse(
    readFileSync(
      join(__dirname, "../src/constants/responsive-values.json"),
      "utf8",
    ),
  );
}

function responsiveMediaPlugin() {
  const responsiveValues = readResponsiveValues();
  const mobileMax = `(max-width: ${responsiveValues.MOBILE_BREAKPOINT}px)`;
  const mobileMin = `(min-width: ${responsiveValues.MOBILE_BREAKPOINT + 1}px)`;
  const footerMobileMax = `(max-width: ${responsiveValues.FOOTER_BREAKPOINT}px)`;
  const footerMobileMin = `(min-width: ${responsiveValues.FOOTER_BREAKPOINT + 1}px)`;

  return {
    postcssPlugin: "animal-map-responsive-media",
    AtRule: {
      media(atRule) {
        atRule.params = atRule.params
          .replaceAll("--mobile", mobileMax)
          .replaceAll("--desktop", mobileMin)
          .replaceAll("--footer-mobile", footerMobileMax)
          .replaceAll("--footer-desktop", footerMobileMin);
      },
    },
  };
}

responsiveMediaPlugin.postcss = true;

module.exports = responsiveMediaPlugin;
