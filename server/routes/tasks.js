const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createTask,
  getTasksByProject,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
} = require('../controllers/taskController');

router.use(protect);

router.post('/', createTask);
router.get('/my', getMyTasks);
router.get('/project/:projectId', getTasksByProject);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;