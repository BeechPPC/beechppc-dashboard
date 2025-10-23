'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Trash2, User } from 'lucide-react'
import type { Task } from '@/app/(app)/tasks/page'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onDelete?: (taskId: string) => void
}

export function TaskCard({ task, isDragging = false, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-xl' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h3>
        {onDelete && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="text-muted hover:text-error transition-colors flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2">
        {task.client && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <User className="h-3 w-3" />
            <span className="truncate">{task.client}</span>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>
    </div>
  )
}
