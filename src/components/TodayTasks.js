import React from "react";
import { CheckCircle2, Circle, Trash2, Calendar } from "lucide-react";
import clsx from "clsx";

const TodayTasks = ({ tasks, onToggleTask, onDeleteTask }) => {
  const completedTasks = tasks.filter((task) => task.completed);
  const incompleteTasks = tasks.filter((task) => !task.completed);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-600" />
          Today's Tasks
        </h2>
        <div className="text-sm text-gray-500">
          {completedTasks.length} of {tasks.length} completed
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Circle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No tasks for today. Add some tasks to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Incomplete tasks first */}
          {incompleteTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              formatTime={formatTime}
            />
          ))}

          {/* Completed tasks */}
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskItem = ({ task, onToggle, onDelete, formatTime }) => {
  return (
    <div className={clsx("task-item", task.completed && "task-completed")}>
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => onToggle(task.id)}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-success-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-primary-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              "text-gray-900",
              task.completed && "task-text-completed"
            )}
          >
            {task.text}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Added at {formatTime(task.createdAt)}
          </p>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="btn-danger p-2 ml-2"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TodayTasks;
