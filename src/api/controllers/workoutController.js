const { getSupabaseClient } = require('../../db/supabase');
const { DateTime } = require('luxon'); // ✅ ADDED: Import luxon for timezone handling

async function createWorkout(req, res) {
  try {
    const { user_id, group_id, exercises, cardio, mood, notes, timezone } = req.body;

    // Validate required fields
    if (!user_id || !group_id) {
      return res.status(400).json({ error: 'Missing user_id or group_id' });
    }

    const hasExercises = exercises && exercises.length > 0;
    const hasCardio = cardio && (cardio.type || cardio.duration);
    const hasMood = mood && mood.trim() !== '';

    if (!hasExercises && !hasCardio && !hasMood) {
      return res.status(400).json({ error: 'Please log at least one exercise, cardio, or select a mood' });
    }

    const supabase = getSupabaseClient();

    // Combine exercises and cardio into a single exercises array for storage
    let allExercises = exercises || [];
    if (hasCardio) {
      allExercises = [...allExercises, { type: 'cardio', ...cardio }];
    }

    // ✅ ADDED: Get current date/time in user's timezone
    const userTimezone = timezone || 'Asia/Singapore'; // Default to Singapore if not provided
    const localDate = DateTime.now().setZone(userTimezone).toISODate(); // Just "2025-11-09"

    // Save workout with group_id to satisfy database constraint
    const { data, error } = await supabase
      .from('workouts')
      .insert([
        {
          user_id,
          group_id,
          exercises: JSON.stringify(allExercises),
          mood,
          notes,
          timezone,
          date: localDate, // ✅ CHANGED: Now uses user's local timezone instead of UTC
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
      // Create date range for the month (format: YYYY-MM-DD)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      // Get last day of month: new Date(year, month, 0) gives last day of previous month
      // Since month is 1-indexed, we need new Date(year, month, 0) which gives us the last day
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
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