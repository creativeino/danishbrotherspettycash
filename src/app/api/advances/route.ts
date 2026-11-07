import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookie } from "@/lib/auth";

// GET all staff advances
export async function GET() {
  try {
    const advances = await prisma.staffAdvance.findMany({
      orderBy: { dateGiven: "desc" },
    });
    return NextResponse.json(advances);
  } catch (error) {
    console.error("Failed to fetch advances:", error);
    return NextResponse.json({ error: "Failed to fetch advances" }, { status: 500 });
  }
}

// POST create a new staff advance
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staffName, amountGiven, purpose, notes } = body;

    if (!staffName || !amountGiven || !purpose) {
      return NextResponse.json(
        { error: "Staff name, amount, and purpose are required" },
        { status: 400 }
      );
    }

    const session = getSessionUserFromCookie(request.headers.get("cookie"));
    const amountNum = parseFloat(amountGiven);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Staff Advance record
      const advance = await tx.staffAdvance.create({
        data: {
          staffName,
          amountGiven: amountNum,
          amountSettled: 0,
          remainingBalance: amountNum,
          purpose,
          status: "PENDING",
          createdBy: session ? session.name : "Admin",
          notes: notes || null,
        },
      });

      // 2. Also log an Expense entry in Petty Cash Drawer for accountability
      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          category: "Staff & Tech Advance",
          amount: amountNum,
          description: `Advance cash given to ${staffName} for ${purpose}`,
          personName: staffName,
          paymentMode: "CASH",
          date: new Date(),
          createdBy: session ? session.username : "danish",
          createdByName: session ? session.name : "Danish",
          createdRole: session ? session.role : "ADMIN",
        },
      });

      return advance;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create advance:", error);
    return NextResponse.json({ error: "Failed to issue advance" }, { status: 500 });
  }
}

// PUT settle an existing advance (partial or full)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, settleAmount, billDescription, cashReturned } = body;

    if (!id || (!settleAmount && !cashReturned)) {
      return NextResponse.json({ error: "Invalid settlement parameters" }, { status: 400 });
    }

    const advance = await prisma.staffAdvance.findUnique({ where: { id } });
    if (!advance) {
      return NextResponse.json({ error: "Advance record not found" }, { status: 404 });
    }

    const session = getSessionUserFromCookie(request.headers.get("cookie"));
    const billNum = parseFloat(settleAmount || 0);
    const returnNum = parseFloat(cashReturned || 0);
    const totalSettlingNow = billNum + returnNum;

    const newAmountSettled = advance.amountSettled + totalSettlingNow;
    const newRemaining = Math.max(0, advance.amountGiven - newAmountSettled);
    const newStatus = newRemaining === 0 ? "SETTLED" : "PARTIAL";

    const updated = await prisma.$transaction(async (tx) => {
      const adv = await tx.staffAdvance.update({
        where: { id },
        data: {
          amountSettled: newAmountSettled,
          remainingBalance: newRemaining,
          status: newStatus,
          settledAt: newStatus === "SETTLED" ? new Date() : undefined,
        },
      });

      // If cash is returned back to the drawer, log Income to increase cashInHand
      if (returnNum > 0) {
        await tx.transaction.create({
          data: {
            type: "INCOME",
            category: "Advance Cash Return",
            amount: returnNum,
            description: `Remaining cash returned by ${advance.staffName} from advance #${advance.id.slice(-6)}`,
            personName: advance.staffName,
            paymentMode: "CASH",
            date: new Date(),
            createdBy: session ? session.username : "danish",
            createdByName: session ? session.name : "Danish",
            createdRole: session ? session.role : "ADMIN",
          },
        });
      }

      return adv;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to settle advance:", error);
    return NextResponse.json({ error: "Failed to settle advance" }, { status: 500 });
  }
}
