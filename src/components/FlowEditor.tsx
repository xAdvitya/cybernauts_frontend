import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import axios from 'axios';
import Sidebar from './SideBar';
import 'reactflow/dist/style.css';

const FlowEditor: React.FC = () => {
  // State to hold the nodes (users and hobbies) in the flow chart
  const [nodes, setNodes] = useState<Node[]>([]);

  // State to hold the edges (connections between users and their hobbies)
  const [edges, setEdges] = useState<Edge[]>([]);

  // Predefined hobbies that can be dragged into the flow editor
  const [hobbies] = useState<string[]>([
    'Reading',
    'Gaming',
    'Cooking',
    'Swimming',
    'Running',
  ]);

  // State to keep track of the currently dragged hobby
  const [draggedHobby, setDraggedHobby] = useState<string | null>(null);

  // State to store a new hobby node when dropped into the editor
  const [newHobbyNode, setNewHobbyNode] = useState<Node | null>(null);

  // Effect hook to fetch user data from the backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching user data from the API
        const response = await axios.get(
          'https://cybernauts-backend.onrender.com/api/users'
        );
        const data = response.data;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Looping through the fetched users and creating nodes for each user and their hobbies
        data.forEach((user: any, userIndex: number) => {
          const mainNodeId = `user-${user._id}`;

          // Create a node for the user
          newNodes.push({
            id: mainNodeId,
            data: {
              label: `${user.username}, Age: ${user.age}`,
              userId: user._id,
            },
            position: { x: userIndex, y: userIndex * 300 },
          });

          // Create hobby nodes and connect them to the user node
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

            // Add an edge connecting the user node to each hobby node
            newEdges.push({
              id: `edge-${mainNodeId}-${hobbyNodeId}`,
              source: mainNodeId,
              target: hobbyNodeId,
            });
          });
        });

        // Updating the state with the fetched nodes and edges
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData(); // Call the function to fetch the data
  }, []); // Empty dependency array means this effect runs once on component mount

  // Handler for the drag start event on the hobbies
  const onDragStart = (event: React.DragEvent, hobby: string) => {
    // Store the dragged hobby in the state for future reference
    event.dataTransfer.setData('text/plain', hobby);
    setDraggedHobby(hobby);
  };

  // Handler for the drop event when a hobby is dropped into the editor
  const onDrop = async (event: React.DragEvent) => {
    const hobby = event.dataTransfer.getData('text/plain');
    if (!hobby) return;

    // Capture the drop position and create a new hobby node
    const dropPosition = { x: event.clientX, y: event.clientY };
    const newHobbyNodeId = `hobby-${Date.now()}`;
    const newHobbyNode: Node = {
      id: newHobbyNodeId,
      data: { label: hobby },
      position: dropPosition,
    };

    // Set the new hobby node to the state and add it to the nodes array
    setNewHobbyNode(newHobbyNode);
    setNodes((nds) => [...nds, newHobbyNode]);
  };

  // Handler for the drag over event to allow dropping
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault(); // Necessary to allow the drop
  };

  // Handler for changes in nodes (moving or resizing)
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handler for changes in edges (connecting nodes)
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Handler for when a new connection is made between nodes (dragging edges)
  const onConnect = useCallback(
    async (params: any) => {
      // Add the new edge to the state
      setEdges((eds) => addEdge(params, eds));

      // Find the user node connected by the edge
      const targetUserNode = nodes.find(
        (node) => node.id === params.source || node.id === params.target
      );

      // If a valid user node and new hobby node are found, update the user's hobbies
      if (targetUserNode && targetUserNode.data.userId && newHobbyNode) {
        const userId = targetUserNode.data.userId;
        const hobby = newHobbyNode.data.label;

        try {
          // Fetch the user data from the API
          const response = await axios.get(
            'https://cybernauts-backend.onrender.com/api/users'
          );

          const user = response.data.find(
            (user: { _id: string }) => user._id === userId
          );

          const updatedHobbies = [...user.hobbies, hobby];

          // Send a PUT request to update the user's hobbies
          await axios.put(
            `https://cybernauts-backend.onrender.com/api/users/${userId}`,
            {
              username: user.username,
              age: user.age,
              hobbies: updatedHobbies,
            }
          );

          // Clear the new hobby node from the state
          setNewHobbyNode(null);
        } catch (error) {
          console.error('Error updating user hobbies:', error);
        }
      }
    },
    [nodes, newHobbyNode] // Re-run when nodes or new hobby node changes
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar with draggable hobbies */}
      <Sidebar hobbies={hobbies} onDragStart={onDragStart} />

      <div
        style={{ flexGrow: 5, padding: '100px' }}
        onDrop={onDrop} // Handle drop events here
        onDragOver={onDragOver} // Allow drop by preventing default action
      >
        {/* ReactFlow component to render the flowchart */}
        <ReactFlow
          nodes={nodes} // Pass nodes to render
          onNodesChange={onNodesChange} // Handle node changes (dragging)
          edges={edges} // Pass edges to render
          onEdgesChange={onEdgesChange} // Handle edge changes
          onConnect={onConnect} // Handle new connections between nodes
          fitView // Fit the flow to the screen
        >
          <Background /> {/* Background grid */}
          <Controls /> {/* Controls for zooming and panning */}
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowEditor;