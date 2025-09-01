import React, { useState, useEffect, useCallback } from "react";
import MotivationalSummary from "./components/MotivationalSummary";
import TodayTasks from "./components/TodayTasks";
import AddTaskForm from "./components/AddTaskForm";
import TaskHistory from "./components/TaskHistory";
import { generateMotivationalMessage } from "./utils/aiService";

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("todo-tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [messageError, setMessageError] = useState("");

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("todo-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Function to fetch motivational message (memoized)
  const fetchMotivationalMessage = useCallback(async () => {
    try {
      setIsLoadingMessage(true);
      setMessageError("");
      const message = await generateMotivationalMessage(tasks);
      setMotivationalMessage(message);
    } catch (error) {
      setMessageError(
        "Failed to load motivational message. Please try again later."
      );
      console.error("Error fetching motivational message:", error);
    } finally {
      setIsLoadingMessage(false);
    }
  }, [tasks]);

  // Generate motivational message on component mount and whenever tasks change
  useEffect(() => {
    fetchMotivationalMessage();
  }, [fetchMotivationalMessage]);

  const addTask = (taskText) => {
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    };
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const toggleTask = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((task) => task.date === today);
  };

  const getPreviousTasks = () => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((task) => task.date !== today);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Daily Todo App
          </h1>
          <p className="text-gray-600">
            Stay organized and motivated with AI-powered insights
          </p>
        </header>

        <div className="space-y-6">
          {/* Motivational Summary Section */}
          <MotivationalSummary
            message={motivationalMessage}
            isLoading={isLoadingMessage}
            error={messageError}
            onRefresh={fetchMotivationalMessage}
          />

          {/* Add Task Form */}
          <AddTaskForm onAddTask={addTask} />

          {/* Today's Tasks Section */}
          <TodayTasks
            tasks={getTodayTasks()}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />

          {/* Task History Section */}
          <TaskHistory tasks={getPreviousTasks()} />
        </div>
      </div>
    </div>
  );
}

export default App;
