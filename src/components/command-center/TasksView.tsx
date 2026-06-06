import { useState } from 'react';
import { SquareCheck as CheckSquare, Clock, CircleAlert as AlertCircle, Plus, Filter, CircleCheck as CheckCircle, Circle, ChevronDown } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  module: string;
  assignee?: string;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Review Q1 revenue report for South Commons', priority: 'high', status: 'todo', due_date: new Date(Date.now() + 86400000).toISOString(), module: 'Revenue', assignee: 'You' },
  { id: '2', title: 'Approve 3 pending credential renewals', priority: 'high', status: 'todo', due_date: new Date(Date.now() + 172800000).toISOString(), module: 'Workforce', assignee: 'You' },
  { id: '3', title: 'Complete West End launch phase 2 checklist', priority: 'medium', status: 'in_progress', due_date: new Date(Date.now() + 432000000).toISOString(), module: 'Operations', assignee: 'You' },
  { id: '4', title: 'Review AI agent execution report', priority: 'medium', status: 'todo', module: 'Intelligence', assignee: 'You' },
  { id: '5', title: 'Update referral source tracking for Q2', priority: 'low', status: 'in_progress', module: 'Growth', assignee: 'You' },
  { id: '6', title: 'Sign off on annual OKR review', priority: 'high', status: 'done', module: 'Strategy', assignee: 'You' },
  { id: '7', title: 'Review intake conversion SLA breach report', priority: 'medium', status: 'done', module: 'Growth', assignee: 'You' },
];

const priorityConfig = {
  high: { label: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  low: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
};

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);

  const counts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next: Record<Task['status'], Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
      return { ...t, status: next[t.status] };
    }));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
      module: 'General',
      assignee: 'You',
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    const diff = d.getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (days === 0) return { label: 'Today', color: 'text-amber-600' };
    if (days === 1) return { label: 'Tomorrow', color: 'text-amber-500' };
    return { label: `${days}d`, color: 'text-gray-500' };
  };

  const statusIcon = (status: Task['status']) => {
    if (status === 'done') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'in_progress') return <Clock className="h-5 w-5 text-blue-500" />;
    return <Circle className="h-5 w-5 text-gray-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Your personal task queue across all modules</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 flex items-center gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Task title..."
            className="flex-1 text-sm border-0 outline-none placeholder-gray-400"
            autoFocus
          />
          <button onClick={addTask} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Add</button>
          <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do', key: 'todo', count: counts.todo, color: 'gray' },
          { label: 'In Progress', key: 'in_progress', count: counts.in_progress, color: 'blue' },
          { label: 'Done', key: 'done', count: counts.done, color: 'green' },
        ].map(({ label, key, count, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`bg-white rounded-xl border p-4 text-left transition-all ${filter === key ? 'border-blue-400 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-2xl font-bold text-${color}-600`}>{count}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <CheckSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No tasks here</p>
          </div>
        )}
        {filtered.map(task => {
          const due = formatDate(task.due_date);
          const pri = priorityConfig[task.priority];
          return (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <button onClick={() => toggleStatus(task.id)} className="flex-shrink-0">
                {statusIcon(task.status)}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{task.module}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>{pri.label}</span>
                </div>
              </div>
              {due && (
                <div className={`flex items-center gap-1 text-xs ${due.color} flex-shrink-0`}>
                  <Clock className="h-3 w-3" />
                  {due.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
