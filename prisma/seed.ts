import { PrismaClient, Role, UserStatus, RecordType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 8);

  // ✅ Upsert users (no duplicates, no deletion)
  const admin = await prisma.user.upsert({
    where: { email: "admin@finance.com" },
    update: {},
    create: {
      email: "admin@finance.com",
      password: passwordHash,
      name: "Admin User",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@finance.com" },
    update: {},
    create: {
      email: "analyst@finance.com",
      password: passwordHash,
      name: "Analyst User",
      role: Role.ANALYST,
      status: UserStatus.ACTIVE,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@finance.com" },
    update: {},
    create: {
      email: "viewer@finance.com",
      password: passwordHash,
      name: "Viewer User",
      role: Role.VIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  // ✅ Only create records if none exist
  const existingRecords = await prisma.financialRecord.count();

  if (existingRecords === 0) {
    const categories = {
      income: ["Salary", "Freelance", "Investments", "Rental Income"],
      expense: ["Food", "Rent", "Utilities", "Transport", "Entertainment", "Healthcare"],
    };

    const records = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() > 0.4;
      const type = isIncome ? RecordType.INCOME : RecordType.EXPENSE;
      const cats = isIncome ? categories.income : categories.expense;
      const category = cats[Math.floor(Math.random() * cats.length)];

      const amount = isIncome
        ? (Math.random() * 5000 + 500).toFixed(2)
        : (Math.random() * 1000 + 50).toFixed(2);

      const daysAgo = Math.floor(Math.random() * 180);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);

      records.push({
        amount: parseFloat(amount),
        type,
        category,
        date,
        description: `${type === RecordType.INCOME ? "Income" : "Expense"} - ${category} entry`,
        createdById: admin.id,
      });
    }

    await prisma.financialRecord.createMany({ data: records });

    console.log(`  - ${records.length} financial records created`);
  } else {
    console.log("  - Financial records already exist, skipping...");
  }

  console.log("Seed completed safely ✅");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
