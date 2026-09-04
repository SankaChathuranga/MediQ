const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Medicines ─────────────────────────────────────────────────────────────
  const paracetamol = await prisma.medicine.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Panadol',
      generic_name: 'Paracetamol',
      category: 'Painkiller',
      description: 'Common painkiller and fever reducer. Available OTC.',
    },
  });

  const amoxicillin = await prisma.medicine.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Amoxil',
      generic_name: 'Amoxicillin',
      category: 'Antibiotic',
      description: 'Broad-spectrum penicillin antibiotic. Requires prescription.',
    },
  });

  const metformin = await prisma.medicine.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Glucophage',
      generic_name: 'Metformin',
      category: 'Antidiabetic',
      description: 'First-line medication for type 2 diabetes.',
    },
  });

  console.log('✓ Medicines seeded:', paracetamol.name, amoxicillin.name, metformin.name);

  // ─── Pharmacies ────────────────────────────────────────────────────────────
  // 6 pharmacies across 5 areas — keeps area filter meaningfully testable
  const pharmacyA = await prisma.pharmacy.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Cargills Health Pharmacy',
      address: '10 Galle Road, Colombo 03',
      area: 'Colombo',
      contact: '+94 11 234 5678',
      hours: 'Mon–Sat 8am–9pm, Sun 9am–6pm',
    },
  });

  const pharmacyB = await prisma.pharmacy.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Osu Sala Kandy',
      address: '45 Peradeniya Road, Kandy',
      area: 'Kandy',
      contact: '+94 81 222 3344',
      hours: 'Mon–Sun 7am–10pm',
    },
  });

  const pharmacyC = await prisma.pharmacy.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Galle Fort Pharmacy',
      address: '23 Church Street, Galle Fort, Galle',
      area: 'Galle',
      contact: '+94 91 222 4455',
      hours: 'Mon–Sat 8am–8pm',
    },
  });

  const pharmacyD = await prisma.pharmacy.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Matara Medical Stores',
      address: '78 Main Street, Matara',
      area: 'Matara',
      contact: '+94 41 222 7788',
      hours: 'Mon–Fri 8am–7pm, Sat 9am–5pm',
    },
  });

  const pharmacyE = await prisma.pharmacy.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'Negombo City Pharmacy',
      address: '12 Colombo Road, Negombo',
      area: 'Negombo',
      contact: '+94 31 222 1122',
      hours: 'Mon–Sun 8am–9pm',
    },
  });

  const pharmacyF = await prisma.pharmacy.upsert({
    where: { id: 6 },
    update: {},
    create: {
      name: 'Jaffna Osu Sala',
      address: '5 Hospital Road, Jaffna',
      area: 'Jaffna',
      contact: '+94 21 222 5566',
      hours: 'Mon–Sat 7:30am–8pm',
    },
  });

  console.log(
    '✓ Pharmacies seeded:',
    pharmacyA.name, pharmacyB.name, pharmacyC.name,
    pharmacyD.name, pharmacyE.name, pharmacyF.name,
  );

  // ─── Stock ─────────────────────────────────────────────────────────────────
  await prisma.stock.upsert({
    where: { id: 1 },
    update: {},
    create: {
      pharmacy_id: pharmacyA.id,
      medicine_id: paracetamol.id,
      quantity: 150,
      price: 25.0,
    },
  });

  await prisma.stock.upsert({
    where: { id: 2 },
    update: {},
    create: {
      pharmacy_id: pharmacyB.id,
      medicine_id: amoxicillin.id,
      quantity: 30,
      price: 180.0,
    },
  });

  console.log('✓ Stock seeded');

  // ─── ADD MORE SEED DATA HERE ────────────────────────────────────────────────
  // Each module owner should expand this section with realistic sample data
  // for their entity before their first demo. Keep medicine/pharmacy IDs in sync
  // with your own inserts above.
  // ──────────────────────────────────────────────────────────────────────────

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
