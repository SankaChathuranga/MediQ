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

  console.log('✓ Pharmacies seeded:', pharmacyA.name, pharmacyB.name);

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

  // ─── Patient Requests (Member 4) ───────────────────────────────────────────
  await prisma.request.upsert({
    where: { id: 1 },
    update: {},
    create: {
      patient_contact: '+94 77 123 4567',
      medicine_id: paracetamol.id,
      area: 'Colombo',
      urgency: 'high',
      status: 'fulfilled',
    },
  });

  await prisma.request.upsert({
    where: { id: 2 },
    update: {},
    create: {
      patient_contact: '+94 71 987 6543',
      medicine_id: amoxicillin.id,
      area: 'Kandy',
      urgency: 'medium',
      status: 'fulfilled',
    },
  });

  await prisma.request.upsert({
    where: { id: 3 },
    update: {},
    create: {
      patient_contact: 'nimal.silva@gmail.com',
      medicine_id: metformin.id,
      area: 'Colombo',
      urgency: 'low',
      status: 'open',
    },
  });

  await prisma.request.upsert({
    where: { id: 4 },
    update: {},
    create: {
      patient_contact: '+94 76 555 0011',
      medicine_id: paracetamol.id,
      area: 'Kandy',
      urgency: 'medium',
      status: 'open',
    },
  });

  await prisma.request.upsert({
    where: { id: 5 },
    update: {},
    create: {
      patient_contact: '+94 70 444 8822',
      medicine_id: amoxicillin.id,
      area: 'Colombo',
      urgency: 'high',
      status: 'open',
    },
  });

  await prisma.request.upsert({
    where: { id: 6 },
    update: {},
    create: {
      patient_contact: 'kumari.perera@yahoo.com',
      medicine_id: metformin.id,
      area: 'Kandy',
      urgency: 'low',
      status: 'open',
    },
  });

  console.log('✓ Patient requests seeded (6 records)');
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
