'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { FiUsers, FiCalendar } from 'react-icons/fi';

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
  createdAt: string;
  updatedAt: string;
}

export default function ProjectCard({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: () => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/projects/${project._id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      <div
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: project.color }}
      />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FiUsers className="mr-1" size={14} />
              <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1" size={14} />
              <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

