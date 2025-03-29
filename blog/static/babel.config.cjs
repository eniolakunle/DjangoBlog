module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current", // Ensure Babel transpiles for your current Node version.
        },
      },
    ],
  ],
};
