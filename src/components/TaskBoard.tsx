import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, push, onValue, remove } from 'firebase/database';

interface Task {
  id: string;
  content: string;
  createdAt: number;
}

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const tasksRef = ref(db, 'tasks');
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const taskList = Object.entries(data).map(([id, task]: [string, any]) => ({
          id,
          content: task.content,
          createdAt: task.createdAt,
        }));
        setTasks(taskList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setTasks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === '' || !auth.currentUser) return;

    const tasksRef = ref(db, 'tasks');
    push(tasksRef, {
      content: newTask,
      createdAt: Date.now(),
    });

    setNewTask('');
  };

  const deleteTask = (taskId: string) => {
    if (!auth.currentUser) return;
    const taskRef = ref(db, `tasks/${taskId}`);
    remove(taskRef);
  };

  // ... (rest of the component remains the same)
};

export default TaskBoard;