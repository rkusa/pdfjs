module.exports = function (doc) {
  const pdf = require("../../../");
  const path = require("path");
  const fs = require("fs");

  const external = new pdf.ExternalDocument(
    fs.readFileSync(path.join(__dirname, "/fixtures/issue-260.pdf")),
  );
  doc.addPagesOf(external);
};
