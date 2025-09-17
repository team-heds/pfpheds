require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const importEnseignants = async () => {
  try {
    // Path relative to this script's location
    const filePath = path.join(__dirname, '../../../pfpheds-default-rtdb-Enseignants-export.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const enseignantsData = JSON.parse(fileContent);

    // Transform { id: { Forname, Name, Mail }, ... } into array for upsert
    const enseignantsToUpsert = Object.entries(enseignantsData).map(([id, item]) => ({
      id, // Firebase key as PK (TEXT)
      first_name: item.Forname || null,
      last_name: (item.Name || '').trim() || null,
      email: item.Mail || null,
    }));

    // Optionally filter out entries without mandatory fields (id, email)
    const rows = enseignantsToUpsert.filter(r => r.id && r.email);

    if (rows.length === 0) {
      console.log('No enseignants to import.');
      return;
    }

    console.log(`Preparing to upsert ${rows.length} enseignants...`);

    const { data, error } = await supabase
      .from('enseignants')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }

    console.log('Successfully imported enseignants data!');
    console.log('Inserted/Updated records:', data ? data.length : 0);

  } catch (err) {
    console.error('Failed to import enseignants data:', err);
  }
};

// Run the import function
importEnseignants();

