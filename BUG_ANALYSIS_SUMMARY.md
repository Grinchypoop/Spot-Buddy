# Executive Summary - Group Workout Display Bug

## Quick Overview

When a group member clicks on another member's workout in the group view, the wrong workout is displayed (shows user's own workout instead of the group mate's).

---

## Data Flow Diagram (Simple)

```
User A clicks calendar date
    ↓
API: GET /api/groups/{groupId}/workouts/{date}
    ↓
Backend returns: [Workout by User A, Workout by User B, ...]
    ↓
Frontend renders clickable workout cards
    ↓
User A clicks on "User B's workout"
    ↓
Browser should call: showWorkoutDetails('user_b', exercises, mood, notes, workoutB_id)
    ↓
Modal displays: "User B's workout" with their exercises
```

---

## Code Files Involved

### Frontend
- **File:** `/Users/mehtaz/Spot/public/mini-app/index.html`
- **Key functions:**
  - `loadGroupWorkouts()` (line 428) - Fetches all group member workouts
  - `showDayDetails(dateStr)` (line 504) - Fetches workouts for selected date
  - `showWorkoutDetails()` (line 558) - Displays workout in modal
  - Click handler (line 535) - Maps clicks to workout display

### Backend
- **File:** `/Users/mehtaz/Spot/src/api/controllers/groupController.js`
- **Key function:**
  - `getGroupWorkoutsByDate()` (line 24) - Returns workouts for a date with user info
  
- **File:** `/Users/mehtaz/Spot/src/api/controllers/workoutController.js`
- **Key functions:**
  - `updateWorkout()` (line 139) - Edit endpoint
  - `deleteWorkout()` (line 166) - Delete endpoint

- **Routes:** `/Users/mehtaz/Spot/src/api/routes.js`

---

## Critical Finding #1: The Display Mechanism (Line 535)

The frontend uses **inline onclick handlers** with string parameters:

```javascript
onclick="showWorkoutDetails('${username}', '${exercisesJson}', '${workout.mood}', '${notes}', ${workout.id})"
```

This is fragile because:
1. Username and exercises are embedded as HTML attribute values
2. Complex characters could break the string
3. If escaping fails, the function call breaks
4. Browser fallback behavior is unpredictable

**Risk:** If the exercises JSON has unescaped quotes or special characters, the onclick handler breaks and the wrong function gets called.

---

## Critical Finding #2: Missing Security (Lines 139-182, 166-182)

**The REAL Problem:** There's NO OWNERSHIP VALIDATION

When user clicks Edit or Delete:
```javascript
// Backend receives workout ID
const { workoutId } = req.params;

// Backend deletes WITHOUT checking ownership
await supabase.from('workouts').delete().eq('id', workoutId);
```

**This means:** User B can delete/edit User A's workout!

