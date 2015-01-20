module.exports = function(doc, fixtures) {
  var text = doc.createText({ textAlign: 'justify' })
  text.add('абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ\n\n')
  text.add('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\n\n')
}
