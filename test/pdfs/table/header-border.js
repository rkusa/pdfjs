module.exports = function (doc, { lorem }) {
  // borders should be on the odd horizontal lines
  const odd_borders = doc.table({
    widths: [null, null],
    borderHorizontalWidths: (i) => (i % 2) * 5,
    borderColor: 0x00ff00,
  });
  for (let i = 0; i < 3; ++i) {
    const header = odd_borders.header();
    header.cell("Odd Left " + i, {
      textAlign: "center",
      padding: 30,
      backgroundColor: 0xff0000,
    });
    header.cell("Odd Right " + i, {
      textAlign: "center",
      padding: 30,
      backgroundColor: 0xff0000,
    });
  }

  // borders should be on the odd horizontal lines
  const even_borders = doc.table({
    widths: [null, null],
    borderHorizontalWidths: (i) => ((i + 1) % 2) * 5,
    borderColor: 0x0000ff,
  });
  for (let i = 0; i < 3; ++i) {
    const header = even_borders.header();
    header.cell("Even Left " + i, {
      textAlign: "center",
      padding: 30,
      backgroundColor: 0xff0000,
    });
    header.cell("Even Right " + i, {
      textAlign: "center",
      padding: 30,
      backgroundColor: 0xff0000,
    });
  }
};