The backend should verify:
```javascript
// Check: Does this user own this workout?
const currentUserId = getUserIdFromAuth();
const workout = await getWorkout(workoutId);

if (workout.user_id !== currentUserId) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## Most Likely Root Causes (In Order)

### 1. PROBABLE: Exercises JSON String Encoding (60% likelihood)
The exercises array is converted to JSON and embedded in HTML:
```javascript
const exercisesJson = JSON.stringify(exercises).replace(/"/g, '&quot;');
```

If an exercise has a quote or apostrophe that's not escaped, the string breaks:
- Exercise: `"Leg Press'" Variant"` (with quote in name)
- Becomes: `[{"name":"Leg Press'" Variant"}]`
- In onclick: `onclick="...('[{"name":"Leg Press'" Variant"}]',...)"`
- Browser parses: `onclick="...('[{"name":"Leg Press'` (BROKEN)
- Result: Function call fails, wrong data displayed

**How to test:** Check if workouts with quotes/apostrophes in names cause issues

### 2. LIKELY: Backend Response Order (30% likelihood)
The API might return workouts in wrong order, and user is clicking the wrong card.
- User thinks they're clicking "User B's" card
- But the UI is rendering them in different order
- They actually click "User A's" card
- User A's workout is displayed (which is "wrong" from their perspective)

**How to test:** Compare card order vs. API response order

### 3. LESS LIKELY: User Lookup Failure (5% likelihood)
Backend user lookup fails, all workouts show as "Unknown User"
- Would only cause display issue if lookup fails inconsistently
- More likely would show "Unknown User" for all

### 4. RARE: Caching/Stale Data (5% likelihood)
Browser cache or `currentViewingWorkout` not cleared properly
- Would show previously viewed workout
- Reproducible with same sequence of clicks

---

## Architectural Issues Found

### Issue 1: Fragile Frontend (MEDIUM severity)
**Location:** `/Users/mehtaz/Spot/public/mini-app/index.html`, line 535

**Current approach:**
```javascript
// Embed parameters in HTML attribute
onclick="showWorkoutDetails('${username}', '${exercisesJson}', ...)"
```

**Better approach:**
```javascript
// Use data attributes
<div class="workout-card" data-workout-id="${workout.id}" data-username="${username}">

// Store full data in JavaScript
workoutData[workout.id] = { username, exercises, mood, notes, workoutId };

// Attach listeners in JavaScript
element.addEventListener('click', () => {
  showWorkoutDetails(workoutData[workout.id]);
});
```

### Issue 2: Missing Authentication (CRITICAL severity)
**Location:** Both `/src/api/controllers/workoutController.js` and `/src/api/controllers/groupController.js`

**Problem:** No user authentication check on edit/delete operations

**Required fix:**
```javascript
async function deleteWorkout(req, res) {
  const { workoutId } = req.params;
  const currentUserId = req.user?.id;  // FROM AUTH MIDDLEWARE
  
  if (!currentUserId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const workout = await supabase
    .from('workouts')
    .select('user_id')
    .eq('id', workoutId)
    .single();
  
  if (workout.user_id !== currentUserId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // NOW delete
  await supabase.from('workouts').delete().eq('id', workoutId);
}
```

### Issue 3: String Escaping is Incomplete (MEDIUM severity)
**Location:** `/Users/mehtaz/Spot/public/mini-app/index.html`, lines 530-531

**Current:**
```javascript
const notes = (workout.notes || '')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const exercisesJson = JSON.stringify(exercises)
  .replace(/"/g, '&quot;');
```

**Problems:**
- Only escapes quotes, not newlines
- Notes are embedded in HTML attribute, needs more escaping
- Better to avoid embedding complex data in HTML at all

---

## Test Plan to Identify Bug

### Test 1: Exercises with Special Characters
1. User A logs workout with exercise: `Leg "Press" or variant`
2. User B views calendar, clicks on User A's workout
3. Does modal show correctly? Or does it show User B's workout?

### Test 2: Multiple Workouts Same Day
1. User A logs workout at 8am
2. User B logs workout at 9am
3. User C opens app, clicks on User B's card
4. Does modal show User B's exercises? Or User A's?

### Test 3: Delete/Edit Permission
1. User A logs a workout
2. User B opens the app
3. User B clicks on User A's workout in the modal
4. Can User B click the Delete button and delete User A's workout?
   - If YES: Security bug confirmed
   - If NO: Backend properly validates ownership

---

## Files to Fix

### Priority 1: Security (CRITICAL)
File: `/Users/mehtaz/Spot/src/api/controllers/workoutController.js`
Lines: 139-182 (updateWorkout), 166-182 (deleteWorkout)
Issue: Add ownership validation before allowing edit/delete

### Priority 2: Frontend Robustness (MEDIUM)
File: `/Users/mehtaz/Spot/public/mini-app/index.html`
Lines: 526-543 (rendering)
Issue: Replace inline onclick handlers with data attributes + JavaScript event listeners

### Priority 3: String Handling (MEDIUM)
File: `/Users/mehtaz/Spot/public/mini-app/index.html`
Lines: 530-531 (escaping)
Issue: Use better string escaping or avoid embedding complex data in HTML

---

## Exact Code Locations

| Issue | File | Lines | Severity |
|-------|------|-------|----------|
| Click handler with embedded strings | `/public/mini-app/index.html` | 535 | MEDIUM |
| No delete ownership check | `/src/api/controllers/workoutController.js` | 166-172 | CRITICAL |
| No edit ownership check | `/src/api/controllers/workoutController.js` | 139-154 | CRITICAL |
| Incomplete string escaping | `/public/mini-app/index.html` | 530-531 | MEDIUM |
| Exercises JSON in HTML attribute | `/public/mini-app/index.html` | 531, 535 | MEDIUM |

---

## Recommended Investigation Steps

1. **Check browser console** for JavaScript errors when clicking workouts
2. **Test with special characters** in exercise names (quotes, apostrophes)
3. **Verify API response** returns correct usernames for each workout
4. **Compare UI card order** with API response order
5. **Test permissions** - try deleting another user's workout

---

## Summary Table

```
Component           | Status    | Issue
--------------------|-----------|------------------------------------------------
Frontend Display    | LIKELY OK | Maybe string escaping issue with special chars
Backend Fetch       | SEEMS OK  | Returns correct user info if lookup succeeds
User Lookup         | PROBABLY OK | Queries by telegram_id, seems correct
URL Parameters      | LIKELY OK | Bot correctly passes user_id and chat_id
Permission Check    | BROKEN    | CRITICAL: Anyone can delete any workout
String Handling     | FRAGILE   | Could break with special characters
HTML Click Handler  | FRAGILE   | Inline handlers hard to debug
```

---

## Bottom Line

The workout display bug is most likely caused by:
1. **Fragile string escaping** in the click handler (exercises with quotes break the function call)
2. **User confusion** about which card they clicked
3. Possibly a **missing security check** allowing users to see/edit other's data

The **REAL problem** is the **missing ownership validation** on edit/delete operations. This is a security vulnerability regardless of the display bug.

