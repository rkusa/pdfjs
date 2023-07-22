module.exports = function (doc, { lorem }) {
  const table = doc.table({
    widths: [200, 200],
    borderWidth: 1,
  });

  // The behavior with the headers not appearing on the remaining pages is intentional
  // See issue #292 https://github.com/rkusa/pdfjs/issues/292
  const header1 = table.header();
  header1.cell("Header Left1", { textAlign: "center", padding: 30 });
  header1.cell("Header Right1", { textAlign: "center", padding: 30 });

  const header2 = table.header();
  header2.cell("Header Left2", { textAlign: "center", padding: 30 });
  header2.cell("Header Right2", { textAlign: "center", padding: 30 });

  const header3 = table.header();
  header3.cell("Header Left3", { textAlign: "center", padding: 30 });
  header3.cell("Header Right3", { textAlign: "center", padding: 30 });

  const row1 = table.row();

  row1.cell(lorem.long, {
    fontSize: 11,
    padding: 10,
    backgroundColor: 0xdddddd,
  });
  row1.cell("Cell 2", { fontSize: 11, padding: 10, backgroundColor: 0xeeeeee });

  const row2 = table.row();

  row2.cell(lorem.long, {
    fontSize: 16,
    padding: 10,
    backgroundColor: 0xdddddd,
  });
  row2.cell("Cell 2", { fontSize: 11, padding: 10, backgroundColor: 0xeeeeee });

  const row3 = table.row();

  row3.cell("Cell 1", { fontSize: 16, padding: 10, backgroundColor: 0xdddddd });
  row3.cell(lorem.short, {
    fontSize: 11,
    padding: 10,
    backgroundColor: 0xeeeeee,
  });

  doc.text("Foo");
};
