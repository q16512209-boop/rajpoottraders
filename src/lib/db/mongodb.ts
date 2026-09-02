import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb+srv://q16512209_db_user:taekwondoboy321@cluster0.uwu4cgq.mongodb.net/rajpoot_traders_db?retryWrites=true&w=majority&appName=Cluster0";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      tlsAllowInvalidCertificates: true, // Safe fallback for Windows TLS interceptors
    });
    global._mongoClientPromise = client.connect();
    return global._mongoClientPromise;
  } catch (err) {
    console.warn("MongoDB initialization warning:", err);
    return Promise.reject(err);
  }
}

export async function getDatabase(dbName: string = "rajpoot_traders_db"): Promise<Db> {
  const cPromise = getMongoClientPromise();
  const c = await cPromise;
  return c.db(dbName);
}

export async function checkMongoConnection(): Promise<{ connected: boolean; pingTimeMs: number; error?: string }> {
  const start = Date.now();
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return { connected: true, pingTimeMs: Date.now() - start };
  } catch (err: any) {
    return { connected: false, pingTimeMs: Date.now() - start, error: err.message || "Connection timeout or TLS validation" };
  }
}

export default getMongoClientPromise;