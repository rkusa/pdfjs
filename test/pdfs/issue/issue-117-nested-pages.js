module.exports = function (doc, { font }) {
  const pdf = require("../../../");
  const path = require("path");
  const fs = require("fs");

  const external = new pdf.ExternalDocument(
    fs.readFileSync(path.join(__dirname, "/fixtures/issue-117.pdf")),
  );
  doc.addPageOf(43, external); // should add "Hello 41" as the first page
  doc.addPagesOf(external);
};
