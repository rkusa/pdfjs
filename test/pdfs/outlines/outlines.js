module.exports = function(doc, {image, lorem}) {  
  // Initialise the document with destination samples
  doc.pageBreak()
  doc.text('Text', { destination: 'Text' })
  doc.pageBreak()
  doc.destination('Doc')
  doc.pageBreak()
  doc.image(image.jpeg, {
    destination: 'Image'
  })
  
  doc.outline('1. An outline', 'Text')  
  
  // Outlines can be set to any kind of destinations
  doc.outline('2. Works with any kind of dest', 'Doc')  
  doc.outline('2.1. Image', 'Image', '2. Works with any kind of dest')
  doc.outline('2.2. Text', 'Text', '2. Works with any kind of dest')
  doc.outline('2.3. Doc', 'Doc', '2. Works with any kind of dest')
  
  // Outlines can be deeply nested
  doc.outline('3. Can be deeply nested', 'Text')
  doc.outline('3.1 Level 1', 'Image', '3. Can be deeply nested')
  doc.outline('3.1.1 Level 2', 'Text', '3.1 Level 1')

  // An outline with an unknown or empty destination is added to the outlines but is not reactive
  doc.outline('4. Empty/Unknown destinations', '')
  doc.outline('4.1. Can have children', 'Unknown', '4. Empty/Unknown destinations')
  doc.outline('4.2. But are not reactive', 'Unknown', '4. Empty/Unknown destinations')

  // If an outline is defined with a parent that has not already been declared, then the parent is added to the root with the same destination before the child outline is added
  doc.outline('5.1. Can have children', 'Image', '5. Undeclared parents')
  
  // An outline with an empty or undefined parent is attached to the root
  doc.outline('6. An outline with an undefined parent is added to the root', 'Text')
  doc.outline('7. So is an outline with an empty parent', 'Doc', '')

  // An outline with undefined title and/or destination is skipped
  doc.outline()
  doc.outline('')
  doc.outline('Is not added to the outlines')
  doc.outline(undefined, 'somewhere')
}
