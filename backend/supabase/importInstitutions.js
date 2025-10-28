const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const JSON_FILENAME = process.env.INSTITUTIONS_JSON_PATH || '../firebasedata/pfpheds-default-rtdb-export.json';

function toDateOrNull(value) {
  if (!value || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString().slice(0, 10);
}

function toJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
  } catch {
    return [value].filter(Boolean);
  }
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const importInstitutions = async () => {
  const jsonFilePath = path.resolve(__dirname, JSON_FILENAME);

  let institutionsData;
  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    institutionsData = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading or parsing the JSON file:', error.message);
    return;
  }

  if (!institutionsData || typeof institutionsData !== 'object') {
    console.error('Invalid JSON structure: expected an object keyed by InstitutionId');
    return;
  }

  const entries = institutionsData.Institutions || institutionsData;
  console.log(`Found ${Object.keys(entries).length} records in the JSON file.`);

  const formattedRecords = Object.entries(entries)
    .map(([key, value]) => {
      const record = { ...value, InstitutionId: value.InstitutionId || key };
      if (!record.InstitutionId) {
        console.warn('Skipping record without InstitutionId', value);
        return null;
      }

      return {
        InstitutionId: String(record.InstitutionId),
        Name: record.Name || null,
        Category: record.Category || null,
        Address: record.Address || null,
        Locality: record.Locality || null,
        Canton: record.Canton || null,
        NPA: record.NPA || null,
        Language: record.Language || null,
        Description: record.Description || null,
        URL: record.URL || null,
        CyberleanURL: record.CyberleanURL || null,
        MailChef: record.MailChef || null,
        NomChef: record.NomChef || null,
        PhoneChef: record.PhoneChef || null,
        IdResponsablePhysio: record.IdResponsablePhysio || null,
        AccordCadreDate: toDateOrNull(record.AccordCadreDate),
        AccordCadrePDF: record.AccordCadrePDF || null,
        ConventionDate: toDateOrNull(record.ConventionDate),
        ConventionPDF: record.ConventionPDF || null,
        ImageURL: toJsonArray(record.ImageURL),
        Latitude: toNumberOrNull(record.Latitude),
        Longitude: toNumberOrNull(record.Longitude),
      };
    })
    .filter(Boolean);

  console.log(`Formatted ${formattedRecords.length} records for insertion.`);
  if (formattedRecords.length > 0) {
    console.log('First record:', JSON.stringify(formattedRecords[0], null, 2));
  }

  try {
    const { data, error } = await supabase
      .from('institutions')
      .upsert(formattedRecords, { onConflict: 'InstitutionId' });

    if (error) throw error;

    console.log(`Successfully inserted/updated ${data ? data.length : formattedRecords.length} records.`);
  } catch (error) {
    console.error('Error inserting data into Supabase:', error.message);
  }
};

if (require.main === module) {
  importInstitutions();
} else {
  module.exports = importInstitutions;
}
