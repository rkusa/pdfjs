const HelveticaBold = require("../../../font/Helvetica-Bold.js");

const cm = 0.0393700787 * 72 * 10;

module.exports = function (doc, { image }) {
  const table = doc.table({
    widths: [null],
    borderWidth: 1,
    padding: 4,
  });

  table.row({ font: HelveticaBold }).cell().text("Bold").add("Bold");
  table.row({ font: HelveticaBold }).cell().text("Bold").text("Bold");
};
