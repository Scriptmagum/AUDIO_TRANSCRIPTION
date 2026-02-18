import PDFDocument from "pdfkit";
import fs from "fs";

export const generatePdf = (outputPath, title, content) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Titre
      doc
        .fontSize(22)
        .text(title, { align: "center" })
        .moveDown(2);

      // Contenu
      doc
        .fontSize(11)
        .text(content, {
          align: "left",
          lineGap: 6
        });

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
