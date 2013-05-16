# pdfjs
A Portable Document Format (PDF) generation library targeting both the server- and client-side.

```json
{
  "name": "pdfjs",
  "version": "0.1.0"
}
```

**Status:** Lacks many essential features yet

### Contents
1. [API](#api)
2. [License](#license)

## API

### Document

**Properties:**

* **width** - 
* **height** - 
* **innerWidth** - 
* **innerHeight** - 
* **padding** - 

#### .addPage()

#### .font(name)

**Arguments:**

* **name** - 

#### .toDataURL()

#### .toString()

### Page

**Properties:**

* **cursor** - 

#### .beginText()

#### .moveTextCursor(x, y)

**Arguments:**

* **x** - 
* **y** - 

#### .setFont(font, size)

**Arguments:**

* **font** - 
* **size** - 

#### .showText(text)

**Arguments:**

* **text** - 

#### .setWordSpacing(wordSpacing)

**Arguments:**

* **wordSpacing** - 

#### .endText()

#### .setStrokeRGBColor(r, g, b)

**Arguments:**

* **r** - 
* **g** - 
* **b** - 

#### .setLineWidth(width)

**Arguments:**

* **width** - 

#### .stroke(from, to)

**Arguments:**

* **from** - 
* **to** - 

#### .text(text[, x, y][, options])

**Arguments:**

* **text** - 
* **x** - 
* **y** - 
* **options** - 

**Options:**

* **width** - 
* **font** - 
* **size** - 
* **align** - 
* **text** - 
* **text** - 

#### .table(x, y, options, definition)

**Arguments:**

* **x** - 
* **y** - 
* **options** - 
* **definition** - 

**Options:**

* **font** - 
* **size** - 
* **width** - 
* **padding** - 
* **borderWidth** - 

#### .tr(options, definition)

**Arguments:**

* **options** - 
* **definition** - 

**Options:**

* **font** - 
* **size** - 
* **width** - 
* **padding** - 
* **borderWidth** - 
* **header** - 

#### .td(text, options)

**Arguments:**

* **text** - 
* **options** - 

**Options:**

* **font** - 
* **size** - 
* **width** - 
* **padding** - 
* **borderWidth** - 
* **colSpan** - 

#### .addFont(font)

**Arguments:**

* **font** - 

#### .break()

## MIT License
Copyright (c) 2013 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.