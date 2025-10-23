'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, AlertCircle, Clock, Check } from 'lucide-react'
import { TaskColumn } from '@/components/tasks/task-column'
import { TaskCard } from '@/components/tasks/task-card'
import { NewTaskModal } from '@/components/tasks/new-task-modal'

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  client?: string
  dueDate?: string
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review campaign performance',
      description: 'Analyze Q4 campaign metrics and identify areas for improvement',
      status: 'in_progress',
      priority: 'high',
      client: 'Acme Corp',
      dueDate: '2025-10-25',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Update keyword lists',
      description: 'Add new keywords for holiday season campaigns',
      status: 'pending',
      priority: 'medium',
      client: 'TechStart Inc',
      dueDate: '2025-10-30',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Client report preparation',
      description: 'Prepare monthly performance report for top 5 clients',
      status: 'completed',
      priority: 'high',
      client: 'Global Services',
      dueDate: '2025-10-20',
      createdAt: new Date().toISOString(),
    },
  ])

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as Task['status']

    if (['pending', 'in_progress', 'completed'].includes(newStatus)) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )
    }

    setActiveTask(null)
  }

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setTasks([...tasks, newTask])
    setIsModalOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const tasksByStatus = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Manage client tasks and track progress with drag-and-drop
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.pending.length}</div>
            <p className="text-xs text-muted mt-1">Tasks waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.in_progress.length}</div>
            <p className="text-xs text-muted mt-1">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.completed.length}</div>
            <p className="text-xs text-muted mt-1">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <TaskColumn
            title="Pending"
            status="pending"
            tasks={tasksByStatus.pending}
            onDeleteTask={handleDeleteTask}
          />
          <TaskColumn
            title="In Progress"
            status="in_progress"
            tasks={tasksByStatus.in_progress}
            onDeleteTask={handleDeleteTask}
          />
          <TaskColumn
            title="Completed"
            status="completed"
            tasks={tasksByStatus.completed}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}
