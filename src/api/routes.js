const express = require('express');
const router = express.Router();
const workoutController = require('./controllers/workoutController');
const groupController = require('./controllers/groupController');

// Workout routes
router.post('/workouts', workoutController.createWorkout);
router.get('/workouts/:userId', workoutController.getUserWorkouts);
router.get('/workouts/group/:groupId', workoutController.getGroupWorkouts);
router.put('/workouts/:workoutId', workoutController.updateWorkout);
router.delete('/workouts/:workoutId', workoutController.deleteWorkout);

// Group routes
router.get('/groups/:groupId/members', groupController.getGroupMembers);
router.get('/groups/:groupId/workouts/:date', groupController.getGroupWorkoutsByDate);

module.exports = router;
