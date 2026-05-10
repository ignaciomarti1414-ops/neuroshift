import { useEffect, useState, useCallback, FC } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  pointerWithin,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useNeuroStore } from '../store/useNeuroStore';
import { useCeremonialSounds } from '../hooks/useCeremonialSounds';

const GRID_SIZE = 6;

const SHAPES: Record<string, { color: string, hoverColor: string, map: number[][] }> = {
  't-shape': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[0, 1, 0],[1, 1, 1]] },
  'square': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 1],[1, 1]] },
  'l-shape': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 0],[1, 0],[1, 1]] },
  'l-shape-rev': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[0, 1],[0, 1],[1, 1]] },
  'dot': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1]] },
  'line-h': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 1, 1, 1]] },
  'line-v': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1], [1], [1], [1]] },
  'z-shape': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 1, 0], [0, 1, 1]] },
  's-shape': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[0, 1, 1], [1, 1, 0]] },
  'corner': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 1], [1, 0]] },
  'plus': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
  'small-l': { color: 'bg-[rgba(0,240,255,0.7)]', hoverColor: 'bg-[rgba(0,240,255,0.3)]', map: [[1, 0], [1, 1]] }
};

interface ShapeInstance {
  id: string;
  shapeType: string;
}

const DraggableShape = ({ instance, setDragAnchor }: { instance: ShapeInstance, setDragAnchor?: (a: [number, number]) => void }) => {
  const shapeData = SHAPES[instance.shapeType];
  const mapLayout = shapeData.map;
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: instance.id,
    data: { shapeType: instance.shapeType }
  });

  if (isDragging) {
    return <div ref={setNodeRef} className="opacity-0" style={{ width: mapLayout[0].length * 24, height: mapLayout.length * 24 }} />;
  }

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="grid gap-0.5 md:gap-1 cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform touch-none"
      style={{ gridTemplateColumns: `repeat(${mapLayout[0].length}, minmax(0, 1fr))` }}
    >
      {mapLayout.map((row, r) => 
        row.map((cell, c) => (
          <div 
            key={`${r}-${c}`}
            onPointerDown={() => setDragAnchor?.([r, c])}
            onTouchStart={() => setDragAnchor?.([r, c])}
            className={`w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md md:rounded-lg ${cell ? `${shapeData.color} shadow-[inset_0_2px_10px_rgba(255,255,255,0.3),0_4px_10px_rgba(0,0,0,0.3)] border border-primary/40` : 'bg-transparent pointer-events-none'}`}
          ></div>
        ))
      )}
    </div>
  );
};

