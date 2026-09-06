import { MongoClient, Db } from "mongodb";

const LIVE_URI = "mongodb+srv://rajpoot_admin:Rajpoot12345@cluster0.uwu4cgq.mongodb.net/rajpoot_traders_db?retryWrites=true&w=majority";

let customUri: string | null = null;

export function getMongoUri(): string {
  if (customUri) return customUri;
  const envUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  // If env variable is missing or contains the outdated broken username, use verified LIVE_URI
  if (!envUri || envUri.includes("q16512209")) {
    return LIVE_URI;
  }
  return envUri;
}

export function setCustomMongoUri(uri: string) {
  customUri = uri;
  global._mongoClientPromise = undefined;
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = getMongoUri();

  if (global._mongoClientPromise && !customUri) {
    return global._mongoClientPromise;
  }

  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      tlsAllowInvalidCertificates: true,
    });
    const promise = client.connect();
    global._mongoClientPromise = promise;
    return promise;
  } catch (err) {
    console.warn("MongoDB client initialization error:", err);
    return Promise.reject(err);
  }
}

export async function getDatabase(dbName: string = "rajpoot_traders_db"): Promise<Db> {
  const cPromise = getMongoClientPromise();
  const c = await cPromise;
  return c.db(dbName);
}

export async function checkMongoConnection(): Promise<{
  connected: boolean;
  pingTimeMs: number;
  uriMasked: string;
  database: string;
  collections?: { name: string; count: number }[];
  error?: string;
}> {
  const start = Date.now();
  const rawUri = getMongoUri();
  const uriMasked = rawUri.replace(/:([^:@]+)@/, ":****@");

  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const cols = await db.listCollections().toArray();
    const collectionStats: { name: string; count: number }[] = [];

    for (const col of cols) {
      const count = await db.collection(col.name).countDocuments();
      collectionStats.push({ name: col.name, count });
    }

    return {
      connected: true,
      pingTimeMs: Date.now() - start,
      uriMasked,
      database: db.databaseName,
      collections: collectionStats,
    };
  } catch (err: any) {
    return {
      connected: false,
      pingTimeMs: Date.now() - start,
      uriMasked,
      database: "rajpoot_traders_db",
      error: err.message || "Connection failed or authentication error",
    };
  }
}

export default getMongoClientPromise;
