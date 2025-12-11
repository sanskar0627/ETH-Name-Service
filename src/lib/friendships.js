import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch all friendships from the database
 * @returns {Promise<Array>} Array of friendship objects with ens_name_1 and ens_name_2
 */
export async function getFriendships() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friendships:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching friendships:', err);
    return [];
  }
}

/**
 * Add a new friendship to the database
 * @param {string} ensName1 - First ENS name
 * @param {string} ensName2 - Second ENS name
 * @returns {Promise<boolean>} Success status
 */
export async function addFriendship(ensName1, ensName2) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return false;
  }

  if (!ensName1 || !ensName2) {
    console.error('Both ENS names are required');
    return false;
  }

  try {
    // Normalize order to avoid duplicates (always store alphabetically)
    const [name1, name2] = [ensName1, ensName2].sort();

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(ens_name_1.eq.${name1},ens_name_2.eq.${name2}),and(ens_name_1.eq.${name2},ens_name_2.eq.${name1})`)
      .maybeSingle();

    if (existing) {
      console.log('Friendship already exists');
      return true; // Already exists, consider it success
    }

    const { error } = await supabase
      .from('friendships')
      .insert([{ ens_name_1: name1, ens_name_2: name2 }]);

    if (error) {
      console.error('Error adding friendship:', error);
      return false;
    }

    console.log(`Added friendship: ${name1} <-> ${name2}`);
    return true;
  } catch (err) {
    console.error('Exception adding friendship:', err);
    return false;
  }
}

/**
 * Delete a friendship from the database
 * @param {string} ensName1 - First ENS name
 * @param {string} ensName2 - Second ENS name
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFriendship(ensName1, ensName2) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured');
    return false;
  }

  if (!ensName1 || !ensName2) {
    console.error('Both ENS names are required');
    return false;
  }

  try {
    // Delete in either direction (name1->name2 or name2->name1)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(ens_name_1.eq.${ensName1},ens_name_2.eq.${ensName2}),and(ens_name_1.eq.${ensName2},ens_name_2.eq.${ensName1})`);

    if (error) {
      console.error('Error deleting friendship:', error);
      return false;
    }

    console.log(`Deleted friendship: ${ensName1} <-> ${ensName2}`);
    return true;
  } catch (err) {
    console.error('Exception deleting friendship:', err);
    return false;
  }
}

/**
 * Convert friendships array to pairs format [[name1, name2], ...]
 * @param {Array} friendships - Array of friendship objects
 * @returns {Array} Array of [name1, name2] pairs
 */
export function friendshipsToPairs(friendships) {
  return friendships.map(f => [f.ens_name_1, f.ens_name_2]);
}
