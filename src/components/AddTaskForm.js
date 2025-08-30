import React, { useState } from "react";
import { Plus, Send } from "lucide-react";

const AddTaskForm = ({ onAddTask }) => {
  const [taskText, setTaskText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      onAddTask(taskText.trim());
      setTaskText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-primary-600" />
        Add New Task
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What do you want to accomplish today?"
            className="input-field flex-1"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!taskText.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {taskText.length > 0 && (
          <div className="text-sm text-gray-500">
            {taskText.length}/200 characters
          </div>
        )}
      </form>
    </div>
  );
};

export default AddTaskForm;