const DroppableCell: FC<{ id: string, cellShape: string | null, isHovered: boolean, draggedShape: string | null }> = ({ id, cellShape, isHovered, draggedShape }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  let bgClass = 'bg-[rgba(20,30,50,0.4)]';
  let borderClass = 'border-[rgba(255,255,255,0.05)]';
  let shadowClass = '';

  if (cellShape !== null) {
    bgClass = SHAPES[cellShape].color;
    borderClass = 'border-[rgba(0,240,255,0.4)]';
    shadowClass = 'shadow-[inset_0_2px_15px_rgba(255,255,255,0.2)]';
  } else if (isHovered && draggedShape) {
    bgClass = SHAPES[draggedShape].hoverColor;
    borderClass = 'border-[rgba(0,240,255,0.2)]';
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-full h-full flex items-center justify-center rounded-md border ${bgClass} ${borderClass} ${shadowClass} transition-colors duration-200 aspect-square`}
    />
  );
};

export const Phase4ATetris = () => {
  const [grid, setGrid] = useState<string[]>(Array(GRID_SIZE * GRID_SIZE).fill(null));
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
  const [activeShapeType, setActiveShapeType] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [clearedLines, setClearedLines] = useState(0);
  const [dragAnchor, setDragAnchor] = useState<[number, number]>([0, 0]);
  const [isGridLocked, setIsGridLocked] = useState(false);

  const nextPhase = useNeuroStore((state) => state.nextPhase);
  const { playPhaseComplete } = useCeremonialSounds();

  const TARGET_LINES = 10;

  const generateShapes = useCallback(() => {
    const keys = Object.keys(SHAPES);
    return Array(3).fill(null).map((_, i) => ({
      id: `shape-${Date.now()}-${i}`,
      shapeType: keys[Math.floor(Math.random() * keys.length)]
    }));
  }, []);

  const [availableShapes, setAvailableShapes] = useState<ShapeInstance[]>(() => generateShapes());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (clearedLines >= TARGET_LINES) {
      playPhaseComplete();
      setTimeout(() => nextPhase(), 1000);
    }
  }, [clearedLines, nextPhase, playPhaseComplete]);

  const getPlacementIndices = useCallback((startIndex: number, shapeType: string, currentGrid: string[] = grid, anchor: [number, number] = dragAnchor): number[] | null => {
    const shapeInfo = SHAPES[shapeType];
    if (!shapeInfo) return null;

    const row = Math.floor(startIndex / GRID_SIZE) - anchor[0];
    const col = (startIndex % GRID_SIZE) - anchor[1];
    const placements: number[] = [];

    for (let r = 0; r < shapeInfo.map.length; r++) {
      for (let c = 0; c < shapeInfo.map[r].length; c++) {
        if (shapeInfo.map[r][c] === 1) {
          const newRow = row + r;
          const newCol = col + c;
          
          if (newRow >= GRID_SIZE || newCol >= GRID_SIZE || newRow < 0 || newCol < 0) {
            return null;
          }
          
          const newIndex = newRow * GRID_SIZE + newCol;
          if (currentGrid[newIndex] !== null) {
            return null;
          }
          placements.push(newIndex);
        }
      }
    }
    return placements;
  }, [grid, dragAnchor]);

  // Check gridlock
  useEffect(() => {
    let canPlaceAny = false;
    for (const shape of availableShapes) {
      for (let i = 0; i < grid.length; i++) {
        if (getPlacementIndices(i, shape.shapeType, grid, [0, 0]) !== null) {
          canPlaceAny = true;
          break;
        }
      }
      if (canPlaceAny) break;
    }

    if (!canPlaceAny && availableShapes.length > 0 && !isGridLocked) {
      setIsGridLocked(true);
      setTimeout(() => {
        setGrid(Array(GRID_SIZE * GRID_SIZE).fill(null));
        setIsGridLocked(false);
      }, 600);
    }
  }, [grid, availableShapes, getPlacementIndices, isGridLocked]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveShapeId(event.active.id as string);
    setActiveShapeType(event.active.data.current?.shapeType as string);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;
    if (over) {
      const index = parseInt(over.id as string, 10);
      if (!isNaN(index) && hoverIndex !== index) {
        setHoverIndex(index);
      }
    } else {
      if (hoverIndex !== null) setHoverIndex(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    const shapeType = activeShapeType;
    const shapeId = activeShapeId;
    
    setActiveShapeId(null);
    setActiveShapeType(null);
    setHoverIndex(null);

    if (over && shapeType) {
      const index = parseInt(over.id as string, 10);
      const placements = getPlacementIndices(index, shapeType);

      if (placements) {
        let nextGrid = [...grid];
        for (const idx of placements) {
          nextGrid[idx] = shapeType;
        }

        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        for (let r = 0; r < GRID_SIZE; r++) {
          let full = true;
          for (let c = 0; c < GRID_SIZE; c++) {
            if (nextGrid[r * GRID_SIZE + c] === null) full = false;
          }
          if (full) rowsToClear.push(r);
        }

        for (let c = 0; c < GRID_SIZE; c++) {
          let full = true;
          for (let r = 0; r < GRID_SIZE; r++) {
            if (nextGrid[r * GRID_SIZE + c] === null) full = false;
          }
          if (full) colsToClear.push(c);
        }

        const linesCleared = rowsToClear.length + colsToClear.length;
        if (linesCleared > 0) {
          rowsToClear.forEach(r => {
            for (let c = 0; c < GRID_SIZE; c++) nextGrid[r * GRID_SIZE + c] = null;
          });
          colsToClear.forEach(c => {
            for (let r = 0; r < GRID_SIZE; r++) nextGrid[r * GRID_SIZE + c] = null;
          });
          setClearedLines(prev => prev + linesCleared);
        }

        setGrid(nextGrid);

        setAvailableShapes(prev => {
          const next = prev.filter(s => s.id !== shapeId);
          if (next.length === 0) return generateShapes();
          return next;
        });
      }
    }
  };

  let projectedPlacements: number[] = [];
  if (activeShapeType && hoverIndex !== null) {
    const placements = getPlacementIndices(hoverIndex, activeShapeType);
    if (placements) {
      projectedPlacements = placements;
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden w-full h-full min-h-0">
        
        <div className="flex flex-col items-center w-full shrink-0">
          <h2 className="text-xl md:text-3xl font-light text-primary glow-text uppercase tracking-widest mb-1 text-center w-full">
            Tareas de Compromiso Cognitivo
          </h2>
          <h3 className="text-[10px] md:text-sm text-on-surface-variant font-mono uppercase tracking-[0.2em] mb-2 md:mb-6 text-center">
            Fase 4: Cambio de Carga
          </h3>
        </div>

        <div className="flex flex-col md:flex-row w-full max-w-4xl justify-between items-center md:items-stretch gap-2 md:gap-10 flex-1 min-h-[300px]">
          
          <div className="glass-panel p-3 md:p-6 flex flex-col w-full md:w-auto items-center md:items-start shrink-0 relative flex-1 mb-2 md:mb-0">
            <h4 className="text-[10px] text-on-surface-variant uppercase font-mono tracking-[0.2em] mb-2 text-center w-full hidden md:block">Cuadrícula Tetris</h4>

            <div className={`grid grid-cols-6 gap-0.5 md:gap-1 w-full max-w-[200px] md:max-w-[300px] aspect-square auto-rows-[1fr] ${isGridLocked ? 'opacity-30 bg-error/10' : ''} mx-auto`}>
              {grid.map((cellShape, i) => (
                <DroppableCell 
                  key={i} 
                  id={i.toString()} 
                  cellShape={cellShape} 
                  isHovered={projectedPlacements.includes(i)} 
                  draggedShape={activeShapeType} 
                />
              ))}
            </div>

            <div className="flex justify-between w-full mt-2 md:mt-6 text-[10px] md:text-xs font-mono uppercase tracking-widest text-on-surface-variant px-2">
               <span>Puntos: <span className="text-white ml-1 glow-text">{clearedLines * 10}</span></span>
               <span>Líneas: <span className="text-white ml-1">{clearedLines} / {TARGET_LINES}</span></span>
               <span>Nivel: <span className="text-primary ml-1 glow-text">{Math.min(5, Math.floor(clearedLines/2) + 1)}</span></span>
            </div>
            
            <div className="w-full mt-2 h-1 bg-surface-bright rounded-full overflow-hidden shrink-0">
               <div 
                 className="h-full bg-primary transition-all duration-300"
                 style={{ width: `${Math.min(100, (clearedLines / TARGET_LINES) * 100)}%` }}
               />
            </div>
          </div>
          
          <div className="flex flex-col md:w-1/2 w-full gap-2 md:gap-6 shrink-0 md:shrink">
            <div className="glass-panel p-2 md:p-6 flex flex-col items-center justify-center">
                <h4 className="text-[10px] text-on-surface-variant uppercase font-mono tracking-[0.2em] mb-2 hidden md:block">Siguientes Piezas</h4>
                
                <div className="flex gap-2 md:gap-4 items-center justify-center w-full touch-none h-16 md:h-32 relative">
                  {availableShapes.map((shape) => (
                    <div key={shape.id} className="flex flex-col items-center justify-center transform scale-75 md:scale-100 p-1 md:p-2">
                       <DraggableShape instance={shape} setDragAnchor={setDragAnchor} />
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeShapeType ? (
            <div 
              className="grid gap-0.5 md:gap-1 opacity-90 scale-105 pointer-events-none"
              style={{ gridTemplateColumns: `repeat(${SHAPES[activeShapeType].map[0].length}, minmax(0, 1fr))` }}
            >
              {SHAPES[activeShapeType].map.map((row, r) => 
                row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className={`w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md md:rounded-lg ${cell ? `${SHAPES[activeShapeType].color} shadow-[inset_0_2px_15px_rgba(255,255,255,0.4),0_4px_15px_rgba(0,0,0,0.5)] border border-primary` : 'bg-transparent'}`}
                  ></div>
                ))
              )}
            </div>
          ) : null}
        </DragOverlay>

      </main>
    </DndContext>
  );
};
