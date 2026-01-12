const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuration du stockage (Dossier 'uploads' à la racine)
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        // On renomme le fichier pour éviter les doublons (ex: image-123456789.jpg)
        cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
});

// Filtre (Accepter seulement les images)
const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Erreur : Images seulement !');
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limite à 1MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image'); // 'image' est le nom du champ dans le formulaire

// Route d'upload
router.post('/', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ message: err });
        } else {
            if (req.file == undefined) {
                res.status(400).json({ message: 'Aucun fichier sélectionné.' });
            } else {
                // On renvoie l'URL du fichier pour le stocker en BDD ensuite
                res.json({
                    message: 'Fichier uploadé !',
                    filePath: `/uploads/${req.file.filename}`
                });
            }
        }
    });
});

module.exports = router;