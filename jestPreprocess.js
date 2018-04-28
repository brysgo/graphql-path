const babelOptions = { presets: ["env"] };

module.exports = require("babel-jest").createTransformer(babelOptions);
