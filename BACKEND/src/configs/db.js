const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("DB Error: Missing MONGO_URI or MONGODB_URI environment variable.");
    return;
  }

  const isLocalMongoUri =
    mongoUri.includes("127.0.0.1:27017") ||
    mongoUri.includes("localhost:27017") ||
    mongoUri.includes("::1:27017");

  if ((process.env.RENDER || process.env.NODE_ENV === "production") && isLocalMongoUri) {
    console.error("DB Error: Render cannot connect to a local MongoDB instance. Set MONGO_URI to a cloud database such as MongoDB Atlas.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error.message);
  }
}

module.exports = connectDB;
