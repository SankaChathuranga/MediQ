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

  // ─── Additional Medicines (Member 2 stock seed — IDs 4–6) ──────────────────
  // Coordinate: Member 1 owns medicines. These are added here so stock rows
  // have records to reference. Member 1 may move/expand these in their branch.
  const atorvastatin = await prisma.medicine.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name:         'Lipitor',
      generic_name: 'Atorvastatin',
      category:     'Statin',
      description:  'Cholesterol-lowering medication. Requires prescription.',
    },
  });

  const omeprazole = await prisma.medicine.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name:         'Losec',
      generic_name: 'Omeprazole',
      category:     'Antacid',
      description:  'Proton pump inhibitor for acid reflux and ulcers.',
    },
  });

  const cetirizine = await prisma.medicine.upsert({
    where: { id: 6 },
    update: {},
    create: {
      name:         'Zyrtec',
      generic_name: 'Cetirizine',
      category:     'Antihistamine',
      description:  'Non-drowsy antihistamine for allergies. Available OTC.',
    },
  });

  console.log('✓ Additional medicines seeded:', atorvastatin.name, omeprazole.name, cetirizine.name);

  // ─── Additional Pharmacy (Member 2 stock seed — ID 3) ──────────────────────
  // Coordinate: Member 3 owns pharmacies. Added here for stock completeness.
  const pharmacyC = await prisma.pharmacy.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name:    'National Hospital Pharmacy',
      address: '1 Regent Street, Colombo 10',
      area:    'Colombo',
      contact: '+94 11 269 1111',
      hours:   'Mon–Sun 24 hours',
    },
  });

  console.log('✓ Additional pharmacy seeded:', pharmacyC.name);

  // ─── Additional Stock rows (Member 2) ──────────────────────────────────────
  // Covers all pharmacies × medicines with a spread of quantities so the UI
  // displays all three status states: In Stock (≥10), Low Stock (<10), Out of Stock (0).

  const additionalStock = [
    // Cargills Health Pharmacy (id:1)
    { id: 3, pharmacy_id: pharmacyA.id, medicine_id: metformin.id,    quantity: 45,  price: 85.0  },
    { id: 4, pharmacy_id: pharmacyA.id, medicine_id: atorvastatin.id, quantity: 8,   price: 320.0 }, // Low
    { id: 5, pharmacy_id: pharmacyA.id, medicine_id: omeprazole.id,   quantity: 0,   price: 95.0  }, // Out
    { id: 6, pharmacy_id: pharmacyA.id, medicine_id: cetirizine.id,   quantity: 120, price: 55.0  },

    // Osu Sala Kandy (id:2)
    { id: 7,  pharmacy_id: pharmacyB.id, medicine_id: paracetamol.id,  quantity: 200, price: 22.0  },
    { id: 8,  pharmacy_id: pharmacyB.id, medicine_id: metformin.id,    quantity: 5,   price: 90.0  }, // Low
    { id: 9,  pharmacy_id: pharmacyB.id, medicine_id: omeprazole.id,   quantity: 60,  price: 100.0 },
    { id: 10, pharmacy_id: pharmacyB.id, medicine_id: cetirizine.id,   quantity: 0,   price: 60.0  }, // Out

    // National Hospital Pharmacy (id:3)
    { id: 11, pharmacy_id: pharmacyC.id, medicine_id: paracetamol.id,  quantity: 500, price: 20.0  },
    { id: 12, pharmacy_id: pharmacyC.id, medicine_id: amoxicillin.id,  quantity: 3,   price: 175.0 }, // Low
    { id: 13, pharmacy_id: pharmacyC.id, medicine_id: metformin.id,    quantity: 80,  price: 80.0  },
    { id: 14, pharmacy_id: pharmacyC.id, medicine_id: atorvastatin.id, quantity: 25,  price: 310.0 },
    { id: 15, pharmacy_id: pharmacyC.id, medicine_id: omeprazole.id,   quantity: 0,   price: 92.0  }, // Out
    { id: 16, pharmacy_id: pharmacyC.id, medicine_id: cetirizine.id,   quantity: 7,   price: 58.0  }, // Low
  ];

  for (const s of additionalStock) {
    await prisma.stock.upsert({
      where: { id: s.id },
      update: {},
      create: {
        pharmacy_id: s.pharmacy_id,
        medicine_id: s.medicine_id,
        quantity:    s.quantity,
        price:       s.price,
      },
    });
  }

  console.log(`✓ Additional stock rows seeded: ${additionalStock.length} entries`);
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
