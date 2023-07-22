module.exports = function (doc) {
  doc.cell({ y: 140 });

  const table = doc.table({
    widths: [100, null],
    borderWidth: 1,
    borderColor: 0xf00f00,
  });
  const row = table.row();

  row.cell(`heading`, {
    padding: 12,
  });

  const cell = row.cell();

  cell.cell(`value - 1`, {
    padding: 12,
  });

  cell.cell(`value - 2`, {
    padding: 10,
  });

  cell.cell(`value - 3`, {
    padding: 10,
  });

  cell.cell(`value - 4`, {
    padding: 10,
  });
};
