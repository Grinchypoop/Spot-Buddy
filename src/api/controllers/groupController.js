const { getSupabaseClient } = require('../../db/supabase');

async function getGroupMembers(req, res) {
  try {
    const { groupId } = req.params;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('group_members')
      .select('users(id, username, telegram_id)')
      .eq('group_id', groupId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getGroupWorkoutsByDate(req, res) {
  try {
    const { groupId, date } = req.params;

    console.log('getGroupWorkoutsByDate called with:', { groupId, date });

    const supabase = getSupabaseClient();

    // Get all members in the group
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error getting group members:', membersError);
      return res.status(500).json({ error: membersError.message });
    }

    console.log(`Found ${members?.length || 0} members in group`);

    const memberIds = members?.map((m) => m.user_id) || [];

    // Parse date - date comes in format YYYY-MM-DD
    // Convert to UTC date range
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();

    // Get workouts for all group members on this date (workouts are now user-level, not group-specific)
    let query = supabase
      .from('workouts')
      .select('*')
      .gte('date', startOfDay)
      .lte('date', endOfDay);

    if (memberIds.length > 0) {
      query = query.in('user_id', memberIds);
    }

    const { data: workouts, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts by date:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${workouts?.length || 0} workouts for date ${date}`);

    // Fetch user data separately and merge
    const parsedData = await Promise.all(workouts.map(async (workout) => {
      console.log(`Looking up user with telegram_id: ${workout.user_id}`);
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('username, telegram_id')
        .eq('telegram_id', workout.user_id)
        .single();

      if (userError) {
        console.log(`User lookup error for ${workout.user_id}:`, userError);
      } else {
        console.log(`Found user:`, user);
      }

      return {
        ...workout,
        exercises: JSON.parse(workout.exercises),
        users: user || { username: 'Unknown User', telegram_id: workout.user_id }
      };
    }));

    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getGroupMembers,
  getGroupWorkoutsByDate,
};
