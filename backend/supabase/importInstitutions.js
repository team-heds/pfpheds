const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const importInstitutions = async () => {
  // Resolve the absolute path to the JSON file
  const jsonFilePath = path.resolve(__dirname, '../../../pfpheds-default-rtdb-Institutions-export (1).json');

  // 1. Read and parse the JSON file
  let institutionsData;
  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    institutionsData = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading or parsing the JSON file:', error);
    return;
  }

  // 2. Transform the data for Supabase
  // 2. Transform the data for Supabase
  console.log(`Found ${Object.keys(institutionsData).length} records in the JSON file.`);

  const formattedRecords = Object.entries(institutionsData)
    .map(([key, value]) => {
      // Use the object key as the definitive InstitutionId
      const record = { ...value, InstitutionId: key };
      return {
        InstitutionId: record.InstitutionId,
        AccordCadreDate: record.AccordCadreDate || null,
        AccordCadrePDF: record.AccordCadrePDF || null,
        Address: record.Address || null,
        Canton: record.Canton || null,
        Category: record.Category || null,
        ConventionDate: record.ConventionDate || null,
        ConventionPDF: record.ConventionPDF || null,
        CyberleanURL: record.CyberleanURL || null,
        Description: record.Description || null,
        IdResponsablePhysio: record.IdResponsablePhysio || null,
        ImageURL: record.ImageURL ? JSON.stringify(record.ImageURL) : null,
        Language: record.Language || null,
        Latitude: record.Latitude || null,
        Locality: record.Locality || null,
        Longitude: record.Longitude || null,
        MailChef: record.MailChef || null,
        NPA: record.NPA || null,
        Name: record.Name || null,
        NomChef: record.NomChef || null,
        Note: record.Note || null,
        PhoneChef: record.PhoneChef || null,
      };
    })
    .filter(record => record.InstitutionId); // Filter out any records that still lack an ID

  console.log(`Formatted ${formattedRecords.length} records for insertion.`);
  if (formattedRecords.length > 0) {
    console.log('First record:', JSON.stringify(formattedRecords[0], null, 2));
  }

  // 3. Insert data into Supabase
  try {
    const { data, error } = await supabase
      .from('institutions')
      .upsert(formattedRecords, { onConflict: 'InstitutionId' }); // Upsert to avoid duplicates

    if (error) {
      throw error;
    }

    console.log(`Successfully inserted/updated ${data ? data.length : 0} records.`);
  } catch (error) {
    console.error('Error inserting data into Supabase:', error.message);
  }
};

// Run the import function
importInstitutions();
