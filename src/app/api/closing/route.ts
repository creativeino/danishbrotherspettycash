import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET latest day closing or closing history
export async function GET() {
  try {
    const closings = await prisma.dayClosing.findMany({
      orderBy: { date: "desc" },
      take: 10,
    });
    return NextResponse.json(closings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch closings" }, { status: 500 });
  }
}

// POST reconcile & close day
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { closingDateStr, calculatedCash, cashWithdrawn, cashRetained, closedBy, notes } = body;

    const closingRecord = await prisma.$transaction(async (tx) => {
      // 1. Save Day Closing Record
      const closing = await tx.dayClosing.upsert({
        where: { closingDateStr },
        update: {
          calculatedCash: parseFloat(calculatedCash),
          cashWithdrawn: parseFloat(cashWithdrawn || 0),
          cashRetained: parseFloat(cashRetained || 0),
          closedBy: closedBy || "Admin",
          notes: notes || null,
        },
        create: {
          closingDateStr,
          calculatedCash: parseFloat(calculatedCash),
          cashWithdrawn: parseFloat(cashWithdrawn || 0),
          cashRetained: parseFloat(cashRetained || 0),
          closedBy: closedBy || "Admin",
          notes: notes || null,
        },
      });

      // 2. If cash was withdrawn by owner, log an Expense entry in ledger for transparency
      if (parseFloat(cashWithdrawn) > 0) {
        await tx.transaction.create({
          data: {
            type: "EXPENSE",
            category: "Owner Cash Withdrawal (Profit / Safe Transfer)",
            amount: parseFloat(cashWithdrawn),
            description: `Cash taken out from drawer at day closing [${closingDateStr}] by ${closedBy || "Owner"}`,
            personName: closedBy || "Owner",
            paymentMode: "CASH",
            date: new Date(),
          },
        });
      }

      // 3. Create Next Day Opening Balance with cashRetained
      if (parseFloat(cashRetained) > 0) {
        // Calculate tomorrow's date
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(9, 0, 0, 0); // 9:00 AM opening

        const tomorrowDateStr = nextDay.toISOString().split("T")[0];

        // Check if opening already logged for next day
        const existingOpening = await tx.transaction.findFirst({
          where: {
            category: "Opening Cash Balance",
            date: {
              gte: new Date(`${tomorrowDateStr}T00:00:00.000Z`),
              lte: new Date(`${tomorrowDateStr}T23:59:59.999Z`),
            },
          },
        });

        if (!existingOpening) {
          await tx.transaction.create({
            data: {
              type: "INCOME",
              category: "Opening Cash Balance",
              amount: parseFloat(cashRetained),
              description: `Auto carried forward from previous day [${closingDateStr}] closing`,
              personName: closedBy || "System Auto",
              paymentMode: "CASH",
              date: nextDay,
            },
          });
        }
      }

      return closing;
    });

    return NextResponse.json({ success: true, closing: closingRecord });
  } catch (error) {
    console.error("Closing failed:", error);
    return NextResponse.json({ error: "Failed to process closing" }, { status: 500 });
  }
}
