const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

const dir = path.join(__dirname, 'src', 'scripts', 'fixtures');
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'corrupted.pdf'), 'not a pdf');
fs.writeFileSync(path.join(dir, 'corrupted.docx'), 'not a docx zip');

const pdfContent = '%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n4 0 obj <</Length 44>> stream\nBT /F1 24 Tf 100 700 Td (Hello World) Tj ET\nendstream endobj\n5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000227 00000 n \n0000000322 00000 n \ntrailer <</Size 6 /Root 1 0 R>>\nstartxref\n393\n%%EOF\n';
fs.writeFileSync(path.join(dir, 'valid-summary.pdf'), Buffer.from(pdfContent));

const zip = new JSZip();
zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.folder('word').file('document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello DOCX</w:t></w:r></w:p></w:body></w:document>');

zip.generateAsync({type:'nodebuffer'}).then(content => {
  fs.writeFileSync(path.join(dir, 'valid-summary.docx'), content);
  console.log('Fixtures generated');
});
