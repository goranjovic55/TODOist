import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { getWorkloadByAssignee } from '../../utils/taskStatsUtils';
import { WorkloadItem } from '../../types/task';

/**
 * Interface for team statistics
 */
interface TeamStats {
  memberCount: number;
  averageTasksPerMember: number;
  mostLoadedMember: { name: string; count: number };
}

/**
 * Component for visualizing workload distribution across team members
 */
const TaskWorkloadDistribution: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);

  // Calculate workload distribution
  const workloadData = useMemo(() => {
    return getWorkloadByAssignee(tasks);
  }, [tasks]);

  // Calculate team stats
  const teamStats = useMemo((): TeamStats => {
    const stats: TeamStats = {
      memberCount: workloadData.length - (workloadData.some((d: WorkloadItem) => d.assignee === 'Unassigned') ? 1 : 0),
      averageTasksPerMember: 0,
      mostLoadedMember: { name: '', count: 0 }
    };

    if (stats.memberCount > 0) {
      const totalAssignedTasks = workloadData.reduce((sum: number, item: WorkloadItem) => 
        item.assignee !== 'Unassigned' ? sum + item.total : sum, 0);
      
      stats.averageTasksPerMember = Math.round(totalAssignedTasks / stats.memberCount * 10) / 10;
      
      const mostLoaded = workloadData
        .filter((item: WorkloadItem) => item.assignee !== 'Unassigned')
        .reduce((max: WorkloadItem, current: WorkloadItem) => current.total > max.total ? current : max, 
          { assignee: '', total: 0, pending: 0, completed: 0 });
      
      stats.mostLoadedMember = { name: mostLoaded.assignee, count: mostLoaded.total };
    }

    return stats;
  }, [workloadData]);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Workload Distribution
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Team Members
              </Typography>
              <Typography variant="h5" align="center">
                {teamStats.memberCount}
              </Typography>
              
              {teamStats.memberCount > 0 && (
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                  <AvatarGroup max={5}>
                    {workloadData
                      .filter((item: WorkloadItem) => item.assignee !== 'Unassigned')
                      .map((item: WorkloadItem) => (
                        <Avatar 
                          key={item.assignee} 
                          alt={item.assignee}
                          sx={{ 
                            bgcolor: `hsl(${item.assignee.charCodeAt(0) * 10}, 70%, 50%)` 
                          }}
                        >
                          {item.assignee.charAt(0).toUpperCase()}
                        </Avatar>
                      ))
                    }
                  </AvatarGroup>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg. Tasks Per Member
              </Typography>
              <Typography variant="h5" align="center">
                {teamStats.averageTasksPerMember}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Most Workload
              </Typography>
              <Typography variant="h5" align="center">
                {teamStats.mostLoadedMember.name || 'N/A'}
              </Typography>
              {teamStats.mostLoadedMember.name && (
                <Chip 
                  size="small" 
                  label={`${teamStats.mostLoadedMember.count} tasks`}
                  color="primary"
                  sx={{ mt: 1, display: 'block', mx: 'auto' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ height: 300 }}>
        {workloadData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={workloadData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="assignee" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill="#8884d8" name="Pending" />
              <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No assignment data available
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TaskWorkloadDistribution; 