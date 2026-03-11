import PDFDocument from "pdfkit";
import fs from "fs";

/**
 * Parse le contenu markdown et le formate pour le PDF
 */
const parseMarkdownContent = (content) => {
  const lines = content.split("\n");
  const parsed = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    // Sections principales (bold)
    if (trimmed.match(/^\*\*[^*]+\*\*$/)) {
      parsed.push({
        type: "section",
        text: trimmed.replace(/\*\*/g, "").replace(/[^\w\s]/g, "")
      });
    }
    // Listes (puces)
    else if (trimmed.startsWith("- ")) {
      parsed.push({
        type: "bullet",
        text: trimmed.substring(2)
      });
    }
    // Lignes vides
    else if (trimmed === "") {
      parsed.push({ type: "space" });
    }
    // Texte normal
    else if (trimmed.length > 0) {
      parsed.push({
        type: "text",
        text: trimmed
      });
    }
  });

  return parsed;
};

export const generatePdf = (outputPath, title, content) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Titre du document
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(title, { align: "center" })
        .fontSize(11)
        .font("Helvetica");

      doc.moveDown(1.5);

      // Parse et rendu du contenu
      const parsed = parseMarkdownContent(content);

      parsed.forEach((item, index) => {
        switch (item.type) {
          case "section":
            doc.moveDown(0.3);
            doc
              .fontSize(12)
              .font("Helvetica-Bold")
              .text(item.text, { align: "left" });
            doc.font("Helvetica");
            doc.moveDown(0.5);
            break;

          case "bullet":
            doc
              .fontSize(10.5)
              .list([item.text], { indent: 15 });
            break;

          case "text":
            doc
              .fontSize(10.5)
              .text(item.text, {
                align: "left",
                lineGap: 4,
                width: 480
              });
            doc.moveDown(0.5);
            break;

          case "space":
            doc.moveDown(0.3);
            break;
        }
      });

      // Pied de page avec date
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(` ${new Date().toLocaleDateString("fr-FR")}`, {
            align: "center",
            y: doc.page.height - 30
          });
      }

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};