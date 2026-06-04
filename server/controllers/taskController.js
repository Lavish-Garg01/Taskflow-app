const Task = require('../models/Task');
const Project = require('../models/Project');

const hasProjectAccess = (project, userId) => {
  const id = userId.toString();
  if (project.owner.toString() === id) return true;
  return project.members.some((m) => m.user.toString() === id);
};

const isProjectOwner = (project, userId) =>
  project.owner.toString() === userId.toString();

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, projectId, assignedTo, dueDate, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });
    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!hasProjectAccess(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    const task = await Task.create({
      title, description, status, priority,
      project: projectId, createdBy: req.user._id,
      assignedTo: assignedTo || null, dueDate: dueDate || null, tags,
    });
    await task.populate('createdBy', 'name email');
    await task.populate('assignedTo', 'name email');
    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!hasProjectAccess(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('createdBy', 'name email').populate('assignedTo', 'name email').sort({ createdAt: -1 });
    const grouped = {
      todo: tasks.filter((t) => t.status === 'todo'),
      'in-progress': tasks.filter((t) => t.status === 'in-progress'),
      review: tasks.filter((t) => t.status === 'review'),
      completed: tasks.filter((t) => t.status === 'completed'),
    };
    res.status(200).json({ count: tasks.length, tasks, grouped });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'title status').populate('createdBy', 'name email').sort({ dueDate: 1 });
    res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email').populate('assignedTo', 'name email')
      .populate('comments.user', 'name email').populate('project', 'title owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!hasProjectAccess(task.project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!hasProjectAccess(task.project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    await task.save();
    res.status(200).json({ message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isOwner = isProjectOwner(task.project, req.user._id);
    if (!isCreator && !isOwner) return res.status(403).json({ message: 'Not authorized' });
    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });
    const task = await Task.findById(req.params.id).populate('project', 'owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!hasProjectAccess(task.project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    task.comments.push({ user: req.user._id, text });
    await task.save();
    await task.populate('comments.user', 'name email');
    res.status(201).json({ message: 'Comment added', comments: task.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    comment.deleteOne();
    await task.save();
    res.status(200).json({ message: 'Comment deleted', comments: task.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTask, getTasksByProject, getMyTasks, getTaskById, updateTask, deleteTask, addComment, deleteComment };