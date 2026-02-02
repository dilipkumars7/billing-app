// ViewSettingsList.tsx
import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Checkbox } from "antd";
import { MdOutlineDragIndicator } from "react-icons/md";

interface ColumnItem {
  name: string;
  headerName: string;
  isVisible: boolean;
  width?: number;
}

interface Props {
  columns: ColumnItem[];
  onChange: (cols: ColumnItem[]) => void;
}

const ViewSettingsList: React.FC<Props> = ({ columns, onChange }) => {

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const updated = Array.from(columns);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);

    onChange(updated);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...columns];
    updated[index] = {
      ...updated[index],
      isVisible: !updated[index].isVisible
    };
    onChange(updated);
  };

  const isColumnLocked = (headerName: string) =>
  /code|name/i.test(headerName);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="column-settings"
        direction="vertical"
        isDropDisabled={false}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {columns.map((col, index) => (
              <Draggable
                key={col.name}
                draggableId={String(col.name)}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="select-none flex items-center justify-between bg-white border-[1.5px] border-[#EBECF0] rounded-md px-3 py-2 mb-2 shadow-sm gap-[1rem]"
                  >
                    {/* Drag Handle */}
                    <span
                      {...provided.dragHandleProps}
                      className="cursor-grab text-gray-500"
                    >
                      <MdOutlineDragIndicator size={18} />
                    </span>

                    <div className="flex items-center gap-3 justify-start w-full">
                      <Checkbox
                        checked={col.isVisible}
                        onChange={() => toggleVisibility(index)}
                        disabled={isColumnLocked(col.headerName)}
                      />
                      <span className="text-sm">{col.headerName}</span>
                    </div>

                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ViewSettingsList;
