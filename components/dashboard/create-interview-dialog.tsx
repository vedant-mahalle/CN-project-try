"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (interview: any) => void
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function CreateInterviewDialog({ open, onOpenChange, onSubmit }: CreateInterviewDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    candidateName: "",
    candidateEmail: "",
    scheduledAt: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const interview = {
      id: Date.now().toString(),
      ...formData,
      roomCode: generateRoomCode(),
      status: "scheduled",
    }
    onSubmit(interview)
    setFormData({ title: "", candidateName: "", candidateEmail: "", scheduledAt: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Interview</DialogTitle>
          <DialogDescription>Create a new interview session and invite a candidate.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Position / Title</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Frontend Developer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidateName">Candidate Name</Label>
            <Input
              id="candidateName"
              placeholder="John Doe"
              value={formData.candidateName}
              onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidateEmail">Candidate Email</Label>
            <Input
              id="candidateEmail"
              type="email"
              placeholder="candidate@example.com"
              value={formData.candidateEmail}
              onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Interview</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
