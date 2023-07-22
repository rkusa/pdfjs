module.exports = function (doc, fixtures) {
  for (var i = 0; i < 10; i++) {
    const table = doc
      .table({ widths: [null, null], borderWidth: 1, padding: 100 })
      .row();
    table.cell().text(`L ${i}`);
    table.cell().text(`R ${i}`);
  }
};
