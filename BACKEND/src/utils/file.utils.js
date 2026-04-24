const fs = require("fs/promises");

const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log("Fichier supprimé :", filePath);
  } catch (err) {
    console.error("Erreur suppression fichier :", err);
  }
};


module.exports = { deleteFile };
