import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "ALL", "INCOME", "EXPENSE"
    const category = searchParams.get("category");
    const query = searchParams.get("query");

    const where: any = {};

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (query) {
      where.OR = [
        { description: { contains: query } },
        { personName: { contains: query } },
        { slipNumber: { contains: query } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST create transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      category,
      amount,
      description,
      personName,
      paymentMode,
      slipNumber,
      receiptImage,
      date,
    } = body;

    if (!type || !category || !amount || !description) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const newTx = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        personName: personName || null,
        paymentMode: paymentMode || "CASH",
        slipNumber: slipNumber || null,
        receiptImage: receiptImage || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(newTx, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
