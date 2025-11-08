# Detailed Code Walkthrough - Group Workout Display

## CRITICAL BUG LOCATION: Frontend Click Handler

### File: `/Users/mehtaz/Spot/public/mini-app/index.html`
### Lines: 504-553 (showDayDetails function)

---

## Step-by-Step Execution Flow

### STEP 1: User Clicks Calendar Date
```javascript
// Line 410-412: Calendar click listener
btn.addEventListener('click', () => {
  showDayDetails(dateStr);  // dateStr = "2024-11-08"
});
```

### STEP 2: Fetch Workouts for That Day
```javascript
// Line 504-553: showDayDetails function
async function showDayDetails(dateStr) {
  console.log('showDayDetails called with dateStr:', dateStr);
  document.getElementById('day-details').style.display = 'block';
  document.getElementById('selected-date').textContent = new Date(dateStr).toLocaleDateString();

  // CRITICAL: This API call
  const apiUrl = `/api/groups/${chatId}/workouts/${dateStr}`;  // Line 510
  console.log('Fetching from:', apiUrl);

  fetch(apiUrl)
    .then((res) => {
      console.log('Response status:', res.status);
      return res.json();
    })
    .then((workouts) => {  // Line 518: workouts array received
      console.log('Workouts received:', workouts);
      
      if (!workouts || workouts.length === 0) {
        console.log('No workouts found');
        document.getElementById('day-workouts').innerHTML = '<p>No workouts on this day</p>';
        return;
      }
```

### STEP 3: Backend Response Structure

The backend (`groupController.js` line 74-93) sends:
```javascript
[
  {
    id: 123,                           // Workout ID
    user_id: 987654321,               // User's Telegram ID  
    group_id: 1234567890,             // Chat/Group ID
    exercises: [                       // JSON parsed array
      { name: "Bench Press", sets: 3, reps: 8, duration: 0 }
    ],
    mood: "😍",                        // Emoji string
    notes: "Feeling strong!",          // Plain text
    users: {                           // ATTACHED BY BACKEND
      username: "john_doe",            // THIS IS KEY!
      telegram_id: 987654321
    }
  },
  {
    id: 124,
    user_id: 555555555,               // DIFFERENT USER
    group_id: 1234567890,
    exercises: [...],
    mood: "😌",
    notes: "Good session",
    users: {
      username: "jane_smith",          // DIFFERENT USERNAME
      telegram_id: 555555555
    }
  }
]
```

### STEP 4: Render Workout Cards (THE PROBLEM AREA)

```javascript
// Line 526-544: Mapping workouts to HTML
const html = workouts
  .map((workout) => {
    // Extract data from the response
    const exercises = Array.isArray(workout.exercises) 
      ? workout.exercises 
      : JSON.parse(workout.exercises);
    
    const username = workout.users?.username || 'User';  // LINE 529: EXTRACT USERNAME
    const notes = (workout.notes || '')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const exercisesJson = JSON.stringify(exercises)
      .replace(/"/g, '&quot;');

    // THIS IS WHERE THE BUG CAN OCCUR (Line 535-542)
    return `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div class="workout-card" 
             style="cursor: pointer; flex: 1;" 
             onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})">
          <div class="workout-user">${username}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
            Click to view details
          </div>
          <div class="workout-mood" style="text-align: center; font-size: 24px;">
            ${workout.mood}
          </div>
        </div>
        <button onclick="deleteWorkout(${workout.id}, event)" 
                style="padding: 10px; background: #DC2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; flex-shrink: 0; transition: all 0.2s ease;" 
                title="Delete workout">
          🗑️
        </button>
      </div>
    `;
  })
  .join('');

console.log('Rendered HTML:', html);
document.getElementById('day-workouts').innerHTML = html;  // Line 547
```

### STEP 5: What Gets Rendered to HTML

