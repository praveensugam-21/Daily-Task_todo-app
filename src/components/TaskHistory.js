import React, { useState } from "react";
import {
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
} from "lucide-react";
import clsx from "clsx";

const TaskHistory = ({ tasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group tasks by date
  const groupedTasks = tasks.reduce((groups, task) => {
    const date = task.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getCompletionRate = (taskList) => {
    const completed = taskList.filter((task) => task.completed).length;
    return Math.round((completed / taskList.length) * 100);
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-4"
      >
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <History className="w-5 h-5 mr-2 text-primary-600" />
          Task History
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {tasks.length} total tasks
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dateTasks = groupedTasks[date];
            const completionRate = getCompletionRate(dateTasks);

            return (
              <div key={date} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    {formatDate(date)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      {dateTasks.filter((t) => t.completed).length}/
                      {dateTasks.length} completed
                    </div>
                    <div
                      className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        completionRate === 100
                          ? "bg-success-100 text-success-800"
                          : completionRate >= 70
                          ? "bg-warning-100 text-warning-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {completionRate}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      className={clsx(
                        "flex items-center space-x-3 p-2 rounded",
                        task.completed ? "bg-green-50" : "bg-gray-50"
                      )}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span
                        className={clsx(
                          "text-sm",
                          task.completed
                            ? "text-gray-500 line-through"
                            : "text-gray-700"
                        )}
                      >
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
