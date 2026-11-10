import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity payload'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members = [] } = _input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Invalid team payload'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
  if (memberCount !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = user.fitnessGoal || recentActivity?.type;
  const workouts = await Workout.find(focus ? { focus } : {}).lean();
  const activityContext = recentActivity ? ` after your recent ${recentActivity.type} activity` : '';

  return workouts.map((workout) => ({
    ...workout,
    reason: `Recommended for your ${workout.focus} goal${activityContext}.`,
  }));
}

export { User };
