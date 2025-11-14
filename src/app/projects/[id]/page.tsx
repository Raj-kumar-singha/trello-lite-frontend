"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import KanbanBoard from "@/components/KanbanBoard";
import { projectsAPI } from "@/api";
import { FiArrowLeft, FiSettings, FiUsers } from "react-icons/fi";

export const dynamic = "force-dynamic";

interface Project {
  _id: string;
  name: string;
  description: string;
  color: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

export default function ProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      setError("");
      if (!projectId) {
        setError("Invalid project ID");
        setTimeout(() => router.push("/dashboard"), 2000);
        return;
      }
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);
    } catch (error: any) {
      console.error("Failed to fetch project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load project";
      setError(errorMessage);

      if (
        error.response?.status === 404 ||
        error.response?.status === 403 ||
        error.response?.status === 400
      ) {
        // Project not found, access denied, or invalid ID - redirect to dashboard after showing error
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!project && !loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              {error ? (
                <>
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Redirecting to dashboard...
                  </p>
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Project not found
                </p>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return null;
  }

  const isOwner = project.owner._id === user?.id;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                {isOwner && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full">
                    Owner
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <FiUsers className="mr-2" size={18} />
                Members ({project.members.length})
              </button>
              {isOwner && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FiSettings className="mr-2" size={18} />
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>

        <KanbanBoard
          projectId={projectId}
          project={project}
          onProjectUpdate={fetchProject}
        />

        {showSettings && (
          <ProjectSettingsModal
            project={project}
            onClose={() => setShowSettings(false)}
            onUpdate={fetchProject}
          />
        )}
      </div>
    </Layout>
  );
}

function ProjectSettingsModal({
  project,
  onClose,
  onUpdate,
}: {
  project: Project;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"settings" | "members">(
    "settings"
  );
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [color, setColor] = useState(project.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isOwner = project.owner._id === user?.id;

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
  ];

  useEffect(() => {
    if (activeTab === "members" && searchQuery) {
      searchUsers();
    }
  }, [searchQuery, activeTab]);

  const searchUsers = async () => {
    try {
      const { usersAPI } = await import("@/api");
      const response = await usersAPI.getAll(searchQuery);
      const filtered = response.data.filter((u: any) => {
        const userId = u._id || u.id;
        return !project.members.some((m) => m._id === userId);
      });
      setUsers(filtered);
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);

    try {
      await projectsAPI.update(project._id, {
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    setAddingMember(true);
    setError("");
    try {
      await projectsAPI.addMember(project._id, userId);
      onUpdate();
      setMemberEmail("");
      setSearchQuery("");
      setUsers([]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to add member";
      setError(errorMessage);
      console.error("Failed to add member:", err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!isOwner) return;
    try {
      await projectsAPI.removeMember(project._id, userId);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Project Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 font-medium ${
                activeTab === "settings"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 font-medium ${
                activeTab === "members"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Members ({project.members.length})
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {activeTab === "settings" && (
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        color === c
                          ? "border-gray-900 dark:border-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
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
          )}

          {activeTab === "members" && (
            <div className="space-y-4">
              {isOwner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Member
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {searchQuery && users.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {users.map((u: any) => {
                        const userId = u._id || u.id;
                        return (
                          <div
                            key={userId}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {u.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {u.email}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddMember(userId)}
                              disabled={addingMember}
                              className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {project.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name}
                          {member._id === project.owner._id && (
                            <span className="ml-2 text-xs text-primary-600">
                              (Owner)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {isOwner && member._id !== project.owner._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
