const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ===== DB =====
mongoose.connect("mongodb://127.0.0.1:27017/makeup")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ===== STATIC =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MODELS =====
const Portfolio = mongoose.model("Portfolio", {
  image: String,
});

const Service = mongoose.model("Service", {
  name: String,
  price: String,
  description: String,
});

const Booking = mongoose.model("Booking", {
  name: String,
  phone: String,
  service: String,
  date: String,
  time: String,     // ✅ NEW
  city: String,     // ✅ NEW
  createdAt: { type: Date, default: Date.now }
});

// ===== MULTER =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===== ROUTES =====
app.get("/", (req, res) => res.send("API Working"));

// ---- Portfolio ----
app.post("/api/upload", upload.single("image"), async (req, res) => {
  const img = new Portfolio({ image: req.file.filename });
  await img.save();
  res.json(img);
});

app.get("/api/portfolio", async (req, res) => {
  const data = await Portfolio.find().sort({ _id: -1 });
  res.json(data);
});

app.delete("/api/portfolio/:id", async (req, res) => {
  const item = await Portfolio.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });

  const filePath = path.join(__dirname, "uploads", item.image);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await item.deleteOne();
  res.json({ success: true });
});

// ---- Services ----
app.get("/api/services", async (req, res) => {
  const data = await Service.find().sort({ _id: -1 });
  res.json(data);
});

app.post("/api/services", async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.json(service);
});

app.put("/api/services/:id", async (req, res) => {
  const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/services/:id", async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ---- Bookings ----
app.post("/api/bookings", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Booking failed" });
  }
});

app.get("/api/bookings", async (req, res) => {
  const data = await Booking.find().sort({ _id: -1 });
  res.json(data);
});

// ===== START =====
app.listen(5000, () => console.log("Server running on http://localhost:5000"));