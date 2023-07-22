module.exports = function (doc, { lorem }) {
  const table = doc.table({
    widths: [null, null, null],
    borderWidth: 1,
  });
  const header_props = {
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 5,
    paddingRight: 5,
  };
  for (let i = 0; i < 3; ++i) {
    const header = table.header();
    header.cell("Header Left " + i, header_props);
    header.cell("Header Center " + i, header_props);
    header.cell("Header Right " + i, header_props);
  }

  const row_props = { fontSize: 11, padding: 30 };
  for (let i = 0; i < 25; ++i) {
    const row = table.row();
    row.cell("Cell Left " + i, { ...row_props, backgroundColor: 0xcccccc });
    row.cell("Cell Center " + i, { ...row_props, backgroundColor: 0xdddddd });
    row.cell("Cell Right " + i, { ...row_props, backgroundColor: 0xeeeeee });
  }
};
