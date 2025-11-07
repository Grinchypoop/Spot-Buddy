# Spot Buddy - Architecture & Data Flow

## System Overview

```
User (Telegram)
    ↓
Telegram Bot (Telegraf)
    ↓
Node.js Express Server
    ↓
Mini App (HTML/CSS/JS)
    ↓
REST API
    ↓
Supabase PostgreSQL Database
```

## Component Details

### 1. Telegram Bot (`src/bot/telegram.js`)

**Responsibilities:**
- Listen to `/start` command in groups
- Create inline keyboard with mini app buttons
- Handle web app callbacks
- Save user and group information

**Flow:**
```
User adds bot to group
    ↓
User sends /start
    ↓
Bot checks if it's a group chat
    ↓
Bot saves user & group to database
    ↓
Bot displays inline buttons with mini app links
    ↓
User clicks button → Mini app opens
```

### 2. Express Server (`src/index.js`)

**Responsibilities:**
- Serve the mini app
- Route API requests
- Handle static files
- Manage middleware (CORS, body parsing)

**Endpoints:**
- `GET /mini-app` - Serve the web app
- `GET /health` - Health check
- `/api/*` - All API routes

### 3. Mini App Frontend (`public/mini-app/`)

**Files:**
- `index.html` - Structure (2 tabs: Workout & Streaks)
- `styles.css` - Styling (mobile-optimized)
- `app.js` - Logic & API calls

**Tabs:**

#### Tab 1: Log Workout
```
┌─────────────────────────┐
│ 💪 Log Workout Tab      │
├─────────────────────────┤
│ Exercises Section       │
│ ├─ Exercise name        │
│ ├─ Sets/Reps/Duration   │
│ └─ [+ Add Exercise]     │
├─────────────────────────┤
│ Mood Selection          │
│ 😫 😔 😐 😊 🔥        │
├─────────────────────────┤
│ Notes (Optional)        │
│ [Text area]             │
├─────────────────────────┤
│ [Save Workout Button]   │
└─────────────────────────┘
```

#### Tab 2: Streaks Calendar
```
┌──────────────────────────┐
│ 📊 Streaks Tab           │
├──────────────────────────┤
│ ◀ November 2024 ▶        │
├──────────────────────────┤
│ Calendar Grid (7x6)      │
│ Sun Mon Tue Wed ...      │
│  1   2   3   4  ...      │
│ [29] [30]                │
├──────────────────────────┤
│ Selected Day Details     │
│ @user1's Workouts:       │
│ • Exercise: 3x10 (15min) │
│ • Exercise: 2x5          │
│ 😊 Mood                 │
│ "Notes about workout"   │
└──────────────────────────┘
```

### 4. API Controllers (`src/api/controllers/`)

#### WorkoutController
- `createWorkout(user_id, group_id, exercises, mood, notes, timezone)`
- `getUserWorkouts(userId, groupId?)`
- `getGroupWorkouts(groupId, month?, year?)`
- `updateWorkout(workoutId, ...)`
- `deleteWorkout(workoutId)`

#### GroupController
- `getGroupMembers(groupId)`
- `getGroupWorkoutsByDate(groupId, date)`

### 5. Database Schema (`src/db/schema.sql`)

```sql
┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ id (PK)             │
│ telegram_id (UK)    │
│ username            │
│ created_at          │
│ updated_at          │
└──────┬──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│  GROUP_MEMBERS      │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ group_id (FK)       │
│ joined_at           │
└──────┬──────────────┘
       │
       │ N:1
       │
┌──────▼──────────────┐
│      GROUPS         │
├─────────────────────┤
│ id (PK)             │
│ telegram_chat_id    │
│ title               │
│ created_at          │
│ updated_at          │
└──────┬──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│     WORKOUTS        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ group_id (FK)       │
│ exercises (JSONB)   │
│ mood                │
│ notes               │
│ timezone            │
│ date                │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## Data Flow Examples

### Example 1: Logging a Workout

```
User clicks "Log Workout"
    ↓
Mini app opens with parameters:
  - user_id (from URL)
  - group_id (from URL)
    ↓
User fills form:
  - Exercise: Pullups 3×10 (15 min)
  - Exercise: Pushups 2×15
  - Mood: 🔥 (amazing)
  - Notes: "Great pump!"
    ↓
User clicks "Save Workout"
    ↓
JavaScript collects form data:
  {
    user_id: 123456,
    group_id: -789012,
    exercises: [
      { name: "Pullups", sets: 3, reps: 10, duration: 15 },
      { name: "Pushups", sets: 2, reps: 15, duration: null }
    ],
    mood: "amazing",
    notes: "Great pump!",
    timezone: "America/New_York"
  }
    ↓
