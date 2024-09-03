import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TextField, Button, Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const API_URL = 'http://localhost:5000/api/tasks';

const initialColumns = {
  backlog: { name: 'Backlog', items: [], icon: '🎒', color: '#2196f3' },
  design: { name: 'Design', items: [], icon: '🎨', color: '#9c27b0' },
  todo: { name: 'To-Do', items: [], icon: '🤔', color: '#f44336' },
  doing: { name: 'Doing', items: [], icon: '🤓', color: '#ff5722' }
};

const TodoList = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      const tasks = response.data;
      const updatedColumns = { ...initialColumns };
      tasks.forEach(task => {
        updatedColumns[task.status].items.push(task);
      });
      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      const updatedColumns = {
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems }
      };

      setColumns(updatedColumns);

      try {
        await axios.put(`${API_URL}/${removed._id}`, {
          ...removed,
          status: destination.droppableId
        });
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems }
      });
    }
  };

  const addTask = async () => {
    if (newTask.trim() !== '') {
      const newTaskObj = {
        content: newTask,
        dueDate: selectedDate,
        assignee: assignee,
        status: 'backlog'
      };

      try {
        const response = await axios.post(API_URL, newTaskObj);
        const updatedColumns = { ...columns };
        updatedColumns.backlog.items.push(response.data);
        setColumns(updatedColumns);
        setNewTask('');
        setSelectedDate(null);
        setAssignee('');
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="New Task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <DatePicker
            label="Due Date"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            renderInput={(params) => <TextField {...params} />}
          />
          <TextField
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
          <Button variant="contained" onClick={addTask}>Add Task</Button>
        </Box>
        <DragDropContext onDragEnd={onDragEnd}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {Object.entries(columns).map(([columnId, column]) => (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided) => (
                  <Card sx={{ width: '22%', minHeight: 300, backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{column.name}</Typography>
                        <IconButton size="small"><MoreHorizIcon /></IconButton>
                      </Box>
                      <Card sx={{ p: 2, mb: 2, backgroundColor: column.color }}>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {column.icon} {column.name}
                        </Typography>
                      </Card>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {column.name}
                      </Typography>
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {column.items.map((item, index) => (
                          <Draggable key={item._id} draggableId={item._id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{ mt: 1, p: 1, backgroundColor: 'white' }}
                              >
                                <Typography>{item.content}</Typography>
                                {item.dueDate && (
                                  <Typography variant="caption">
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {item.assignee && (
                                  <Typography variant="caption">
                                    Assigned to: {item.assignee}
                                  </Typography>
                                )}
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      </Box>
    </LocalizationProvider>
  );
};

export default TodoList;