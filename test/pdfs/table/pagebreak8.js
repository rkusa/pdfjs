module.exports = function (doc, { lorem }) {
  doc.header().text("Header");
  doc.footer().text("Footer");

  doc.cell({ y: 120 });

  const table = doc.table({
    widths: [null, null],
    borderWidth: 1,
    padding: 10,
  });

  for (let i = 0; i < 2; ++i) {
    const row = table.row();
    row.cell("Cell " + i);
    const cell = row.cell();
    for (let i = 0; i < 3; ++i) {
      cell.text("text " + i);
    }
  }
};
