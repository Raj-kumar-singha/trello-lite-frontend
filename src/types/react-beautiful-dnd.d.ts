declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    destination?: DraggableLocation;
    combine?: {
      draggableId: string;
      droppableId: string;
    };
  }

  export interface DraggableProvided {
    draggableProps: any;
    dragHandleProps: any;
    innerRef: (element: HTMLElement | null) => void;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    isClone: boolean;
    dropAnimation?: any;
    draggingOver?: string;
    combineWith?: string;
    combineTargetFor?: string;
    mode?: 'FLUID' | 'SNAP';
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: any;
    placeholder?: React.ReactNode;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    mode: 'FLUID' | 'SNAP';
  }

  export interface DragUpdate extends DragStart {
    destination?: DraggableLocation;
    combine?: {
      draggableId: string;
      droppableId: string;
    };
  }

  export interface ResponderProvided {
    announce: (message: string) => void;
  }

  export interface DragDropContextProps {
    onDragStart?: (initial: DragStart, provided: ResponderProvided) => void;
    onDragUpdate?: (initial: DragUpdate, provided: ResponderProvided) => void;
    onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
    children?: React.ReactNode;
    enableDefaultSensors?: boolean;
  }

  export class DragDropContext extends React.Component<DragDropContextProps> {}

  export interface DroppableProps {
    droppableId: string;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    getContainerForClone?: () => HTMLElement;
    children: (
      provided: DroppableProvided,
      snapshot: DroppableStateSnapshot
    ) => React.ReactNode;
  }

  export class Droppable extends React.Component<DroppableProps> {}

  export interface DraggableRubric {
    draggableId: string;
    type: string;
    source: DraggableLocation;
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    canDragInteractiveElements?: boolean;
    children: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
      rubric: DraggableRubric
    ) => React.ReactNode;
  }

  export class Draggable extends React.Component<DraggableProps> {}
}

