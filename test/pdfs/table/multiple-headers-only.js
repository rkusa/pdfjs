module.exports = function (doc, { lorem }) {
  const table = doc.table({
    widths: [null, null],
    borderWidth: 1,
  });

  const header1 = table.header();
  header1.cell("Header Left1", { textAlign: "center", padding: 30 });
  header1.cell("Header Right1", { textAlign: "center", padding: 30 });

  const header2 = table.header();
  header2.cell("Header Left2", { textAlign: "center", padding: 30 });
  header2.cell("Header Right2", { textAlign: "center", padding: 30 });

  const header3 = table.header();
  header3.cell("Header Left3", { textAlign: "center", padding: 30 });
  header3.cell("Header Right3", { textAlign: "center", padding: 30 });

  const borderless_table = doc.table({
    widths: [null, null],
    borderWidth: 0,
  });

  const header4 = borderless_table.header();
  header4.cell("Header Left1", { textAlign: "center", padding: 30 });
  header4.cell("Header Right1", { textAlign: "center", padding: 30 });

  const header5 = borderless_table.header();
  header5.cell("Header Left2", { textAlign: "center", padding: 30 });
  header5.cell("Header Right2", { textAlign: "center", padding: 30 });

  const header6 = borderless_table.header();
  header6.cell("Header Left3", { textAlign: "center", padding: 30 });
  header6.cell("Header Right3", { textAlign: "center", padding: 30 });
};
