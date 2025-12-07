"use client"

import { Textarea } from "@/components/ui/textarea"

interface NotesPanelProps {
  notes: string
  onChange: (value: string) => void
}

export function NotesPanel({ notes, onChange }: NotesPanelProps) {
  return (
    <div className="h-full p-4">
      <Textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Take notes during the interview..."
        className="h-full resize-none border-0 focus-visible:ring-0 bg-transparent p-0"
      />
    </div>
  )
}
