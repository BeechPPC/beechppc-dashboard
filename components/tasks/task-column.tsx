'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './task-card'
import type { Task } from '@/app/(app)/tasks/page'
import { AlertCircle, Check, Clock } from 'lucide-react'

interface TaskColumnProps {
  title: string
  status: Task['status']
  tasks: Task[]
  onDeleteTask: (taskId: string) => void
}

export function TaskColumn({ title, status, tasks, onDeleteTask }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-muted" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-warning" />
      case 'completed':
        return <Check className="h-5 w-5 text-success" />
    }
  }

  const getHeaderColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-gray-50 border-gray-200'
      case 'in_progress':
        return 'bg-blue-50 border-blue-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-lg border-2 transition-colors ${
        isOver ? 'border-primary bg-primary-light/30' : 'border-border'
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 border-b-2 rounded-t-lg ${getHeaderColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="font-semibold text-sm">{title}</h2>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-white rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
