module.exports = function (doc, { lorem }) {
  new Array(3).fill(lorem.short).forEach((t, i) => {
    const h = doc.header();
    h.text("Header " + i);
    const f = doc.footer();
    f.text("Footer \n\n\n\n Part #" + i);
    doc.text(t);
  });
};
