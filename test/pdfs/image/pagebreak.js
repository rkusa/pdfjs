module.exports = function (doc, { image, lorem }) {
  doc.cell("a cell to move the image down", { paddingTop: 770 });
  doc.image(image.jpeg);
  doc.text("after image");
};
