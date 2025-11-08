# Visual Flow Diagrams - Group Workout Display

## Complete Data Flow

```
TELEGRAM BOT
├─ User clicks "Open Spot Buddy"
└─ Mini-app URL: /mini-app?user_id={telegramId}&chat_id={groupId}

MINI-APP LOADS
├─ Parse URL: userId=987654321, chatId=1234567890
├─ Store in: const userId, const chatId
└─ Render calendar

USER CLICKS DATE ON CALENDAR (e.g., Nov 8)
│
├─ Event: btn.addEventListener('click', () => showDayDetails('2024-11-08'))
│
└─ showDayDetails('2024-11-08'):
   │
   ├─ Fetch: GET /api/groups/1234567890/workouts/2024-11-08
   │
   ├─ BACKEND PROCESSING:
   │  ├─ Get group members: SELECT user_id FROM group_members WHERE group_id=1234567890
   │  │  └─ Result: [987654321, 555555555]
   │  │
   │  ├─ Get workouts for those users on that date:
   │  │  └─ SELECT * FROM workouts 
   │  │     WHERE user_id IN (987654321, 555555555)
   │  │     AND date BETWEEN '2024-11-08 00:00:00' AND '2024-11-08 23:59:59'
   │  │  └─ Result:
   │  │     ├─ Workout ID 123: user_id=987654321, mood='😍', exercises=[...], notes="..."
   │  │     └─ Workout ID 124: user_id=555555555, mood='😌', exercises=[...], notes="..."
   │  │
   │  └─ For each workout, look up user:
   │     ├─ SELECT username, telegram_id FROM users WHERE telegram_id=987654321
   │     │  └─ Result: { username: 'john_doe', telegram_id: 987654321 }
   │     │
   │     └─ SELECT username, telegram_id FROM users WHERE telegram_id=555555555
   │        └─ Result: { username: 'jane_smith', telegram_id: 555555555 }
   │
   ├─ RESPONSE to Frontend:
   │  └─ [
   │       {
   │         id: 123,
   │         user_id: 987654321,
   │         exercises: [{ name: "Bench Press", sets: 3, reps: 8 }],
   │         mood: "😍",
   │         notes: "Feeling strong!",
   │         users: { username: 'john_doe', telegram_id: 987654321 }
   │       },
   │       {
   │         id: 124,
   │         user_id: 555555555,
   │         exercises: [{ name: "Squats", sets: 4, reps: 10 }],
   │         mood: "😌",
   │         notes: "Good session",
   │         users: { username: 'jane_smith', telegram_id: 555555555 }
   │       }
   │     ]
   │
   └─ FRONTEND RENDERING:
      │
      ├─ For each workout in response, extract data:
      │  ├─ workout.users.username = 'john_doe'
      │  ├─ exercises = [{ name: "Bench Press", ... }]
      │  ├─ mood = '😍'
      │  └─ notes = "Feeling strong!"
      │
      ├─ Stringify exercises: '[{"name":"Bench Press",...}]'
      │
      ├─ Escape quotes: '[{"name":"Bench Press",...}]' (replace " with &quot;)
      │
      ├─ Generate HTML with inline onclick:
      │  └─ onclick="showWorkoutDetails('john_doe', '[{"name":"Bench Press",...}]', '😍', 'Feeling strong!', 123)"
      │
      └─ Render to page:
         │
         ├─ ┌─────────────────────┐
         │  │ john_doe            │
         │  │ 😍                  │
         │  │ Click to view       │ ← USER CLICKS HERE
         │  │ details             │
         │  └─────────────────────┘
         │
         └─ ┌─────────────────────┐
            │ jane_smith          │
            │ 😌                  │
            │ Click to view       │ ← OR USER MIGHT CLICK HERE
            │ details             │
            └─────────────────────┘

USER CLICKS ON 'jane_smith' CARD
│
├─ Browser executes onclick code:
│  └─ showWorkoutDetails('jane_smith', '[{"name":"Squats",...}]', '😌', 'Good session', 124)
│
├─ Function receives:
│  ├─ username = 'jane_smith'
│  ├─ exercises = '[{"name":"Squats",...}]' (JSON string)
│  ├─ mood = '😌'
│  ├─ notes = 'Good session'
│  └─ workoutId = 124
│
├─ Store for later:
│  └─ currentViewingWorkout = { username, exercises, mood, notes, workoutId: 124 }
│
├─ Parse exercises JSON:
│  └─ [{ name: 'Squats', sets: 4, reps: 10 }]
│
└─ Display modal:
   │
   ├─ Set title: "jane_smith"
   │
   ├─ Set content:
   │  ├─ Exercise: Squats (Sets: 4, Reps: 10)
   │  ├─ Mood: 😌
   │  └─ Notes: Good session
   │
   └─ Show modal

USER CLICKS "EDIT" IN MODAL
│
├─ Call: openEditModal()
│
├─ Uses: currentViewingWorkout (which has workoutId: 124)
│
└─ Opens edit form

USER CLICKS "SAVE" IN EDIT
│
├─ Collect edited data
│
├─ Send: PUT /api/workouts/124
│     with: { exercises, mood, notes }
│
├─ Backend:
│  └─ UPDATE workouts SET exercises=?, mood=?, notes=? WHERE id=124
│      ⚠️ NO CHECK THAT THIS USER OWNS WORKOUT 124!
│
└─ Update modal

USER CLICKS "DELETE" IN MODAL
│
├─ Confirm dialog
│
├─ Send: DELETE /api/workouts/124
│
├─ Backend:
│  └─ DELETE FROM workouts WHERE id=124
│      ⚠️ NO CHECK THAT THIS USER OWNS WORKOUT 124!
│      ⚠️ john_doe'S WORKOUT JUST GOT DELETED BY jane_smith!
│
└─ Close modal
```

