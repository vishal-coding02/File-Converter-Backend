const express = require("express");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const convertToPdf = require("docx-pdf");
const PDFDocument = require("pdfkit");
const app = express();

app.use(cors());
app.use("/convert", express.static("convert"));
app.use("/newPdf", express.static("newpdf"));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  next();
});

function deleteFiles(inp, out) {
  fs.unlink(inp, (err) => {
    if (err) {
      console.log("Error deleting input file:", err.message);
    } else {
      console.log("Input file deleted");
    }
  });

  fs.unlink(out, (err) => {
    if (err) {
      console.log("Error deleting output file:", err.message);
    } else {
      console.log("Output file deleted");
    }
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "convert");
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const convert = multer({ storage: storage });

app.post("/newPdf", convert.single("image"), (req, res) => {
  const text = JSON.parse(req.body.text);

  if (!text.textContent) {
    return res.status(400).json({ error: "No content provided" });
  }
  const imagePath = req.file?.path;
  const outputPath = `newpdf/generated_${Date.now()}.pdf`;

  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(outputPath);

  doc.pipe(writeStream);
  if (imagePath) {
    doc.image(imagePath, {
      fit: [500, 400],
      align: "center",
      valign: "center",
    });
  }

  doc.font(text.textFont);
  doc.text(text.textContent, { align: text.textAlign });
  doc.end();
  res.json({ filePath: `/${outputPath}` });
  console.log("Newpdf created...");
});

app.post("/convert", convert.single("files"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("File not found.");
  }
  console.log(req.file);
  const inputPath = req.file.path;
  console.log(inputPath);
  const targetFormat = req.body.convertFileType;
  console.log(targetFormat);
  const outputPath = `convert/output.${targetFormat}`;
  console.log(outputPath);
  const ext = req.file.originalname.split(".").pop().toLowerCase();

  if (targetFormat === "pdf" && ext == "docx") {
    convertToPdf(inputPath, outputPath, function (err) {
      if (err) {
        console.error("PDF Conversion Error:", err);
        return res.status(500).send("PDF conversion failed");
      } else {
        console.log("PDF Conversion done:", outputPath);
        res.json({ filePath: `/${outputPath}` });
        setTimeout(() => {
          deleteFiles(inputPath, outputPath);
        }, 10000);
      }
    });
  } else if (
    targetFormat === "pdf" &&
    ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
  ) {
    const doc = new PDFDocument({ size: req.body.pdfFileSize });
    doc.pipe(fs.createWriteStream(outputPath));
    doc.image(inputPath, {
      fit: [500, 400],
      align: "center",
      valign: "center",
    });
    doc.end();
    res.json({ filePath: `/${outputPath}` });
    setTimeout(() => deleteFiles(inputPath, outputPath), 10000);
  } else if (
    ["jpg", "webp", "png", "gif", "avif", , "jpeg"].includes(targetFormat)
  ) {
    let imgWidth = 400;
    let jpgImgQuality = 50;
    let pngImgQuality = 5;
    if (req.body.compress == "low") {
      imgWidth = 300;
      jpgImgQuality = 25;
      pngImgQuality = 3;
    } else if (req.body.compress == "medium") {
      imgWidth = 600;
      jpgImgQuality = 50;
      pngImgQuality = 6;
    } else if (req.body.compress == "high") {
      imgWidth = 1000;
      jpgImgQuality = 100;
      pngImgQuality = 9;
    }
    let transformer = sharp(inputPath).resize({ width: imgWidth });

    if (targetFormat === "jpeg" || targetFormat === "jpg") {
      transformer = transformer.jpeg({ quality: jpgImgQuality });
    } else if (targetFormat === "png") {
      transformer = transformer.png({ quality: pngImgQuality });
    }

    transformer.toFormat(targetFormat).toFile(outputPath, (err) => {
      if (err) return res.status(500).send("Conversion failed");
      res.json({ filePath: `/${outputPath}` });
      setTimeout(() => {
        deleteFiles(inputPath, outputPath);
      }, 10000);
    });
  }
});

app.listen(6100, () => {
  console.log("Server Started...");
});

module.exports = { app };
