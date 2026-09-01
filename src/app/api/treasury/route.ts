import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";

export async function GET() {
  const wallets = store.getWallets();
  const expenses = store.getExpenses();
  return NextResponse.json({ wallets, expenses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "TRANSFER") {
      const res = store.transferBetweenWallets({
        fromWalletId: body.fromWalletId,
        toWalletId: body.toWalletId,
        amount: Number(body.amount),
        actorId: body.actorId || "api_user",
        notes: body.notes || "API Transfer",
      });
      return NextResponse.json({ success: true, ...res });
    }

    if (body.action === "EXPENSE") {
      const exp = store.recordExpense({
        tenantId: body.tenantId,
        category: body.category,
        amount: Number(body.amount),
        fromWalletId: body.fromWalletId,
        description: body.description,
        loggedBy: body.loggedBy || "api_user",
      });
      return NextResponse.json({ success: true, expense: exp });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}