POST /api/workouts
    ↓
Database saves workout:
  - Converts exercises to JSON
  - Saves with current timestamp
  - Associates with user & group
    ↓
Success response returned
    ↓
Mini app shows "Workout saved!"
    ↓
Form resets
```

### Example 2: Viewing Calendar

```
User clicks "View Streaks"
    ↓
Mini app switches to Streaks tab
    ↓
JavaScript renders calendar for current month
    ↓
GET /api/workouts/group/{groupId}?month=11&year=2024
    ↓
Backend queries Supabase:
  SELECT * FROM workouts
  WHERE group_id = {groupId}
  AND date BETWEEN {start} AND {end}
    ↓
Supabase returns all workouts for:
  - Current user
  - All group members
  - In current month
    ↓
JavaScript builds date map:
  {
    "Tue Nov 05 2024": [
      { user: "john", exercises: [...], mood: "🔥" },
      { user: "jane", exercises: [...], mood: "😊" }
    ],
    ...
  }
    ↓
Calendar renders:
  - Days with workouts highlighted
  - Days without workouts normal
  - Click date to see details
    ↓
User clicks day 5
    ↓
Details panel shows:
  @john:
  • Pullups: 3×10
  • Pushups: 2×15
  🔥

  @jane:
  • Squats: 3×12
  • Deadlift: 1×5
  😊
```

### Example 3: Cross-Group Visibility

```
Scenario:
- User A is in Group 1 and Group 2
- Friend B is in Group 1 only

Timeline:
1. User A logs workout in Group 1
   ✓ Visible in Group 1 calendar
   ✓ Visible in Group 2 calendar (A is member)

2. Friend B logs workout in Group 1
   ✓ Visible in Group 1 calendar
   ✗ NOT visible in Group 2 (B not a member)

3. User A views streaks in Group 1
   - Sees A's workouts
   - Sees B's workouts
   - Sees only Group 1 members' workouts

4. User A views streaks in Group 2
   - Sees A's workouts
   - Doesn't see B's workouts (not a member)
   - Sees only Group 2 members' workouts
```

## Key Features

### 1. Cross-Group Sync
- Same workouts appear in all groups user is in
- Avoids duplicate logging

### 2. Group-Based Privacy
- Only see workouts from people in the same group
- Friend's workouts only visible if in shared group

### 3. Timezone Awareness
- Each workout stores user's timezone
- Calendar adjusted to user's local time

### 4. Edit/Delete Support
- Users can modify or remove past workouts
- Updates reflected immediately in calendar

### 5. Minimalistic Design
- Mobile-optimized
- Fast loading
- Simple UI following Telegram design

## Security Considerations

### Current Implementation
- Row Level Security (RLS) enabled on all tables
- Basic policies allow all operations (can be restricted)

### Recommended Improvements
- Implement user authentication
- Add RLS policies to restrict data access
- Validate user ownership of workouts before update/delete
- Rate limiting on API endpoints
- Input validation on all fields

## Performance

### Optimizations
- Database indexes on frequently queried columns
  - `idx_workouts_user_id`
  - `idx_workouts_group_id`
  - `idx_workouts_date`
  - `idx_group_members_user_id`
  - `idx_group_members_group_id`

- JSON storage for flexible exercise data
- Efficient calendar queries with date ranges

### Future Improvements
- Caching with Redis
- Query optimization for large groups
- Pagination for historical data
- Image upload support

## Deployment Architecture

### Development
```
Local Machine
├── Node.js Server (port 3000)
├── ngrok (exposes to internet)
└── Telegram API → ngrok webhook
```

### Production (Azure)
```
GitHub Repository
    ↓
Azure App Service
├── Node.js Runtime
├── Environment Variables
└── Auto-deploy on push
    ↓
Telegram API → Azure webhook
    ↓
Supabase (Cloud Database)
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| TELEGRAM_BOT_TOKEN | Bot authentication | `123456:ABC-DEF1234` |
| SUPABASE_URL | Database URL | `https://xxx.supabase.co` |
| SUPABASE_KEY | Database key | `eyJhbGc...` |
| PORT | Server port | `3000` |
| NODE_ENV | Environment | `development` or `production` |
| MINI_APP_URL | Mini app URL | `https://abc.ngrok.io` |

## Error Handling

### Bot Errors
- Caught in bot.catch() handler
- Logged to console
- Won't crash server

### API Errors
- Try-catch in each controller
- Returns HTTP error codes
- Descriptive error messages

### Database Errors
- Caught and logged
- Client gets error response
- Transaction rollback (if applicable)

---

For more details, see README.md and QUICKSTART.md
