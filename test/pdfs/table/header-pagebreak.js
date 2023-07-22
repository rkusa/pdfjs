module.exports = function (doc, { lorem }) {
  doc.header().text("PAGE HEADER");

  doc.cell({ paddingTop: 750 });

  const table = doc.table({
    widths: [200, 200],
    borderWidth: 1,
    fontSize: 11,
  });

  const header = table.header();
  header.cell("Header Left", { textAlign: "center", padding: 30 });
  header.cell("Header Right", { textAlign: "center", padding: 30 });

  for (let i = 0; i < 1; ++i) {
    const r = table.row();
    r.cell("Cell 1", { padding: 10, paddingBottom: 100 });
    r.cell("Cell 2", { padding: 10, paddingBottom: 100 });
  }

  doc.text("Foo");
};
