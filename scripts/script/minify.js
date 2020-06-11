const fs = require("fs");
const UglifyJS = require("uglify-es");

const { name } = require("../config/contract.json");

function minify(path, name) {
  const source = fs.readFileSync(`${path}/${name}.js`, "utf-8");
  const minified = UglifyJS.minify(source);
  if (!minified.code)
    throw minified.error;
  fs.writeFileSync(`${path}/${name}.min.js`, minified.code, "utf-8")
}
function main() {
  const path = `contract`;
  try {
    minify(path, name);
    console.log(`\u001b[32mSUCCESS:\u001b[00m minify contract code: ${path}/${name}.min.js`);
  } catch (error) {
    console.log(`\u001b[31mFAILED:\u001b[00m minify contract code: ${path}/${name}.js`);
    console.log(`\u001b[33m${error}\u001b[00m`);
  }
}
main()