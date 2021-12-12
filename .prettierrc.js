module.exports = {
    useTabs: true,
    overrides: [
      {
        files: "*.json",
        options: {
          parser: "json-stringify"
        }
      },
      {
        files: "*.html",
        options: {
          printWidth: 1000
        }
      }
    ]
};