---

## The Bug Manifestation Paths

### Path 1: Special Characters in Exercise Names (MOST LIKELY)

```
Exercise Name Input: "Leg Press's"
                      ↓
JSON.stringify():    '[{"name":"Leg Press's"}]'
                      ↓
.replace(/"/g, '&quot;'):  '[{"name":"Leg Press's"}]'
                      ↓
HTML onclick attribute:
   onclick="showWorkoutDetails('user', '[{"name":"Leg Press's"}]', ...)"
                      ↓
Browser Parsing:
   onclick="showWorkoutDetails('user', '[{"name":"Leg Press'
   ...rest is parsed as new instruction
                      ↓
JavaScript Error:     SyntaxError: Unexpected token '
                      ↓
Function Call:        NEVER EXECUTES
                      ↓
Browser Fallback:     Shows previously loaded content OR wrong workout
```

### Path 2: UI Card Order Doesn't Match Response Order

```
Backend API returns:
[
  { id: 123, users: { username: 'john_doe' }, ... },
  { id: 124, users: { username: 'jane_smith' }, ... }
]
        ↓
Frontend renders in different order (maybe sorted alphabetically):
[
  { id: 124, users: { username: 'jane_smith' }, ... },
  { id: 123, users: { username: 'john_doe' }, ... }
]
        ↓
User sees: jane_smith card, john_doe card
        ↓
User INTENDS to click jane_smith's card
User ACTUALLY clicks the card position where john_doe is rendered
        ↓
john_doe's workout modal opens
        ↓
User thinks: "Wrong workout displayed!"
```

### Path 3: User Confusion (Most Innocent)

```
User logs into app and sees calendar
        ↓
Calendar shows colored circles for people with workouts
        ↓
User clicks on RED circle (thinking it's groupmate)
        ↓
RED circle = User's own color assignment
        ↓
User's own workout displays
        ↓
User: "Why is my workout showing? I clicked on [groupmate]'s circle!"
```

### Path 4: Missing Ownership Validation (SECURITY BUG)

```
john_doe's workout:  { id: 123, user_id: 987654321, ... }
jane_smith's app:    Opens user_id: 555555555

jane_smith clicks on john_doe's workout
        ↓
Shows: john_doe's details (CORRECT)
        ↓
jane_smith clicks "Delete"
        ↓
Frontend sends: DELETE /api/workouts/123
        ↓
Backend receives workoutId: 123
        ↓
Backend checks: DELETE WHERE id=123
        ↓
⚠️  NO CHECK THAT workout.user_id == current_user_id
        ↓
john_doe's workout DELETED
```

---

## State Diagram: Workout Display States

