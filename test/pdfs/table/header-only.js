module.exports = function (doc, { lorem }) {
  const table = doc.table({
    widths: [null, null],
    borderWidth: 1,
  });

  const header = table.header();
  header.cell("Header Left", { textAlign: "center", padding: 30 });
  header.cell("Header Right", { textAlign: "center", padding: 30 });
};
