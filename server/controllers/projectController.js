const Project = require('../models/Project');

const isOwner = (project, userId) => {
  const ownerId = project.owner._id?.toString() || project.owner.toString();
  return ownerId === userId.toString();
};

const isMemberOrOwner = (project, userId) => {
  const id = userId.toString();
  if (project.owner._id?.toString() === id || project.owner.toString() === id) return true;
  return project.members.some((m) => m.user._id?.toString() === id || m.user.toString() === id);
};

const createProject = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;
    if (!title) return res.status(400).json({ message: 'Project title is required' });
    const project = await Project.create({
      title, description, status, priority, dueDate, tags,
      owner: req.user._id, members: [],
    });
    await project.populate('owner', 'name email');
    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).populate('owner', 'name email').populate('members.user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email').populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMemberOrOwner(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    res.status(200).json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isOwner(project, req.user._id)) return res.status(403).json({ message: 'Only owner can update' });
    const { title, description, status, priority, dueDate, tags } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags;
    await project.save();
    res.status(200).json({ message: 'Project updated', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isOwner(project, req.user._id)) return res.status(403).json({ message: 'Only owner can delete' });
    await project.deleteOne();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isOwner(project, req.user._id)) return res.status(403).json({ message: 'Only owner can add members' });
    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });
    project.members.push({ user: userId, role: role || 'editor' });
    await project.save();
    await project.populate('members.user', 'name email');
    res.status(200).json({ message: 'Member added', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isOwner(project, req.user._id)) return res.status(403).json({ message: 'Only owner can remove members' });
    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();
    res.status(200).json({ message: 'Member removed', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, removeMember };