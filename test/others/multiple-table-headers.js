const test = require("tape");
const pdf = require("../../lib");

test("table headers created in-between rows", function (t) {
  const doc = new pdf.Document();
  const table = doc.table({ widths: [] });
  table.header();
  table.header();
  table.row();
  t.throws(
    () => table.header(),
    /The table already has rows, cannot add additional headers/,
  );
  t.end();
});
