const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Provision only the first platform owner; subsequent account creation belongs in audited manager workflows.
async function main() {
  const email = process.env.BOOTSTRAP_SUPER_MANAGER_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_SUPER_MANAGER_NAME?.trim();
  const password = process.env.BOOTSTRAP_SUPER_MANAGER_PASSWORD;
  if (!email || !name || !password || password.length < 16) {
    throw new Error('Set BOOTSTRAP_SUPER_MANAGER_EMAIL, BOOTSTRAP_SUPER_MANAGER_NAME, and a password of at least 16 characters.');
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.user.count({ where: { role: 'SUPER_MANAGER' } });
      const existingEmail = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existingOwner > 0) throw new Error('A Super Manager already exists; bootstrap cannot create another one.');
      if (existingEmail) throw new Error('That email already belongs to an account; bootstrap did not change it.');

      await tx.user.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          role: 'SUPER_MANAGER',
          isActive: true,
        },
      });
    }, { isolationLevel: 'Serializable' });
    process.stdout.write('Initial Super Manager created. Store the credentials in your password manager and remove them from the shell environment.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Bootstrap failed.'}\n`);
  process.exitCode = 1;
});