For two users on the same day, the HTML becomes:
```html
<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
  <div class="workout-card" 
       style="cursor: pointer; flex: 1;" 
       onclick="showWorkoutDetails('john_doe', '[{\"name\":\"Bench Press\",...}]', '😍', 'Feeling strong!', 123)">
    <div class="workout-user">john_doe</div>
    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
      Click to view details
    </div>
    <div class="workout-mood" style="text-align: center; font-size: 24px;">😍</div>
  </div>
  <button onclick="deleteWorkout(123, event)" ...>🗑️</button>
</div>

<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
  <div class="workout-card" 
       style="cursor: pointer; flex: 1;" 
       onclick="showWorkoutDetails('jane_smith', '[{\"name\":\"Squats\",...}]', '😌', 'Good session', 124)">
    <div class="workout-user">jane_smith</div>
    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
      Click to view details
    </div>
    <div class="workout-mood" style="text-align: center; font-size: 24px;">😌</div>
  </div>
  <button onclick="deleteWorkout(124, event)" ...>🗑️</button>
</div>
```

### STEP 6: User Clicks on Workout Card

When user clicks on jane_smith's workout, the browser executes:
```javascript
showWorkoutDetails('jane_smith', '[{"name":"Squats",...}]', '😌', 'Good session', 124)
```

### STEP 7: Display Workout Details

```javascript
// Line 558-612: showWorkoutDetails function
function showWorkoutDetails(username, exercises, mood, notes, workoutId) {
  console.log('showWorkoutDetails called:', { username, exercises, mood, notes, workoutId });
  const modal = document.getElementById('workout-modal');
  
  // Set the username in modal
  document.getElementById('modal-username').textContent = username;  // LINE 561: Shows correct username

  // Store for later use
  currentViewingWorkout = { username, exercises, mood, notes, workoutId };  // LINE 564

  // Parse exercises if string
  let parsedExercises = exercises;
  if (typeof exercises === 'string') {
    try {
      parsedExercises = JSON.parse(exercises);
    } catch (e) {
      console.error('Failed to parse exercises:', e);
      parsedExercises = [];
    }
  }

  console.log('Parsed exercises:', parsedExercises);

  // Build HTML for modal content
  let content = `
    <div style="margin-bottom: 20px;">
      <h3 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">
        Exercises
      </h3>
      ${Array.isArray(parsedExercises) ? parsedExercises.map((ex) => `
        <div style="background: var(--surface-light); padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--primary);">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
            ${ex.name}
          </div>
          <div style="color: var(--text-secondary); font-size: 13px;">
            ${ex.sets ? `<div>Sets: ${ex.sets}</div>` : ''}
            ${ex.reps ? `<div>Reps: ${ex.reps}</div>` : ''}
            ${ex.duration ? `<div>Duration: ${ex.duration} min</div>` : ''}
          </div>
        </div>
      `).join('') : '<p>No exercises</p>'}
    </div>
    ...
  `;

  document.getElementById('modal-content').innerHTML = content;
  modal.style.display = 'block';  // Show the modal
}
```

---

## WHERE THE BUG COULD OCCUR

### Scenario A: Backend Returns Wrong User (UNLIKELY)

If `getGroupWorkoutsByDate()` returns wrong usernames for workouts, then the displayed data would be incorrect.

**Check:** Lines 74-93 in `groupController.js`:
```javascript
const parsedData = await Promise.all(workouts.map(async (workout) => {
  console.log(`Looking up user with telegram_id: ${workout.user_id}`);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('username, telegram_id')
    .eq('telegram_id', workout.user_id)    // <-- Query by user's telegram_id
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
```

This looks correct - it queries users by their telegram_id from the workouts table.

---

### Scenario B: Frontend Click Handler Issue (POSSIBLE)

If the JSON serialization breaks, special characters in exercises could cause issues:

```javascript
// Line 531: Current escaping
const exercisesJson = JSON.stringify(exercises).replace(/"/g, '&quot;');
```

