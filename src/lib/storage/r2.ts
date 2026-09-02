import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "939f06e4189f20017cac78ec179aae63";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "42813d61b6484a1d9ddf9fb7990182d2";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "51405949664e696d2057a3d91da0a743491cb0236fcc4ebddac88bc6159af870";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "rajpoot-backups-secure";
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}): Promise<{ success: boolean; key: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      Body: typeof params.body === "string" ? Buffer.from(params.body) : params.body,
      ContentType: params.contentType || "application/octet-stream",
    });
    await r2Client.send(command);
    return { success: true, key: params.key };
  } catch (err: any) {
    return { success: false, key: params.key, error: err.message };
  }
}

export async function testR2Connection(): Promise<{ connected: boolean; bucket: string; error?: string }> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    });
    await r2Client.send(command);
    return { connected: true, bucket: bucketName };
  } catch (err: any) {
    return { connected: false, bucket: bucketName, error: err.message };
  }
}