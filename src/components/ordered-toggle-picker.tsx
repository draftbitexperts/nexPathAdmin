"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Check, GripVertical, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type OrderedToggleItem = {
  id: string
  label: string
}

export type OrderedToggleSelection = {
  id: string
  sort_order: number
}

type OrderedTogglePickerProps = {
  items: OrderedToggleItem[]
  selected: OrderedToggleSelection[]
  onChange: (next: OrderedToggleSelection[]) => void
  orderHeading?: string
  emptyOrderHint?: string
  emptyItemsHint?: string
}

/** Sort by sort_order, then assign contiguous 0..n indices. */
function orderedFromSelection(
  selected: OrderedToggleSelection[]
): OrderedToggleSelection[] {
  return [...selected]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index }))
}

/** Keep current array order; only rewrite sort_order to 0..n. */
function renumberInPlace(
  selected: OrderedToggleSelection[]
): OrderedToggleSelection[] {
  return selected.map((item, index) => ({ ...item, sort_order: index }))
}

function SortableOrderRow({
  id,
  index,
  label,
  onRemove,
}: {
  id: string
  index: number
  label: string
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "bg-background flex items-center gap-1.5 px-1.5 py-1.5",
        isDragging && "relative z-10 rounded-md bg-muted/80 opacity-90 shadow-md"
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md touch-none active:cursor-grabbing"
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-medium tabular-nums">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <X />
      </Button>
    </li>
  )
}

export function OrderedTogglePicker({
  items,
  selected,
  onChange,
  orderHeading = "Display order",
  emptyOrderHint = "Select items above to set their order.",
  emptyItemsHint = "Nothing to choose yet.",
}: OrderedTogglePickerProps) {
  const selectedIds = new Set(selected.map((item) => item.id))
  const ordered = orderedFromSelection(selected)
  const labelById = React.useMemo(
    () => new Map(items.map((item) => [item.id, item.label])),
    [items]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function toggle(id: string) {
    if (selectedIds.has(id)) {
      onChange(
        renumberInPlace(orderedFromSelection(selected).filter((item) => item.id !== id))
      )
      return
    }
    onChange([
      ...orderedFromSelection(selected),
      { id, sort_order: selected.length },
    ])
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = orderedFromSelection(selected)
    const oldIndex = current.findIndex((item) => item.id === String(active.id))
    const newIndex = current.findIndex((item) => item.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    // Preserve arrayMove order; do not re-sort by stale sort_order values.
    onChange(renumberInPlace(arrayMove(current, oldIndex, newIndex)))
  }

  function clearAll() {
    onChange([])
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-xs">{emptyItemsHint}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="font-normal tabular-nums">
          {selected.length} selected
        </Badge>
        {selected.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={clearAll}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg pr-0.5">
        {items.map((item) => {
          const isOn = selectedIds.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={isOn}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                isOn
                  ? "border-primary/40 bg-primary/8 text-foreground"
                  : "border-border/70 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  isOn
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background"
                )}
              >
                {isOn ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{orderHeading}</p>
          {ordered.length > 1 ? (
            <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <GripVertical className="size-3" />
              Drag to reorder
            </p>
          ) : null}
        </div>
        {ordered.length === 0 ? (
          <p className="text-muted-foreground text-xs">{emptyOrderHint}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={ordered.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="border-border/60 divide-y divide-border/50 rounded-lg border">
                {ordered.map((item, index) => (
                  <SortableOrderRow
                    key={item.id}
                    id={item.id}
                    index={index}
                    label={labelById.get(item.id) ?? item.id}
                    onRemove={() => toggle(item.id)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