Example of what could go wrong:
- Exercise name: "Back's Leg Press" (contains apostrophe)
- After stringify: `[{"name":"Back's Leg Press"}]`
- After replace: `[{"name":"Back's Leg Press"}]` (unchanged - only quotes handled!)
- The onclick becomes: `onclick="showWorkoutDetails('user', '[{"name":"Back's Leg Press"}]', ...)"`
- Browser sees: `showWorkoutDetails('user', '[{"name":"Back` (BREAKS HERE)

**Risk Level: HIGH** - This is a fragile approach.

---

### Scenario C: User ID in URL Parameters (POSSIBLE)

The mini-app receives URL parameters:
```javascript
// Line 125-127
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');
const chatId = urlParams.get('chat_id');
```

These are used throughout, but if they're swapped or incorrect, the app would fetch wrong data.

**However:** The `userId` is NOT used in the workout display logic! The frontend doesn't filter workouts by `userId`. It just displays all group members' workouts.

---

### Scenario D: User Confusion (LIKELY)

The most likely scenario: User A is in a group with User B.
- User A clicks on their own workout circle on the calendar
- The modal shows their own workout
- They think they clicked on someone else's workout

This isn't a bug - it's correct behavior. But it might feel wrong to the user if they're confused about whose circle they clicked.

---

### Scenario E: Edit/Delete Permission Issue (CRITICAL)

Even if the workout display is correct, there's a MAJOR security issue:

```javascript
// Line 837: Delete button handler
document.getElementById('delete-workout-btn').addEventListener('click', () => {
  if (currentViewingWorkout) {
    deleteWorkout(currentViewingWorkout.workoutId);  // <-- Uses stored workoutId
  }
});

// Line 627-661: deleteWorkout function
async function deleteWorkout(workoutId, event) {
  if (event) {
    event.stopPropagation();
  }

  if (!confirm('Are you sure you want to delete this workout?')) {
    return;
  }

  try {
    const response = await fetch(`/api/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      alert('Workout deleted successfully!');
      // ...
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
    alert('Failed to delete workout');
  }
}
```

**THE PROBLEM:** Frontend sends `DELETE /api/workouts/{workoutId}` but the backend doesn't verify the user owns the workout!

Check `workoutController.js` line 166-182:
```javascript
async function deleteWorkout(req, res) {
  try {
    const { workoutId } = req.params;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);    // <-- Only checks ID, not ownership!

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**User B can delete User A's workout!** There's no check that `currentUserId == workout.user_id`!

The same issue exists for edits (Line 139-164).

---

## SUMMARY OF ISSUES

### Issue 1: Fragile String Escaping in HTML Attributes
**Severity:** MEDIUM
**File:** `/Users/mehtaz/Spot/public/mini-app/index.html`, Line 535
**Problem:** Complex characters in exercises JSON could break the onclick handler
**Example:** `"Back's Leg Press"` would break the string

### Issue 2: No Workout Ownership Validation
**Severity:** CRITICAL
**Files:** 
- `/Users/mehtaz/Spot/src/api/controllers/workoutController.js` (Lines 139-182)
- `/Users/mehtaz/Spot/public/mini-app/index.html` (Lines 627-661)
**Problem:** User B can edit/delete User A's workout without permission
**Impact:** Data corruption, privacy breach

### Issue 3: Inline Event Handlers are Unmaintainable
**Severity:** MEDIUM
**File:** `/Users/mehtaz/Spot/public/mini-app/index.html`, Line 535
**Problem:** Hard to debug, vulnerable to XSS if user data isn't properly escaped
**Better Practice:** Use data attributes + JavaScript event listeners

---

## MOST LIKELY ROOT CAUSE

The **displayed workout is wrong** most likely because:

1. **The workout ID being passed is correct** (workoutId is numeric, safe)
2. **The username string is being parsed correctly** from the HTML onclick
3. **The issue is in the data being passed TO the onclick**

Most probable: **Exercise JSON string is malformed** and breaking the function call, then the browser is using cached/stale data.

Alternatively: **Backend is returning workouts in wrong order** and the user is clicking the wrong card.

