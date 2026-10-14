import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.transaction.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        personName: personName || null,
        paymentMode: paymentMode || "CASH",
        slipNumber: slipNumber || null,
        receiptImage: receiptImage || null,
        date: date ? new Date(date) : undefined,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
