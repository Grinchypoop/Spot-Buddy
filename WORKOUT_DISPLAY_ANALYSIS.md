# Spot Buddy - Group Workout Display Issue Analysis

## Issue Summary
When a group member clicks on another member's workout count in the group view, the app displays the wrong workout (showing the user's own workout instead of the groupmate's).

---

## Data Flow Overview

### 1. Frontend - Mini-App HTML (`/Users/mehtaz/Spot/public/mini-app/index.html`)

#### Calendar View Workflow
```
User clicks on calendar date 
    ↓
showDayDetails(dateStr) called [Line 504-553]
    ↓
Fetches: /api/groups/{chatId}/workouts/{dateStr}
    ↓
Receives array of workouts for that day
    ↓
Renders workout cards with click handlers [Line 535]
    ↓
User clicks on workout card
    ↓
showWorkoutDetails(username, exercises, mood, notes, workoutId) [Line 558]
```

#### Key Functions in Frontend:

**1. `loadGroupWorkouts()` [Line 428-502]**
- Fetches `/api/workouts/group/{chatId}?month={month}&year={year}`
- Receives array of workouts from all group members
- Builds date-to-users map (showing who worked out on each date)
- Displays colored circles on calendar dates
- Does NOT store individual workout IDs or user mapping

**2. `showDayDetails(dateStr)` [Line 504-553]**
- Called when user clicks a calendar date
- Fetches `/api/groups/{chatId}/workouts/{dateStr}`
- Renders each workout as clickable card
- **CRITICAL**: Passes `workoutId` to `showWorkoutDetails()` [Line 535]
```javascript
onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})"
```

**3. `showWorkoutDetails(username, exercises, mood, notes, workoutId)` [Line 558-612]**
- Displays the full workout in a modal
- Stores: `currentViewingWorkout = { username, exercises, mood, notes, workoutId }`
- This object is used by edit/delete handlers [Line 764, 837]

#### Parameter Handling Flow
- Username and details are passed directly as function parameters
- WorkoutId is stored and used correctly
- No filtering by current user before showing details

---

### 2. Backend API Endpoints

#### API Route Definition (`/Users/mehtaz/Spot/src/api/routes.js`)
```javascript
router.get('/groups/:groupId/workouts/:date', groupController.getGroupWorkoutsByDate);
```

#### Controller: `getGroupWorkoutsByDate()` (`/Users/mehtaz/Spot/src/api/controllers/groupController.js` [Line 24-99])

**How it works:**
1. Accepts `groupId` and `date` (YYYY-MM-DD format) as parameters
2. Gets all group members from `group_members` table
3. Fetches all workouts for those members on that date
4. For each workout, looks up the user by `telegram_id`:
   ```javascript
   const { data: user, error: userError } = await supabase
     .from('users')
     .select('username, telegram_id')
     .eq('telegram_id', workout.user_id)
     .single();
   ```
5. Returns array with user data attached to each workout

**Response Structure:**
```javascript
{
  id: workout_id,
  user_id: telegram_id,
  group_id: chat_id,
  exercises: [...],
  mood: emoji,
  notes: string,
  users: { username: string, telegram_id: number }
}
```

---

## ROOT CAUSE ANALYSIS

### The Bug Location: Frontend Parameter Passing

**File:** `/Users/mehtaz/Spot/public/mini-app/index.html`
**Lines:** 535-542 (in `showDayDetails()`)

The onClick handler passes workout data directly:
```javascript
onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})"
```

**Problem:** The `username` parameter is a STRING extracted from the response, NOT the actual username from the workout object.

### Where the String Values Get Embedded

When rendering the workout card [Lines 526-543]:
```javascript
const html = workouts
  .map((workout) => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : JSON.parse(workout.exercises);
    const username = workout.users?.username || 'User';  // <-- This line
    const notes = (workout.notes || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const exercisesJson = JSON.stringify(exercises).replace(/"/g, '&quot;');
    
    return `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div class="workout-card" style="cursor: pointer; flex: 1;" 
             onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})">
