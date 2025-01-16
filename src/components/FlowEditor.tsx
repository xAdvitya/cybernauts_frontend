import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import axios from 'axios';
import Sidebar from './SideBar';
import 'reactflow/dist/style.css';

const FlowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hobbies] = useState<string[]>([
    'Reading',
    'Gaming',
    'Cooking',
    'Swimming',
    'Running',
  ]);
  const [newHobbyNode, setNewHobbyNode] = useState<Node | null>(null);

  // Fetching user data from the backend API when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          'https://cybernauts-backend.onrender.com/api/users'
        );
        const data = response.data;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Loop through each user and add their node and hobby nodes
        data.forEach((user: any, userIndex: number) => {
          const mainNodeId = `user-${user._id}`;
          newNodes.push({
            id: mainNodeId,
            data: {
              label: `${user.username}, Age: ${user.age}`,
              userId: user._id,
            },
            position: { x: userIndex, y: userIndex * 300 },
          });

          // Loop through hobbies and create corresponding hobby nodes
          user.hobbies.forEach((hobby: string, hobbyIndex: number) => {
            const hobbyNodeId = `${mainNodeId}-hobby-${hobbyIndex}`;
            newNodes.push({
              id: hobbyNodeId,
              data: { label: hobby },
              position: {
                x: userIndex * 300 + 400,
                y: userIndex * 300 + hobbyIndex * 100,
              },
            });

            // Create edges between user node and hobby nodes
            newEdges.push({
              id: `edge-${mainNodeId}-${hobbyNodeId}`,
              source: mainNodeId,
              target: hobbyNodeId,
            });
          });
        });

        // Update state with the new nodes and edges
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, []);

  // Handles the drag start event by setting the dragged hobby
  const onDragStart = (event: React.DragEvent, hobby: string) => {
    event.dataTransfer.setData('text/plain', hobby);
    setNewHobbyNode(null); // Reset new hobby node on drag start
  };

  // Handles the drop event by adding a new hobby node to the flow
  const onDrop = async (event: React.DragEvent) => {
    const hobby = event.dataTransfer.getData('text/plain');
    if (!hobby) return;

    const dropPosition = { x: event.clientX, y: event.clientY };
    const newHobbyNodeId = `hobby-${Date.now()}`;
    const newHobbyNode: Node = {
      id: newHobbyNodeId,
      data: { label: hobby },
      position: dropPosition,
    };

    setNewHobbyNode(newHobbyNode);
    setNodes((nds) => [...nds, newHobbyNode]);
  };

  // Prevent the default behavior of the drag over event to allow dropping
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Explicitly type the parameter 'changes' as NodeChange[] for onNodesChange
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Explicitly type the parameter 'changes' as EdgeChange[] for onEdgesChange
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Handles creating edges between nodes and updating user data with new hobbies
  const onConnect = useCallback(
    async (params: any) => {
      setEdges((eds) => addEdge(params, eds));
      const targetUserNode = nodes.find(
        (node) => node.id === params.source || node.id === params.target
      );

      if (targetUserNode && targetUserNode.data.userId && newHobbyNode) {
        const userId = targetUserNode.data.userId;
        const hobby = newHobbyNode.data.label;

        try {
          // Fetch the user data based on the userId
          const response = await axios.get(
            'https://cybernauts-backend.onrender.com/api/users'
          );

          const user = response.data.find(
            (user: { _id: string }) => user._id === userId
          );

          const updatedHobbies = [...user.hobbies, hobby];

          // Send PUT request to update user hobbies
          await axios.put(
            `https://cybernauts-backend.onrender.com/api/users/${userId}`,
            {
              username: user.username,
              age: user.age,
              hobbies: updatedHobbies,
            }
          );

          setNewHobbyNode(null); // Clear the new hobby node after update
        } catch (error) {
          console.error('Error updating user hobbies:', error);
        }
      }
    },
    [nodes, newHobbyNode]
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar with draggable hobby items */}
      <Sidebar hobbies={hobbies} onDragStart={onDragStart} />
      
      <div
        style={{ flexGrow: 5, padding: '100px' }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowEditor;
