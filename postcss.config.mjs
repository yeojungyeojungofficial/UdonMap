const MOBILE_BREAKPOINT = 670;
const FOOTER_BREAKPOINT = 670;

const mobileMax = `(max-width: ${MOBILE_BREAKPOINT}px)`;
const mobileMin = `(min-width: ${MOBILE_BREAKPOINT + 1}px)`;
const footerMobileMax = `(max-width: ${FOOTER_BREAKPOINT}px)`;
const footerMobileMin = `(min-width: ${FOOTER_BREAKPOINT + 1}px)`;

function responsiveMediaPlugin() {
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

const config = {
  plugins: [responsiveMediaPlugin, "@tailwindcss/postcss"],
};

export default config;
