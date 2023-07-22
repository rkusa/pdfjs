const Helvetica = require("../../../font/Helvetica.js");
const HelveticaBold = require("../../../font/Helvetica-Bold.js");

const cm = 0.0393700787 * 72 * 10;

module.exports = function (doc, { image }) {
  const table = doc.table({
    widths: [null, null],
    borderHorizontalWidths: function (i) {
      return i < 2 ? 1 : 0.1;
    },
    padding: 5,
  });

  function addRow(index) {
    const tr = table.row();
    tr.cell(index.toString());

    tr.cell()
      .text()
      .add("A:")
      .br()
      .add("B:")
      .br()
      .add("C:")
      .br()
      .add("D:")
      .br()
      .add("E:")
      .br()
      .add("F:");
  }

  for (let i = 1; i < 11; ++i) {
    addRow(i);
  }
};
