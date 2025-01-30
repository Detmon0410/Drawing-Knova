import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Line, Transformer, Text, Rect } from 'react-konva';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [tool, setTool] = useState('pen'); // "pen", "select", or "calculate"
  const [drawMode, setDrawMode] = useState('free'); // "free" or "straight" or text mode
  const [lines, setLines] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]); // Store text boxes
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTextBoxes, setSelectedTextBoxes] = useState([]); // Store selected text boxes in calculate mode
  const [editingText, setEditingText] = useState(null); // Track editing text box
  const [sum, setSum] = useState(0); // Store sum result
  const [gridSize, setGridSize] = useState(50); // State for grid size
  const [showGrid, setShowGrid] = useState(false); // State for showing/hiding the grid
  const [penSize, setPenSize] = useState(5); // Store pen size
  const [lineType, setLineType] = useState('solid'); // Store line type (solid, dashed, dotted)
  const [lineColor, setLineColor] = useState('#df4b26'); // Store line color
  const isDrawing = useRef(false);
  const transformerRef = useRef(null);

  useEffect(() => {
    if (transformerRef.current) {
      const selectedNode = lines.find((line) => line.id === selectedId);
      const selectedText = textBoxes.find((textBox) => textBox.id === selectedId);
      
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode.ref.current]);
      } else if (selectedText) {
        transformerRef.current.nodes([selectedText.ref.current]);
      } else {
        transformerRef.current.nodes([]);
      }
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, lines, textBoxes]);

  const handleMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null); // Deselect when clicking on empty space
    }

    if (tool === 'pen') {
      // Drawing mode logic
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, { id: `line${lines.length + 1}`, tool, points: [pos.x, pos.y], ref: React.createRef(), lineType, penSize, lineColor }]);
    } else if (tool === 'text') {
      // Text creation logic
      const pos = e.target.getStage().getPointerPosition();
      setTextBoxes([ 
        ...textBoxes,
        {
          id: textBoxes.length,
          x: pos.x,
          y: pos.y,
          text: '',
          ref: React.createRef(),
        },
      ]);
      setEditingText(textBoxes.length); // Start editing the new text box
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];

    if (drawMode === 'straight' && lastLine.points.length > 2) {
      lastLine.points = [lastLine.points[0], lastLine.points[1], point.x, point.y];
    } else {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
    }
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleSelect = (id, type) => {
    if (tool === 'pen' || tool === 'text') return; // Prevent selection in pen or text mode

    if (tool === 'calculate') {
      // In calculate mode, toggle selection of text boxes
      if (selectedTextBoxes.includes(id)) {
        setSelectedTextBoxes(selectedTextBoxes.filter((selectedId) => selectedId !== id)); // Deselect
      } else {
        setSelectedTextBoxes([...selectedTextBoxes, id]); // Select
      }
    } else {
      // Regular selection mode for lines and other tools
      if (selectedId === id) {
        setSelectedId(null); // Deselect if clicking the same line/text
      } else {
        setSelectedId(id); // Select the line/text
      }
    }
  };

  const handleDoubleClick = (id) => {
    const selectedTextBox = textBoxes.find((textBox) => textBox.id === id);
    if (selectedTextBox) {
      setEditingText(id); // Start editing the text box
    }
  };

  const handleTextChange = (e, id) => {
    setTextBoxes(
      textBoxes.map((textBox) =>
        textBox.id === id ? { ...textBox, text: e.target.value } : textBox
      )
    );
  };

  const handleTextBlur = () => {
    setEditingText(null); // Stop editing on blur
  };

  const handleCalculateSum = () => {
    const sumResult = selectedTextBoxes.reduce((sum, id) => {
      const textBox = textBoxes.find((textBox) => textBox.id === id);
      const numericValue = parseFloat(textBox.text);
      if (!isNaN(numericValue)) {
        return sum + numericValue;
      }
      return sum;
    }, 0);
    setSum(sumResult); // Set the sum result
  };

  const handleDelete = () => {
    if (selectedId !== null) {
      // Delete the selected line or text box based on its ID
      setLines(lines.filter((line) => line.id !== selectedId));
      setTextBoxes(textBoxes.filter((textBox) => textBox.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Function to draw the grid
  const drawGrid = () => {
    const gridLines = [];
    for (let i = 0; i < window.innerWidth; i += gridSize) {
      gridLines.push(<Line key={`v${i}`} points={[i, 0, i, window.innerHeight]} stroke="#ddd" strokeWidth={1} />);
    }
    for (let i = 0; i < window.innerHeight; i += gridSize) {
      gridLines.push(<Line key={`h${i}`} points={[0, i, window.innerWidth, i]} stroke="#ddd" strokeWidth={1} />);
    }
    return gridLines;
  };

  return (
    <div>
      {/* Tool Selection Tab Bar */}
      <div className="btn-group" role="group" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 3 }}>
        <button 
          type="button" 
          className={`btn btn-${tool === 'pen' ? 'primary' : 'secondary'}`} 
          onClick={() => { setTool('pen'); setSelectedId(null); setSelectedTextBoxes([]); }}>
          Pen
        </button>
        <button 
          type="button" 
          className={`btn btn-${tool === 'select' ? 'primary' : 'secondary'}`} 
          onClick={() => { setTool('select'); setSelectedId(null); setSelectedTextBoxes([]); }}>
          Select
        </button>
        <button 
          type="button" 
          className={`btn btn-${tool === 'calculate' ? 'primary' : 'secondary'}`} 
          onClick={() => { setTool('calculate'); setSelectedId(null); setSelectedTextBoxes([]); }}>
          Calculate
        </button>
      </div>

      {/* Tool Settings */}
      {tool === 'pen' && (
        <div className="position-absolute" style={{ top: '50px', left: '10px', zIndex: 3 }}>
          <button className="btn btn-outline-primary" onClick={() => { setDrawMode('free'); }}>
            Free Draw
          </button>
          <button className="btn btn-outline-primary" onClick={() => { setDrawMode('straight'); }}>
            Straight Line
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setTool('text')}>
            Create Text Box
          </button>
          {/* Line Type Dropdown */}
          <select
            className="form-select mt-2"
            value={lineType}
            onChange={(e) => setLineType(e.target.value)}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>

          {/* Pen Size Slider */}
          <label className="mt-2">Pen Size: {penSize}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={penSize}
            onChange={(e) => setPenSize(parseInt(e.target.value))}
            className="form-range"
          />

          {/* Line Color Picker */}
          <div className="mt-2">
            <label>Line Color:</label>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
            />
            <span style={{ marginLeft: '10px' }}>Current Color: {lineColor}</span>
          </div>
        </div>
      )}

      {tool === 'calculate' && (
        <div className="position-absolute" style={{ top: '50px', left: '10px', zIndex: 3 }}>
          <button className="btn btn-outline-primary" onClick={handleCalculateSum}>
            Calculate Sum
          </button>
        </div>
      )}

      {/* Delete Button */}
      {tool === 'select' && (selectedId !== null || selectedTextBoxes.length > 0) && (
        <div className="position-absolute" style={{ top: '100px', left: '10px', zIndex: 3 }}>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Selected
          </button>
        </div>
      )}

      {/* Grid Size Slider */}
      <div className="position-absolute" style={{ top: '50px', right: '10px', zIndex: 3 }}>
        <label>Grid Size: {gridSize}</label>
        <input
          type="range"
          min="20"
          max="100"
          step="10"
          value={gridSize}
          onChange={(e) => setGridSize(parseInt(e.target.value))}
          className="form-range"
        />
      </div>

      {/* Toggle Grid Visibility */}
      <div className="position-absolute" style={{ top: '100px', right: '10px', zIndex: 3 }}>
        <button
          className="btn btn-outline-primary"
          onClick={() => setShowGrid(!showGrid)}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      <Stage width={window.innerWidth} height={window.innerHeight} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <Layer>
          {/* Grid Lines */}
          {showGrid && drawGrid()}

          {lines.map((line, i) => (
            <Line
              key={i}
              ref={line.ref}
              points={line.points}
              stroke={selectedId === line.id ? 'blue' : line.lineColor}
              strokeWidth={line.penSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              dash={line.lineType === 'dashed' ? [10, 5] : line.lineType === 'dotted' ? [1, 5] : []}
              draggable={tool === 'select'} // Only make it draggable in select mode
              onClick={() => handleSelect(line.id, 'line')} // Send type as 'line'
            />
          ))}
          {textBoxes.map((textBox, i) => (
            <React.Fragment key={i}>
              {selectedTextBoxes.includes(textBox.id) && tool === 'calculate' && (
                <Rect
                  x={textBox.x - 5}
                  y={textBox.y - 5}
                  width={textBox.ref.current.getTextWidth() + 10} // Use getTextWidth to get text width
                  height={textBox.ref.current.getTextHeight() + 10} // Use getTextHeight to get text height
                  fill="yellow"
                  opacity={0.3}
                  zIndex={2}
                />
              )}
              <Text
                ref={textBox.ref}
                x={textBox.x}
                y={textBox.y}
                text={textBox.text}
                fontSize={20}
                draggable={tool === 'select'} // Only make it draggable in select mode
                onClick={() => handleSelect(textBox.id, 'text')} // Send type as 'text'
                onDoubleClick={() => handleDoubleClick(textBox.id)} // Enable double-click editing
                fill={selectedTextBoxes.includes(textBox.id) && tool === 'calculate' ? 'blue' : 'black'} // Change text color on select
              />
            </React.Fragment>
          ))}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>

      {/* Text Editing Area */}
      {editingText !== null && (
        <input
          type="text"
          value={textBoxes[editingText].text}
          onChange={(e) => handleTextChange(e, editingText)}
          onBlur={handleTextBlur}
          className="position-absolute"
          style={{ top: `${textBoxes[editingText].y}px`, left: `${textBoxes[editingText].x}px`, fontSize: '20px', padding: '5px', zIndex: 3 }}
        />
      )}

      {/* Display Sum Result at the Top-Right */}
      {tool === 'calculate' && (
        <div className="position-absolute" style={{ top: '10px', right: '10px', fontSize: '20px', zIndex: 3 }}>
          Sum: {sum}
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;
