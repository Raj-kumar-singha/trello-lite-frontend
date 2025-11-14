"use client";

import { tasksAPI } from "@/api";
import { useEffect, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { FiPlus, FiSearch } from "react-icons/fi";
import CreateTaskModal from "./CreateTaskModal";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  assignee?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    _id: string;
    filename: string;
    originalName: string;
    size: number;
  }>;
  position: number;
}

interface Project {
  _id: string;
  name: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

const statuses: Array<"To Do" | "In Progress" | "Done"> = [
  "To Do",
  "In Progress",
  "Done",
];

export default function KanbanBoard({
  projectId,
  project,
  onProjectUpdate,
}: {
  projectId: string;
  project: Project;
  onProjectUpdate: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterDueDate, setFilterDueDate] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);
  const isDraggingRef = useRef(false);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isDraggingRef.current) {
      fetchTasks();
    }
  }, [projectId, filterAssignee, filterPriority, filterDueDate, searchQuery, mounted]);

  const fetchTasks = async () => {
    // Don't fetch if currently dragging
    if (isDraggingRef.current) {
      return;
    }
    
    try {
      setError("");
      setLoading(true);
      const params: any = { projectId };
      if (filterAssignee) params.assignee = filterAssignee;
      if (filterPriority) params.priority = filterPriority;
      if (filterDueDate) params.dueDate = filterDueDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await tasksAPI.getAll(params);
      const tasksData = response.data;
      setTasks(tasksData);
      tasksRef.current = tasksData;
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch tasks. Please try again.");
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tasks are already filtered by backend, no need for client-side filtering
  const filteredTasks = tasks;

  const getTasksByStatus = (status: string) => {
    return filteredTasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    // Store current tasks in ref to prevent changes during drag
    tasksRef.current = [...tasks];
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      isDraggingRef.current = false;
      return;
    }

    const { draggableId, destination, source } = result;
    
    // Ensure draggableId is a string
    const taskId = String(draggableId);
    
    // Use tasks from ref (snapshot at drag start) to ensure consistency
    const task = tasksRef.current.find((t) => String(t._id) === taskId);
    
    if (!task) {
      console.error('Task not found:', taskId, 'Available tasks:', tasksRef.current.map(t => t._id));
      isDraggingRef.current = false;
      return;
    }

    const isSameColumn = source.droppableId === destination.droppableId;
    const isSamePosition = source.index === destination.index;

    // If same position, no update needed
    if (isSameColumn && isSamePosition) {
      isDraggingRef.current = false;
      return;
    }

    // Optimistically update the UI first
    const newStatus = destination.droppableId as "To Do" | "In Progress" | "Done";
    const newPosition = destination.index;

    // Update local state immediately for better UX
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((t) => {
        if (String(t._id) === taskId) {
          return {
            ...t,
            status: !isSameColumn ? newStatus : t.status,
            position: newPosition,
          };
        }
        return t;
      });
      tasksRef.current = updatedTasks;
      return updatedTasks;
    });

    // Reset dragging flag
    isDraggingRef.current = false;

    try {
      const updateData: any = {
        position: newPosition,
      };

      if (!isSameColumn) {
        updateData.status = newStatus;
      }

      await tasksAPI.update(taskId, updateData);
      // Refresh tasks after successful update to ensure consistency
      setTimeout(() => {
        if (!isDraggingRef.current) {
          fetchTasks();
        }
      }, 500);
    } catch (error: any) {
      // Revert optimistic update on error
      setError(error.response?.data?.message || "Failed to update task. Please try again.");
      console.error("Failed to update task:", error);
      // Refresh to get correct state
      if (!isDraggingRef.current) {
        fetchTasks();
      }
    }
  };

  // Get unique assignees from tasks
  const assignees = Array.from(
    new Set(tasks.filter((t) => t.assignee).map((t) => t.assignee!._id))
  );
  
  // Create a map of assignee IDs to names for quick lookup
  const assigneeMap = new Map<string, string>();
  tasks.forEach((task) => {
    if (task.assignee) {
      assigneeMap.set(task.assignee._id, task.assignee.name);
    }
  });

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchTasks();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">All Assignees</option>
              {project.members.map((member) => {
                const hasTasks = assignees.includes(member._id);
                const assigneeName = assigneeMap.get(member._id) || member.name;
                return (
                  <option key={member._id} value={member._id}>
                    {assigneeName} {hasTasks ? '' : '(No tasks)'}
                  </option>
                );
              })}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="thisWeek">Due This Week</option>
              <option value="upcoming">Upcoming</option>
              <option value="noDate">No Due Date</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <FiPlus className="mr-2" size={18} />
          New Task
        </button>
      </div>

      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragUpdate={() => {
          // Prevent unnecessary re-renders during drag
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statuses.map((status) => (
            <div
              key={status}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {status} ({getTasksByStatus(status).length})
                </h3>
              </div>
              <Droppable droppableId={status}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                  >
                    {getTasksByStatus(status).map((task, index) => {
                      const taskId = String(task._id);
                      return (
                        <Draggable
                          key={taskId}
                          draggableId={taskId}
                          index={index}
                          isDragDisabled={false}
                        >
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 ${
                                snapshot.isDragging ? "opacity-50 shadow-lg rotate-2 z-50" : "cursor-grab active:cursor-grabbing"
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                touchAction: 'none',
                                WebkitTouchCallout: 'none',
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              }}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => {
                                  // Only open modal if not currently dragging
                                  if (!isDraggingRef.current && !snapshot.isDragging) {
                                    setSelectedTask(task);
                                  }
                                }}
                                onUpdate={() => {
                                  if (!isDraggingRef.current) {
                                    fetchTasks();
                                  }
                                }}
                              />
                            </div>
                          );
                        }}
                      </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          project={project}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            if (!isDraggingRef.current) {
              fetchTasks();
            }
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            if (!isDraggingRef.current) {
              fetchTasks();
            }
          }}
        />
      )}
    </div>
  );
}
