'use client';

import { format } from 'date-fns';
import { FiClock, FiEdit, FiMove, FiPaperclip, FiUser } from 'react-icons/fi';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignee?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  attachments: Array<{
    _id: string;
    filename: string;
    originalName: string;
    size: number;
  }>;
}

export default function TaskCard({
  task,
  onClick,
  onUpdate,
}: {
  task: Task;
  onClick?: () => void;
  onUpdate?: () => void;
}) {
  const priorityColors = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    Low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div 
      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 relative group"
      style={{ 
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start flex-1">
          <div 
            className="mr-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            title="Drag to move"
          >
            <FiMove size={14} className="text-gray-400" />
          </div>
          <h4 
            className="font-medium text-gray-900 dark:text-white text-sm flex-1 line-clamp-2"
          >
            {task.title}
          </h4>
        </div>
        <div className="flex items-center space-x-1">
          {onClick && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              onMouseDown={(e) => {
                // Stop propagation to prevent drag when clicking edit icon
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                // Stop propagation for touch devices
                e.stopPropagation();
              }}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10 relative cursor-pointer"
              style={{ pointerEvents: 'auto' }}
              title="Edit Task (Click to open)"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick();
                }
              }}
            >
              <FiEdit size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          {task.assignee && (
            <div className="flex items-center">
              <FiUser className="mr-1" size={12} />
              <span className="truncate max-w-[100px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}
          {task.dueDate && (
            <div className={`flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
              <FiClock className="mr-1" size={12} />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center">
              <FiPaperclip className="mr-1" size={12} />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

