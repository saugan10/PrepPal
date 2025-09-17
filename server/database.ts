import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
  console.log("MongoDB URI from env:", uri ? "URI found" : "URI not found");
  console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
  return uri;
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = getMongoUri();

  if (!MONGODB_URI) {
    throw new Error("Database connection failed. Please ensure MONGODB_URI is set correctly.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB");
      return mongooseInstance;
    }).catch(err => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection failed:", e);
    throw new Error("Database connection failed. Please ensure MONGODB_URI is set correctly.");
  }

  return cached.conn;
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return !!uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));
}

declare global {
  var mongoose: {
    conn: typeof import("mongoose") | null;
    promise: Promise<typeof import("mongoose")> | null;
  };
}