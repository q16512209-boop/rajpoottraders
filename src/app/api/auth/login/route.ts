import { NextRequest, NextResponse } from "next/server";
import { connectMongoose, UserModel } from "@/models";
import { store } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email aur Password dono darkar hain." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Try Live MongoDB Authentication
    try {
      await connectMongoose();
      const dbUser = await UserModel.findOne({
        email: cleanEmail,
        status: "ACTIVE",
      }).lean();

      if (dbUser) {
        // Direct password match check
        const isMatch = (dbUser as any).password === cleanPass;
        if (isMatch) {
          const userObj = {
            id: (dbUser as any).id || (dbUser as any)._id.toString(),
            tenantId: (dbUser as any).tenantId,
            businessId: (dbUser as any).businessId || (dbUser as any).tenantId,
            name: (dbUser as any).name,
            email: (dbUser as any).email,
            role: (dbUser as any).role,
            phone: (dbUser as any).phone,
            avatar: (dbUser as any).avatar,
            assignedRouteZone: (dbUser as any).assignedRouteZone,
            status: (dbUser as any).status,
            createdAt: (dbUser as any).createdAt,
          };
          return NextResponse.json({
            success: true,
            user: userObj,
            source: "MONGODB_LIVE",
          });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB auth connection fallback to store:", dbErr);
    }

    // 2. Fallback to Store Authentication
    const localUser = store.authenticate(cleanEmail, cleanPass);
    if (localUser) {
      const { password: _, ...safeUser } = localUser;
      return NextResponse.json({
        success: true,
        user: safeUser,
        source: "STORE_LOCAL",
      });
    }

    return NextResponse.json(
      { success: false, error: "Ghalat email ya password. Bara-e-meherbani sahi maloomat darj karein." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error during login." },
      { status: 500 }
    );
  }
}
