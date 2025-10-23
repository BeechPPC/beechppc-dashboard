'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ListCheck, Plus, Check, Clock, AlertCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}

export default function TasksPage() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review campaign performance',
      description: 'Analyze Q4 campaign metrics and identify areas for improvement',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2025-10-25',
    },
    {
      id: '2',
      title: 'Update keyword lists',
      description: 'Add new keywords for holiday season campaigns',
      status: 'pending',
      priority: 'medium',
      dueDate: '2025-10-30',
    },
    {
      id: '3',
      title: 'Client report preparation',
      description: 'Prepare monthly performance report for top 5 clients',
      status: 'completed',
      priority: 'high',
      dueDate: '2025-10-20',
    },
  ])

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-success" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-warning" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-muted" />
    }
  }

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'pending':
        return 'Pending'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-error'
      case 'medium':
        return 'text-warning'
      case 'low':
        return 'text-muted'
    }
  }

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Manage your tasks and stay organized.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Pending
            </CardDescription>
            <AlertCircle className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.pending.length}</div>
            <p className="text-xs text-muted mt-1">Tasks waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              In Progress
            </CardDescription>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.in_progress.length}</div>
            <p className="text-xs text-muted mt-1">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Completed
            </CardDescription>
            <Check className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.completed.length}</div>
            <p className="text-xs text-muted mt-1">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* All Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>View and manage all your tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <ListCheck className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted">No tasks yet. Create your first task to get started!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-border rounded-lg hover:bg-primary-light/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1">{task.title}</h3>
                      <p className="text-sm text-muted mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                        {task.dueDate && (
                          <>
                            <span className="text-muted">•</span>
                            <span className="text-muted">
                              Due {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-foreground font-medium">
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
