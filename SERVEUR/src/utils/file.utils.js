import fs from "fs/promises";

export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log("🗑️ Fichier supprimé :", filePath);
  } catch (err) {
    console.error("❌ Erreur suppression fichier :", err);
  }
};
