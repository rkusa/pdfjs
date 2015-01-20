JavaScript files inside the [`./pdfs`](pdfs) directory are picked up automatically and their result is compared to their *.pdf* counterparts.

There will be false negatives.

Ideas for a better PDF testing setup are welcome.

Additional PDF validation could be done using [preflight](https://pdfbox.apache.org/download.cgi):

```bash
java -classpath ./preflight-app-1.8.6.jar org.apache.pdfbox.preflight.Validator_A1b ./test.pdf
```

