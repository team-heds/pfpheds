require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const importCommunities = async () => {
  try {
    // Adjust the path to be relative to the script's location
    const filePath = path.join(__dirname, '../../../pfpheds-default-rtdb-Communities-export.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const communitiesData = JSON.parse(fileContent);

    // The JSON is an object with keys as IDs, transform it into an array
    const communitiesToInsert = Object.entries(communitiesData).map(([id, community]) => {
      // Convert date from DD-MM-YYYY to YYYY-MM-DD for new Date()
      const dateParts = community.createAd.split('-');
      const isoDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

      // Map JSON fields to Supabase table columns (snake_case)
      return {
        id: id, // Use the Firebase key as the primary key
        name: community.name,
        description: community.description,
        type: community.type,
        created_at: isoDate.toISOString(),
        created_by: community.createdBy,
        creator_name: community.creatorName,
        managers: community.managers || {},
        members: community.members || {}
      };
    });

    if (communitiesToInsert.length === 0) {
      console.log('No communities to import.');
      return;
    }

    console.log(`Preparing to insert ${communitiesToInsert.length} communities...`);

    // Upsert the data: update if the id exists, otherwise insert a new row.
    const { data, error } = await supabase
      .from('communities')
      .upsert(communitiesToInsert, { onConflict: 'id' });

    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }

    console.log('Successfully imported communities data!');
    console.log('Inserted/Updated records:', data);

  } catch (error) {
    console.error('Failed to import communities data:', error);
  }
};

// Run the import function
importCommunities();
