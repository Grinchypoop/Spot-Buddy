const { getSupabaseClient } = require('../../db/supabase');

async function createWorkout(req, res) {
  try {
    const { user_id, group_id, exercises, mood, notes, timezone } = req.body;

    if (!user_id || !exercises || exercises.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseClient();

    // Save workout with group_id to satisfy database constraint
    const { data, error } = await supabase
      .from('workouts')
      .insert([
        {
          user_id,
          group_id,
          exercises: JSON.stringify(exercises),
          mood,
          notes,
          timezone,
          date: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getUserWorkouts(req, res) {
  try {
    const { userId } = req.params;
    const { groupId } = req.query;

    const supabase = getSupabaseClient();

    let query = supabase.from('workouts').select('*').eq('user_id', userId);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Parse exercises JSON
    const parsedData = data.map((workout) => ({
      ...workout,
      exercises: JSON.parse(workout.exercises),
    }));

    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getGroupWorkouts(req, res) {
  try {
    const { groupId } = req.params;
    const { month, year } = req.query;

    console.log(`getGroupWorkouts called: groupId=${groupId}, month=${month}, year=${year}`);

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

    // Get workouts for all members (workouts are now user-level, not group-specific)
    let query = supabase.from('workouts').select('*');

    if (memberIds.length > 0) {
      query = query.in('user_id', memberIds);
    }

    if (month && year) {
      // Create UTC date range for the month
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString();
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
      console.log(`Date range: ${startDate} to ${endDate}`);
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${data?.length || 0} workouts`);

    // Fetch user data for each workout
    const parsedData = await Promise.all(data.map(async (workout) => {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('username, telegram_id')
        .eq('telegram_id', workout.user_id)
        .single();

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

async function updateWorkout(req, res) {
  try {
    const { workoutId } = req.params;
    const { exercises, mood, notes } = req.body;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('workouts')
      .update({
        exercises: JSON.stringify(exercises),
        mood,
        notes,
      })
      .eq('id', workoutId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteWorkout(req, res) {
  try {
    const { workoutId } = req.params;

    const supabase = getSupabaseClient();

    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createWorkout,
  getUserWorkouts,
  getGroupWorkouts,
  updateWorkout,
  deleteWorkout,
};
