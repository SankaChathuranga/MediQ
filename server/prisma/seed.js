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

  console.log('✓ Medicines seeded (existing):', paracetamol.name, amoxicillin.name, metformin.name);

  // ─── Additional medicines — Member 1 (Medicine Catalog module) ─────────────
  // Categories use the lowercase/kebab enum the Zod schema enforces:
  //   antibiotic | painkiller | chronic-care | antihistamine | other
  // IDs 4–19 reserved for this module.

  const newMedicines = await Promise.all([
    // Antibiotics
    prisma.medicine.upsert({ where: { id: 4 }, update: {}, create: { name: 'Augmentin',        generic_name: 'Amoxicillin-Clavulanate',  category: 'antibiotic',    description: 'Broad-spectrum antibiotic combining amoxicillin with clavulanate; treats resistant infections.' } }),
    prisma.medicine.upsert({ where: { id: 5 }, update: {}, create: { name: 'Zithromax',        generic_name: 'Azithromycin',            category: 'antibiotic',    description: 'Macrolide antibiotic for respiratory and skin infections. 3–5 day course.' } }),
    prisma.medicine.upsert({ where: { id: 6 }, update: {}, create: { name: 'Flagyl',           generic_name: 'Metronidazole',           category: 'antibiotic',    description: 'Treats anaerobic bacterial and protozoal infections; common for GI and dental infections.' } }),
    prisma.medicine.upsert({ where: { id: 7 }, update: {}, create: { name: 'Ciprobay',         generic_name: 'Ciprofloxacin',           category: 'antibiotic',    description: 'Fluoroquinolone antibiotic for urinary tract and systemic infections.' } }),
    // Painkillers
    prisma.medicine.upsert({ where: { id: 8 }, update: {}, create: { name: 'Brufen',           generic_name: 'Ibuprofen',               category: 'painkiller',    description: 'NSAID for pain, fever, and inflammation. Take with food to protect gastric lining.' } }),
    prisma.medicine.upsert({ where: { id: 9 }, update: {}, create: { name: 'Voltaren',         generic_name: 'Diclofenac',              category: 'painkiller',    description: 'NSAID commonly used for musculoskeletal pain and arthritis.' } }),
    prisma.medicine.upsert({ where: { id: 10 }, update: {}, create: { name: 'Tramacet',        generic_name: 'Tramadol + Paracetamol',  category: 'painkiller',    description: 'Moderate-to-severe pain relief combining an opioid analgesic with paracetamol.' } }),
    // Chronic care
    prisma.medicine.upsert({ where: { id: 11 }, update: {}, create: { name: 'Insulin Actrapid', generic_name: 'Human Insulin (Regular)', category: 'chronic-care', description: 'Short-acting insulin for type 1 and type 2 diabetes; requires refrigeration.' } }),
    prisma.medicine.upsert({ where: { id: 12 }, update: {}, create: { name: 'Cardace',          generic_name: 'Ramipril',               category: 'chronic-care', description: 'ACE inhibitor for hypertension and heart failure management.' } }),
    prisma.medicine.upsert({ where: { id: 13 }, update: {}, create: { name: 'Atorva',           generic_name: 'Atorvastatin',           category: 'chronic-care', description: 'Statin for lowering LDL cholesterol and reducing cardiovascular risk.' } }),
    prisma.medicine.upsert({ where: { id: 14 }, update: {}, create: { name: 'Tenormin',         generic_name: 'Atenolol',               category: 'chronic-care', description: 'Beta-blocker for high blood pressure and angina.' } }),
    prisma.medicine.upsert({ where: { id: 15 }, update: {}, create: { name: 'Omepral',          generic_name: 'Omeprazole',             category: 'chronic-care', description: 'Proton pump inhibitor for GERD, peptic ulcers, and acid reflux.' } }),
    // Antihistamines
    prisma.medicine.upsert({ where: { id: 16 }, update: {}, create: { name: 'Cetirizine-AL',   generic_name: 'Cetirizine',              category: 'antihistamine', description: 'Non-drowsy antihistamine for allergic rhinitis, urticaria, and hay fever.' } }),
    prisma.medicine.upsert({ where: { id: 17 }, update: {}, create: { name: 'Polaramine',       generic_name: 'Chlorpheniramine',        category: 'antihistamine', description: 'First-generation antihistamine; effective for colds and allergic reactions.' } }),
    prisma.medicine.upsert({ where: { id: 18 }, update: {}, create: { name: 'Aerius',           generic_name: 'Desloratadine',           category: 'antihistamine', description: 'Long-acting antihistamine; once-daily for seasonal and perennial allergies.' } }),
    // Other
    prisma.medicine.upsert({ where: { id: 19 }, update: {}, create: { name: 'Vitamin D3 Forte', generic_name: 'Cholecalciferol',        category: 'other',         description: 'Vitamin D3 supplement for deficiency; important for bone health and immunity.' } }),
  ]);

  console.log('✓ Additional medicines seeded:', newMedicines.map((m) => m.name).join(', '));

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
