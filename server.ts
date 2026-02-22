import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("app.db");

// Lazy Twilio initialization with validation
let twilioClient: any = null;
function getTwilio() {
  if (twilioClient) return twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  
  if (sid && token) {
    if (!sid.startsWith('AC')) {
      console.warn("TWILIO_ACCOUNT_SID is invalid (must start with 'AC'). Falling back to simulation.");
      return null;
    }
    try {
      twilioClient = twilio(sid, token);
      return twilioClient;
    } catch (err) {
      console.error("Twilio Init Error:", err);
      return null;
    }
  }
  return null;
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    name TEXT,
    roll_number TEXT UNIQUE,
    otp TEXT,
    otp_expiry INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_data (
    roll_number TEXT PRIMARY KEY,
    exams_json TEXT DEFAULT '[]',
    progress_json TEXT DEFAULT '[]',
    FOREIGN KEY(roll_number) REFERENCES users(roll_number)
  );
`);

// Migration: Add name column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT;");
} catch (e) {
  // Column already exists or table doesn't exist yet (handled by CREATE TABLE)
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Auth Endpoints
  app.post("/api/auth/request-otp", async (req, res, next) => {
    try {
      const { phone, name } = req.body;
      if (!phone || !/^(\+8801|01)[3-9]\d{8}$/.test(phone)) {
        return res.status(400).json({ error: "Invalid Bangladeshi phone number" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 5 * 60 * 1000; // 5 mins

      const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;
      
      if (user) {
        db.prepare("UPDATE users SET otp = ?, otp_expiry = ?, name = ? WHERE phone = ?").run(otp, expiry, name || user.name, phone);
      } else {
        db.prepare("INSERT INTO users (phone, otp, otp_expiry, name) VALUES (?, ?, ?, ?)").run(phone, otp, expiry, name || "User");
      }

      // Real SMS Sending
      const client = getTwilio();
      const from = process.env.TWILIO_PHONE_NUMBER;
      
      if (client && from) {
        try {
          // Ensure phone is in E.164 format for Twilio
          const formattedPhone = phone.startsWith('+') ? phone : `+88${phone.startsWith('0') ? phone : '0' + phone}`;
          
          await client.messages.create({
            body: `Your GST Fighter verification code is: ${otp}. Valid for 5 minutes.`,
            from: from,
            to: formattedPhone
          });
          console.log(`[SMS Sent] To ${formattedPhone}`);
          return res.json({ message: "Verification code sent to your phone." });
        } catch (err: any) {
          console.error("Twilio Error:", err);
          return res.status(500).json({ error: "Failed to send SMS. Please try again later." });
        }
      } else {
        // Fallback for development if keys are missing
        console.log(`[SMS Simulation] To ${phone}: Your verification code is ${otp}`);
        return res.json({ 
          message: "OTP sent successfully (Simulated)", 
          otp: process.env.NODE_ENV === 'production' ? undefined : otp 
        });
      }
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { phone, otp } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any;

    if (!user || user.otp !== otp || Date.now() > user.otp_expiry) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    let rollNumber = user.roll_number;
    if (!rollNumber) {
      rollNumber = "GST-" + Math.floor(100000 + Math.random() * 899999).toString();
      db.prepare("UPDATE users SET roll_number = ?, otp = NULL, otp_expiry = NULL WHERE phone = ?").run(rollNumber, phone);
      db.prepare("INSERT OR IGNORE INTO user_data (roll_number) VALUES (?)").run(rollNumber);
    } else {
      db.prepare("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE phone = ?").run(phone);
    }

    res.json({ rollNumber });
  });

  app.post("/api/auth/login", (req, res) => {
    const { rollNumber } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE roll_number = ?").get(rollNumber) as any;

    if (!user) {
      return res.status(404).json({ error: "Roll number not found" });
    }

    res.json({ rollNumber, phone: user.phone, name: user.name });
  });

  // Data Endpoints
  app.get("/api/user/data/:rollNumber", (req, res) => {
    const { rollNumber } = req.params;
    const data = db.prepare("SELECT * FROM user_data WHERE roll_number = ?").get(rollNumber) as any;

    if (!data) {
      return res.status(404).json({ error: "User data not found" });
    }

    res.json({
      exams: JSON.parse(data.exams_json),
      progress: JSON.parse(data.progress_json)
    });
  });

  app.post("/api/user/data/:rollNumber", (req, res) => {
    const { rollNumber } = req.params;
    const { exams, progress } = req.body;

    db.prepare("UPDATE user_data SET exams_json = ?, progress_json = ? WHERE roll_number = ?")
      .run(JSON.stringify(exams), JSON.stringify(progress), rollNumber);

    res.json({ success: true });
  });

  // Catch-all for unknown API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler (JSON)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected error occurred",
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
