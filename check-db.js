import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking calendar connections...");
  const connections = await prisma.calendarConnection.findMany();
  console.log(JSON.stringify(connections, null, 2));

  console.log("\nChecking accounts...");
  const accounts = await prisma.account.findMany({
    where: {
      provider: "google",
    },
  });
  console.log(JSON.stringify(accounts, null, 2));

  console.log("\nChecking if any meetings from external calendars exist...");
  const meetings = await prisma.meeting.findMany({
    where: {
      externalId: {
        not: null,
      },
    },
    take: 5,
  });
  console.log(JSON.stringify(meetings, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