```
                    ┌─────────────────┐
                    │  CALENDAR VIEW  │
                    │ (Day selected)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ FETCH WORKOUTS  │
                    │ FOR THAT DATE   │
                    └────────┬────────┘
                             │
                    ┌────────▼─────────┐
                    │ RENDER WORKOUT   │
                    │ CARDS (HTML)     │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │ CARD 1    │    │ CARD 2      │    │ CARD N      │
    │ (john)    │    │ (jane)      │    │ (other)     │
    └────┬──────┘    └──────┬──────┘    └──────┬──────┘
         │                  │                   │
    USER CLICKS ON CARD 2 (jane_smith)
         │                  │                   │
    ┌────────────────────────▼──────────────────────────┐
    │ showWorkoutDetails() CALLED                       │
    │ ✓ username = 'jane_smith'                         │
    │ ✓ exercises = '[...]'                             │
    │ ✓ workoutId = 124                                 │
    └────────────────────────┬──────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ MODAL DISPLAYED │
                    │ (jane's workout)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │ EDIT      │    │ DELETE      │    │ CLOSE       │
    └────┬──────┘    └──────┬──────┘    └──────┬──────┘
         │                  │                   │
         │           ⚠️ BUG HERE              │
         │     Backend doesn't check         │
         │     if user owns workout!         │
         │                                   │
    ┌────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │ EDIT PAGE │    │ WORKOUT     │    │ CALENDAR    │
    │ (can edit │    │ DELETED     │    │ (refresh)   │
    │  others!) │    │ (security!) │    │             │
    └───────────┘    └─────────────┘    └─────────────┘
```

---

## Data Type Flow

```
API Response (JSON):
{
  id: 123,                                    ← number
  user_id: 987654321,                         ← number
  exercises: [                                ← Array
    {
      name: "Bench Press",                    ← string
      sets: 3,                                ← number
      reps: 8,                                ← number
      duration: 0                             ← number
    }
  ],
  mood: "😍",                                 ← emoji string
  notes: "Feeling strong!",                   ← string (can have quotes!)
  users: {
    username: "john_doe",                     ← string
    telegram_id: 987654321                    ← number
  }
}

FRONTEND PROCESSING:
exercises = Array → JSON.stringify() → string: '[{"name":"Bench Press",...}]'
                                        ↓
                                    .replace(/"/g, '&quot;')
                                        ↓
                                    '[{"name":"Bench Press",...}]'
                                        ↓
                                    Embedded in HTML attribute
                                        ↓
                    onclick="showWorkoutDetails('john_doe', '[...]', ...)"

PARSING IN JAVASCRIPT:
onclick event fires → function call:
  showWorkoutDetails(
    'john_doe',                     ← string parameter
    '[{"name":"Bench Press",...}]', ← string (JSON), needs parsing
    '😍',                           ← string parameter
    'Feeling strong!',              ← string parameter
    123                             ← number parameter
  )

INSIDE showWorkoutDetails():
exercises_param = '[{"name":"Bench Press",...}]'
  → JSON.parse(exercises_param)
    → Array: [{ name: "Bench Press", ... }]
      → Used in template literals for display
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    HTML/CSS/JS                             │ │
│  │                                                            │ │
│  │  <button onclick="showWorkoutDetails(...)" >              │ │
│  │    jane_smith workout card                                │ │
│  │  </button>                                                │ │
│  │                                                            │ │
│  │  <script>                                                 │ │
│  │    let currentViewingWorkout = null;                      │ │
│  │    function showWorkoutDetails(u, e, m, n, id) { ... }   │ │
│  │    function deleteWorkout(id) { ... }                    │ │
│  │  </script>                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            │ fetch()                             │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Network / HTTP Requests                       │ │
│  │                                                            │ │
│  │  GET /api/groups/1234567890/workouts/2024-11-08          │ │
│  │  DELETE /api/workouts/124                                 │ │
│  │  PUT /api/workouts/124                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NODE.JS SERVER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Express Router:                                                 │
│  GET  /api/groups/:groupId/workouts/:date                       │
│  PUT  /api/workouts/:workoutId                                  │
│  DELETE /api/workouts/:workoutId                                │
│                          │                                       │
│  ┌──────────────────────┼────────────────────────────────────┐ │
│  │                      ▼                                    │ │
│  │  groupController.getGroupWorkoutsByDate():                │ │
│  │    1. Get group members from DB                           │ │
│  │    2. Get workouts for those members & date              │ │
│  │    3. Look up username for each workout                  │ │
│  │    4. Return: [{ ... users: {...} }, ...]                │ │
│  │                                                           │ │
│  │  workoutController.deleteWorkout():                       │ │
│  │    ⚠️  NO OWNERSHIP CHECK                                │ │
│  │    1. Receive workoutId                                  │ │
│  │    2. DELETE FROM workouts WHERE id=workoutId            │ │
│  │    3. ANYONE CAN DELETE ANY WORKOUT                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌──────────────────────┼────────────────────────────────────┐ │
│  │                      ▼                                    │ │
│  │           Supabase PostgreSQL                             │ │
│  │                                                           │ │
│  │  Tables:                                                  │ │
│  │  - users (id, username, telegram_id)                      │ │
│  │  - workouts (id, user_id, exercises, mood, notes, ...)   │ │
│  │  - group_members (group_id, user_id)                     │ │
│  │  - groups (id, title, ...)                               │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

