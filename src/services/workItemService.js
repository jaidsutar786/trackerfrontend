import { issueService } from './issueService';
import API from './api';

export const workItemService = {
  // Get all work items (issues + tasks) assigned to current user
  getMyWorkItems: async (currentUser) => {
    try {
      const [issuesRes, tasksRes] = await Promise.all([
        issueService.getAll({ page_size: 1000 }), // Get all issues without pagination limit
        API.get('/projects/tasks/my-tasks/') // Get tasks from projects endpoint
      ]);
      
      console.log('🔍 Current user passed:', currentUser);
      console.log('📋 Full issues response:', issuesRes);
      console.log('📋 Full tasks response:', tasksRes);
      
      if (!currentUser?.id) {
        console.warn('⚠️ No current user provided, returning empty array');
        return { data: [] };
      }
      
      // Handle paginated response - check if data is in results field
      const allIssues = issuesRes.data?.results || issuesRes.data || [];
      const allTasks = tasksRes.data || [];
      
      console.log('📋 Extracted issues:', allIssues);
      console.log('📋 Extracted tasks:', allTasks);
      
      let assignedIssues;
      let assignedTasks;
      
      if (currentUser.role === 'admin') {
        // Admin sees ALL issues (no filtering)
        assignedIssues = allIssues;
        console.log('👑 Admin: Showing ALL issues');
      } else if (currentUser.role === 'manager') {
        // Manager sees ALL issues in their projects (no filtering by assignee)
        assignedIssues = allIssues;
        console.log('👨💼 Manager: Showing ALL issues in assigned projects');
      } else if (currentUser.role === 'qa_tester') {
        // QA Tester sees ALL issues in their projects (no filtering by assignee)
        // But for CHARTS, they might want to see only assigned issues
        // This depends on the dashboard context - keeping all for now
        assignedIssues = allIssues;
        console.log('🧪 QA Tester: Showing ALL issues in assigned projects');
      } else {
        // Other roles: Filter issues assigned to current user
        assignedIssues = allIssues.filter(issue => {
          const isAssigned = issue.assignee?.id === currentUser.id;
          console.log(`Issue ${issue.id} (${issue.title}): assignee=${issue.assignee?.id}, user=${currentUser.id}, assigned=${isAssigned}`);
          return isAssigned;
        });
        console.log('👨💼 Employee: Showing only assigned issues');
      }
      
      // For tasks: Admin and Manager see all tasks, others see only assigned
      if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        assignedTasks = allTasks;
        console.log('👑 Admin/Manager: Showing ALL tasks');
      } else {
        assignedTasks = allTasks.filter(task => {
          const isAssigned = task.assignee?.id === currentUser.id;
          console.log(`Task ${task.id} (${task.title}): assignee=${task.assignee?.id}, user=${currentUser.id}, assigned=${isAssigned}`);
          return isAssigned;
        });
        console.log('👨💼 Employee/QA: Showing only assigned tasks');
      }
      
      console.log('✅ Filtered issues:', assignedIssues);
      console.log('📝 Filtered tasks:', assignedTasks);
      
      // Add type identifier and unique keys to distinguish between issues and tasks
      // Note: For tasks array, preserve existing itemType (e.g., 'subtask') if present
      const issues = assignedIssues.map(item => ({ ...item, itemType: 'issue', uniqueId: `issue-${item.id}` }));
      const tasks = assignedTasks.map(item => ({ 
        ...item, 
        itemType: item.itemType || 'task',  // Preserve existing itemType (e.g., 'subtask'), default to 'task'
        uniqueId: item.itemType === 'subtask' ? `subtask-${item.id}` : `task-${item.id}`
      }));
      
      // Combine and sort by updated_at (most recently updated first)
      const allItems = [...issues, ...tasks].sort((a, b) => 
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
      
      console.log('🎯 Final combined items:', allItems);
      
      return { data: allItems };
    } catch (error) {
      console.error('Error fetching work items:', error);
      return { data: [] };
    }
  },
  
  // Update work item status (handles issues, tasks, and subtasks)
  updateStatus: async (itemId, status, itemType = 'issue') => {
    if (itemType === 'task') {
      // Find the task to get project_id and task_id
      const tasksRes = await API.get('/projects/tasks/my-tasks/');
      const task = tasksRes.data.find(t => t.id === itemId);
      if (task) {
        return API.patch(`/projects/${task.project}/tasks/${task.task_id}/`, { status });
      }
      throw new Error('Task not found');
    } else if (itemType === 'subtask') {
      // Update subtask directly
      return API.patch(`/projects/subtasks/${itemId}/`, { status });
    } else {
      return issueService.update(itemId, { status });
    }
  },
  
  // Add comment (handles issues, tasks, and subtasks)
  addComment: async (itemId, text, itemType = 'issue') => {
    if (itemType === 'task') {
      // Find the task to get project_id and task_id
      const tasksRes = await API.get('/projects/tasks/my-tasks/');
      const task = tasksRes.data.find(t => t.id === itemId);
      if (task) {
        return API.post(`/projects/${task.project}/tasks/${task.task_id}/comments/`, { text });
      }
      throw new Error('Task not found');
    } else if (itemType === 'subtask') {
      // For subtasks, post comment to the parent task
      const tasksRes = await API.get('/projects/tasks/my-tasks/');
      const subtask = tasksRes.data.find(t => t.id === itemId && t.itemType === 'subtask');
      if (subtask && subtask.project && subtask.task_id) {
        return API.post(`/projects/${subtask.project}/tasks/${subtask.task_id}/comments/`, { text });
      }
      throw new Error('Subtask or parent task not found');
    } else {
      return issueService.addComment(itemId, text);
    }
  }
};