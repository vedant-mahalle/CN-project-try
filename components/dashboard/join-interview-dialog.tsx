"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface JoinInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinInterviewDialog({ open, onOpenChange }: JoinInterviewDialogProps) {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedRoomCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (!normalizedRoomCode) return

    // Register the room code to get its hashed URL token so the plain code is not in the URL
    let urlToken = normalizedRoomCode
    try {
      const res = await fetch("/api/interview/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: normalizedRoomCode }),
      })
      const data = await res.json()
      if (res.ok && data.urlToken) urlToken = data.urlToken
    } catch {
      // Fall back to plain room code
    }

    router.push(`/interview/${urlToken}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Interview</DialogTitle>
          <DialogDescription>Enter the room code to join an existing interview session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              placeholder="e.g., ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="uppercase"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Join</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