```

The username is inserted as a STRING into the HTML onclick handler via template literal.

### Potential Issues Identified

1. **String Injection in Inline Handler** - While the current code appears to work for display, this pattern is fragile
2. **No User ID Association** - The system identifies workouts by `workout.id` but doesn't verify the workout belongs to the claimed user
3. **Backend Trust Without Frontend Validation** - Frontend trusts backend response without validating user ownership

### Verification Point

Let me check if there's an issue with how the backend returns workouts:

The backend controller correctly:
- Gets group members: `query.in('user_id', memberIds)` 
- Fetches workouts for those members
- Looks up each user by their `telegram_id`

The returned data should have correct user info IF the lookup succeeds. If user lookup fails, it returns:
```javascript
users: { username: 'Unknown User', telegram_id: workout.user_id }
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Mini-App)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Parameters from URL:                                      │
│  - user_id (current logged-in user's telegram_id)              │
│  - chat_id (group chat_id)                                      │
│                                                                 │
│  Calendar View:                                                 │
│  loadGroupWorkouts() ─────────────┐                            │
│                                    │                            │
│                    ┌──────────────────────────────────┐         │
│                    │ GET /api/workouts/group/{chatId} │         │
│                    │ Returns ALL member workouts      │         │
│                    └──────────────────────────────────┘         │
│                                    │                            │
│                    ┌──────────────────────────────────┐         │
│                    │ Builds date → username map       │         │
│                    │ Shows colored circles on dates   │         │
│                    └──────────────────────────────────┘         │
│                                    │                            │
│  Click on Date:                    │                            │
│  showDayDetails(dateStr) ──────────┘                           │
│                                                                 │
│                    ┌──────────────────────────────────┐         │
│                    │ GET /api/groups/{chatId}/        │         │
│                    │     workouts/{dateStr}            │         │
│                    │ Returns workouts for that date   │         │
│                    └──────────────────────────────────┘         │
│                                    │                            │
│                    ┌──────────────────────────────────┐         │
│                    │ Render workout cards             │         │
│                    │ With onclick handlers            │         │
│                    └──────────────────────────────────┘         │
│                                    │                            │
│  Click on Workout Card:            │                            │
│  showWorkoutDetails() ─────────────┘                           │
│  (stores: currentViewingWorkout)                               │
│                                                                 │
│  Click Edit/Delete:                                            │
│  Uses currentViewingWorkout.workoutId                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Route: GET /api/groups/:groupId/workouts/:date               │
│  Handler: groupController.getGroupWorkoutsByDate()             │
│                                                                 │
│  1. Get group members:                                          │
│     SELECT user_id FROM group_members WHERE group_id = ?       │
│                                                                 │
│  2. Get workouts for those members on date:                    │
│     SELECT * FROM workouts                                      │
│     WHERE date BETWEEN startOfDay AND endOfDay                  │
│     AND user_id IN (memberIds)                                 │
│                                                                 │
│  3. For each workout, lookup user:                             │
│     SELECT username, telegram_id FROM users                    │
│     WHERE telegram_id = workout.user_id                        │
│                                                                 │
│  4. Return: workout + user info                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hypothesis: Why Workouts Might Be Wrong

Given the current code structure, the most likely scenarios are:

### Scenario 1: User Lookup Failure (Unlikely)
If the user lookup in the backend fails silently, all workouts would show as "Unknown User".

### Scenario 2: Frontend URL Parameter Issue (More Likely)
If the `user_id` or `chat_id` parameters aren't correctly passed to the mini-app:
- Mini-app still loads and displays
- All operations use the wrong `user_id`
- Would need to check Telegram bot's mini-app link generation

**Check Point:** Line 16 in `telegram.js`:
```javascript
const miniAppLink = `${process.env.MINI_APP_URL}/mini-app?user_id=${userId}&chat_id=${chatId}`;
```
This looks correct - passes the correct userId and chatId.

### Scenario 3: User Confusion / Frontend Logic
The most insidious cause: if the user is viewing their OWN workout when they click on their name, there's no bug. They might be confused about clicking on their own colored circle.

### Scenario 4: Browser Caching / State Issue
If the `currentViewingWorkout` object isn't being properly cleared between clicks, old data could persist.

**Check Point:** Line 556 properly sets: `currentViewingWorkout = { username, exercises, mood, notes, workoutId };`

### Scenario 5: Exercises JSON Encoding Issue
The exercises are passed as a JSON string in the onclick attribute. If special characters aren't properly escaped, the string might be malformed.

**Check Point:** Line 531 attempts escaping: `.replace(/"/g, '&quot;');`
But this only handles double quotes, not all special characters that might break the JS string.

---

## Code Quality Issues Found

### 1. Inline Event Handlers with String Parameters (HIGH RISK)
**File:** `/Users/mehtaz/Spot/public/mini-app/index.html`, Line 535

```javascript
onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})"
```

**Problems:**
- String values embedded in HTML attributes are vulnerable to injection
- Exercises JSON passed as string makes escaping fragile
- Mood emoji and notes could contain special characters
- Hard to debug issues in browser

**Better Approach:**
Store workout data in a JavaScript object and use data attributes:
```javascript
<div class="workout-card" data-workout-id="${workout.id}" style="cursor: pointer;">
```
Then attach click listener in JavaScript that reads from the object.

### 2. No Validation of Workout Ownership
**Files:** Both frontend and backend

**Issue:** No check that the user clicking Edit/Delete actually owns the workout. Backend should validate:
```javascript
// Should verify: current user_id matches workout.user_id
```

### 3. Complex String Escaping
**File:** `/Users/mehtaz/Spot/public/mini-app/index.html`, Lines 530-531

```javascript
const notes = (workout.notes || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const exercisesJson = JSON.stringify(exercises).replace(/"/g, '&quot;');
```

This assumes only quotes need escaping, but doesn't handle:
- Line breaks in notes
- Unicode characters
- HTML entities
- Template literal backticks

---

## Recommendations for Investigation

### 1. Check Browser Console
Add console logs to verify data being passed:

```javascript
// In showDayDetails() at line 549
console.log('About to render workouts:', workouts);

// In showWorkoutDetails() at line 559  
console.log('Received parameters:', { username, exercises, mood, notes, workoutId });
console.log('Current user ID:', userId);
```

### 2. Verify API Response
Intercept the fetch to `/api/groups/{chatId}/workouts/{dateStr}` and verify:
- Each workout has the correct `users.username`
- The `id` field is unique per workout
- Multiple users have different usernames

### 3. Check Edit/Delete Functionality
When user clicks Edit on groupmate's workout:
```javascript
// Line 837
deleteWorkout(currentViewingWorkout.workoutId);
```

Does the backend check that the current user owns this workout?

### 4. Test Scenario
1. User A logs a workout
2. User B opens the app (same group)
3. User B clicks on User A's workout
4. What workout is displayed? (Should be A's, not B's)
5. Can User B edit it? (Should fail or be prevented)

---

## File Structure Reference

```
/Users/mehtaz/Spot/
├── public/
│   └── mini-app/
│       ├── index.html          (FRONTEND - Main issue area)
│       └── styles.css
├── src/
│   ├── index.js               (Server setup)
│   ├── api/
│   │   ├── routes.js          (API endpoints)
│   │   └── controllers/
│   │       ├── workoutController.js    (Fetches workouts by ID)
│   │       └── groupController.js      (Fetches group workouts - KEY FILE)
│   ├── bot/
│   │   └── telegram.js        (Mini-app link generation)
│   └── db/
│       └── supabase.js        (Database client)
```

---

## Key Files and Lines Summary

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Calendar rendering | `/public/mini-app/index.html` | 374-426 | Creates calendar grid |
| Load group workouts | `/public/mini-app/index.html` | 428-502 | Fetches all member workouts |
| Show day details | `/public/mini-app/index.html` | 504-553 | Fetches workouts for selected date |
| Show workout modal | `/public/mini-app/index.html` | 558-612 | Displays workout details |
| **CRITICAL** Click handler | `/public/mini-app/index.html` | 535 | Maps click to workout details |
| API endpoint | `/src/api/routes.js` | 15 | Defines route for day workouts |
| Get day workouts | `/src/api/controllers/groupController.js` | 24-99 | Fetches and returns workouts |
| User lookup | `/src/api/controllers/groupController.js` | 74-86 | Queries user by telegram_id |

