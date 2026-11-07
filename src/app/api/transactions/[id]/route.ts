import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookie } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionUserFromCookie(request.headers.get("cookie"));

    // RBAC: Only ADMIN (Danish/Owner) can delete
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: Only Admin (Danish/Owner) can delete transactions." },
        { status: 403 }
      );
    }

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
    const session = getSessionUserFromCookie(request.headers.get("cookie"));

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // RBAC: Operators can only edit transactions they personally created
    if (session.role !== "ADMIN") {
      if (existing.createdBy && existing.createdBy !== session.username) {
        return NextResponse.json(
          { error: "Access Denied: Operators can only edit their own entries." },
          { status: 403 }
        );
      }
    }

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
