const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = 3000;

// Create necessary folders
["uploads", "processed"].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Multer setup
const upload = multer({ dest: "uploads/" });

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/process", upload.single("file"), (req, res) => {
    const { mode } = req.body; // key is not used in demo1.exe
    const inputPath = req.file.path;
    const originalName = req.file.originalname;

    const outputName = (mode === "encrypt" ? "encrypted_" : "decrypted_") + originalName;
    const outputPath = path.join("processed", outputName);

    // Run RSA program
    execFile(path.join(__dirname, "demo1.exe"), [mode, inputPath, outputPath], (err) => {
        if (err) {
            console.error("ExecFile error:", err);
            // Clean up uploaded file
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            return res.status(500).send("Processing failed");
        }

        // Ensure input file is deleted
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
            return res.status(500).send("Output file not created");
        }

        // Send file to browser
        res.download(outputPath, outputName, (err) => {
            if (err) console.error("Download error:", err);

            // Delete processed file after sending
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));