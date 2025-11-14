"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tasksAPI, commentsAPI, activitiesAPI } from "@/api";
import {
  FiX,
  FiEdit2,
  FiTrash2,
  FiPaperclip,
  FiUser,
  FiClock,
  FiMessageSquare,
  FiSend,
  FiDownload,
} from "react-icons/fi";

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
    url?: string;
    key?: string;
    size: number;
  }>;
}

interface Project {
  _id: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function TaskDetailModal({
  task: initialTask,
  project,
  onClose,
  onUpdate,
}: {
  task: Task;
  project: Project;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");
  const [activities, setActivities] = useState<any[]>([]);

  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    assignee: task.assignee?._id || "",
  });

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [task._id]);

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getByTask(task._id);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getByProject(project._id);
      const taskActivities = response.data.filter(
        (a: any) => a.task?._id === task._id
      );
      setActivities(taskActivities);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editData.title.trim()) {
      setError("Task title is required");
      return;
    }

    if (editData.title.trim().length < 3) {
      setError("Task title must be at least 3 characters");
      return;
    }

    if (editData.title.trim().length > 200) {
      setError("Task title must be less than 200 characters");
      return;
    }

    if (editData.description.trim().length > 1000) {
      setError("Description must be less than 1000 characters");
      return;
    }

    if (
      editData.dueDate &&
      new Date(editData.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
    ) {
      setError("Due date cannot be in the past");
      return;
    }

    setLoading(true);

    try {
      const response = await tasksAPI.update(task._id, {
        title: editData.title.trim(),
        description: editData.description.trim(),
        status: editData.status as any,
        priority: editData.priority as any,
        dueDate: editData.dueDate || undefined,
        assignee: editData.assignee || null, // Send null to unassign, not undefined
      });
      setTask(response.data);
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to update task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasksAPI.delete(task._id);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await commentsAPI.create({
        content: newComment.trim(),
        taskId: task._id,
      });
      setNewComment("");
      fetchComments();
      fetchActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await tasksAPI.uploadAttachment(task._id, file);
      const response = await tasksAPI.getById(task._id);
      setTask(response.data);
      onUpdate();
      // Reset file input
      e.target.value = "";
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await tasksAPI.deleteAttachment(task._id, attachmentId);
      const response = await tasksAPI.getById(task._id);
      setTask(response.data);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete attachment");
    }
  };

  const priorityColors = {
    High: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    Medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    Low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {task.title}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <FiEdit2 size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <FiTrash2 size={20} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "details"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "comments"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "activity"
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Activity
              </button>
            </div>

            {activeTab === "details" && (
              <div className="space-y-6">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={editData.priority}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              priority: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editData.dueDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dueDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assign To
                        </label>
                        <select
                          value={editData.assignee}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              assignee: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Unassigned</option>
                          {project.members.map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({
                            title: task.title,
                            description: task.description,
                            status: task.status,
                            priority: task.priority,
                            dueDate: task.dueDate
                              ? format(new Date(task.dueDate), "yyyy-MM-dd")
                              : "",
                            assignee: task.assignee?._id || "",
                          });
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white font-medium">
                          {task.status}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Priority
                        </label>
                        <p className="mt-1">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              priorityColors[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Assignee
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {task.assignee ? task.assignee.name : "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Due Date
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "MMM d, yyyy")
                            : "No due date"}
                        </p>
                      </div>
                    </div>

                    {task.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Attachments
                      </label>
                      <div className="space-y-2">
                        {task.attachments && task.attachments.length > 0 ? (
                          task.attachments.map((attachment) => (
                            <div
                              key={attachment._id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FiPaperclip
                                  className="text-gray-500 dark:text-gray-400"
                                  size={18}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {attachment.originalName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(attachment.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <a
                                  href={
                                    attachment.url ||
                                    `${process.env.NEXT_PUBLIC_API_URL?.replace(
                                      "/api",
                                      ""
                                    )}/uploads/${attachment.filename}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={attachment.originalName}
                                  className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <FiDownload size={18} />
                                </a>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this attachment?"
                                      )
                                    ) {
                                      handleDeleteAttachment(attachment._id);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No attachments
                          </p>
                        )}
                        <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.mp4,.mov,.avi,.mp3,.wav"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {loading ? "Uploading..." : "+ Add Attachment"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend size={20} />
                  </button>
                </form>

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                            {comment.author.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {comment.author.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format(
                                  new Date(comment.createdAt),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No activity yet
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                        {activity.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(
                            new Date(activity.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
