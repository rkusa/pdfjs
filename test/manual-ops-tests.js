const pdf = require("../lib");
const fs = require("fs");

var lorem =
  "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.";

const helveticaFont = new pdf.Font(require("../font/Helvetica.json"));

let doc = new pdf.Document({
  font: helveticaFont,
  padding: 10,
  lineHeight: 1
});
doc.info.id = "42";
doc.info.creationDate = new Date(2015, 1, 19, 22, 33, 26);
doc.info.producer = "pdfjs tests (github.com/rkusa/pdfjs)";
doc.pipe(fs.createWriteStream("output-ops-absolute.pdf"));

// absolute
doc.op(0, 0, 1, "sc");
doc.op(0, 830, 297.6648, 11.896, "re");
doc.op("f");

doc.text(lorem);

doc.end();

doc = new pdf.Document({
  font: helveticaFont,
  padding: 10,
  lineHeight: 1
});
doc.info.id = "42";
doc.info.creationDate = new Date(2015, 1, 19, 22, 33, 26);
doc.info.producer = "pdfjs tests (github.com/rkusa/pdfjs)";
doc.pipe(fs.createWriteStream("output-ops-relative.pdf"));

doc.text(lorem);

// relative
doc.op(1, 0, 0, "sc");
doc.op((x, y) => {
  const height = 40;
  return [x, y - height, x + 60, height, "re"];
});
doc.op("f");

doc.end();
