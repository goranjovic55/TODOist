import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  Grid,
  TextField,
  IconButton,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Label as TagIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Task } from '../../stores/tasksSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';

interface TaskDetailsViewProps {
  task: Task;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ task }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [newTag, setNewTag] = useState('');
  const [newComment, setNewComment] = useState('');
  
  const { projects, groups } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Find parent group and project
  const parentGroup = task.parentId ? groups.find(g => g.id === task.parentId) : null;
  const parentProject = parentGroup?.parentId 
    ? projects.find(p => p.id === parentGroup.parentId) 
    : null;
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original task
      setEditedTask(task);
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedTask({ ...editedTask, [name]: value });
  };
  
  const handleSave = () => {
    // In a real app, would dispatch an action to update the task
    // dispatch(updateTask(editedTask));
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    // In a real app, would dispatch an action to delete the task
    // dispatch(deleteTask(task.id));
  };
  
  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...(editedTask.tags || []), newTag.trim()];
      setEditedTask({ ...editedTask, tags: updatedTags });
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (editedTask.tags || []).filter(tag => tag !== tagToRemove);
    setEditedTask({ ...editedTask, tags: updatedTags });
  };
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        createdAt: new Date(),
        userId: 'current-user' // In a real app, would be the actual user ID
      };
      
      const updatedComments = [...(editedTask.comments || []), comment];
      setEditedTask({ ...editedTask, comments: updatedComments });
      setNewComment('');
    }
  };
  
  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'blocked':
        return 'error';
      case 'not_started':
      default:
        return 'default';
    }
  };
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'success';
    }
  };
  
  // Calculate days remaining or overdue
  const getDaysRemaining = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { value: Math.abs(diffDays), label: 'days overdue', color: 'error' };
    } else if (diffDays === 0) {
      return { value: 0, label: 'due today', color: 'warning' };
    } else {
      return { value: diffDays, label: 'days remaining', color: 'primary' };
    }
  };
  
  const daysRemaining = getDaysRemaining();
  
  // Calculate progress
  const progress = task.progress !== undefined ? task.progress : 
    task.status === 'completed' ? 100 : 
    task.status === 'in_progress' ? 50 : 
    task.status === 'not_started' ? 0 : 25;
  
  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          {parentProject && parentGroup && (
            <Typography variant="caption" color="text.secondary">
              {parentProject.name} / {parentGroup.name}
            </Typography>
          )}
          
          {isEditing ? (
            <TextField
              name="title"
              value={editedTask.title}
              onChange={handleInputChange}
              fullWidth
              variant="standard"
              sx={{ mb: 1, fontSize: '1.5rem' }}
            />
          ) : (
            <Typography variant="h5" component="h1">
              {task.title}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={task.status.replace('_', ' ')} 
              color={getStatusColor() as any} 
              size="small" 
            />
            <Chip 
              icon={<FlagIcon />} 
              label={task.priority} 
              color={getPriorityColor() as any} 
              size="small" 
            />
            {task.dueDate && (
              <Chip 
                icon={<DateIcon />} 
                label={format(new Date(task.dueDate), 'MMM d, yyyy')} 
                variant="outlined" 
                size="small" 
              />
            )}
          </Box>
        </Box>
        
        <Box>
          {isEditing ? (
            <>
              <IconButton color="primary" onClick={handleSave}>
                <SaveIcon />
              </IconButton>
              <IconButton color="default" onClick={handleEditToggle}>
                <CancelIcon />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton color="primary" onClick={handleEditToggle}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      
      {task.dueDate && daysRemaining && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={daysRemaining.color as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {progress}% complete
            </Typography>
            <Typography 
              variant="caption" 
              color={`${daysRemaining.color}.main` as any}
            >
              {daysRemaining.value} {daysRemaining.label}
            </Typography>
          </Box>
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Description
          </Typography>
          
          {isEditing ? (
            <TextField
              name="description"
              value={editedTask.description || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Enter task description..."
            />
          ) : (
            <Typography variant="body1">
              {task.description || 'No description provided.'}
            </Typography>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              <CommentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Comments
            </Typography>
            
            {task.comments && task.comments.length > 0 ? (
              <Box>
                {task.comments.map((comment: any) => (
                  <Box key={comment.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle2">
                        User
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 1 }} color="text.secondary">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ pl: 4 }}>
                      {comment.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No comments yet.
              </Typography>
            )}
            
            {isEditing && (
              <Box sx={{ display: 'flex', mt: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              <TimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Dates
            </Typography>
            
            <Typography variant="body2">
              <strong>Created:</strong> {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </Typography>
            {task.updatedAt && (
              <Typography variant="body2">
                <strong>Updated:</strong> {format(new Date(task.updatedAt), 'MMM d, yyyy')}
              </Typography>
            )}
            {task.startDate && (
              <Typography variant="body2">
                <strong>Start Date:</strong> {format(new Date(task.startDate), 'MMM d, yyyy')}
              </Typography>
            )}
            {task.dueDate && (
              <Typography variant="body2">
                <strong>Due Date:</strong> {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              <TagIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Tags
            </Typography>
            
            {task.tags && task.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {isEditing ? (
                  editedTask.tags?.map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      onDelete={() => handleRemoveTag(tag)}
                    />
                  ))
                ) : (
                  task.tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" />
                  ))
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags
              </Typography>
            )}
            
            {isEditing && (
              <Box sx={{ display: 'flex', mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <IconButton 
                  size="small" 
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            )}
          </Box>
          
          {task.attachments && task.attachments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                <LinkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Attachments
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {task.attachments.map((attachment: any) => (
                  <Chip 
                    key={attachment.id} 
                    label={attachment.name} 
                    size="small" 
                    variant="outlined"
                    component="a"
                    href={attachment.url}
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {task.subtasks && task.subtasks.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Subtasks
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {task.subtasks.map((subtask: any) => (
                  <Box key={subtask.id}>
                    <Typography variant="body2">
                      {subtask.status === 'completed' ? '✓' : '○'} {subtask.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TaskDetailsView; 