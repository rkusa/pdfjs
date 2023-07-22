module.exports = function (doc, { document, lorem }) {
  doc.setTemplate(document.test, true);

  doc.text(
    "1st page after setTemplate(document.test, true): TEMPLATE VISIBLE",
    { fontSize: 18 },
  );

  doc.pageBreak();

  doc.text("2nd page after setTemplate(document.test, true): NO TEMPLATE", {
    fontSize: 18,
  });

  doc.setTemplate(document.test, true);

  doc.text(
    "1st page after setTemplate(document.test, true): TEMPLATE VISIBLE AGAIN",
    { fontSize: 18 },
  );

  doc.pageBreak();

  doc.text("2nd page after setTemplate(document.test, true): NO TEMPLATE", {
    fontSize: 18,
  });

  doc.setTemplate(document.test, false);

  doc.text(
    "1st page after setTemplate(document.test, false): TEMPLATE VISIBLE",
    { fontSize: 18 },
  );

  doc.pageBreak();

  doc.text(
    "2nd page after setTemplate(document.test, false): TEMPLATE VISIBLE",
    { fontSize: 18 },
  );
};
