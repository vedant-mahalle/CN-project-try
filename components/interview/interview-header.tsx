"use client"

import { Button } from "@/components/ui/button"
import { Code2, Copy, Clock, Play, Pause, RotateCcw, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface InterviewHeaderProps {
  roomCode: string
  timerSeconds: number
  isTimerRunning: boolean
  onTimerToggle: () => void
  onTimerReset: () => void
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function InterviewHeader({
  roomCode,
  timerSeconds,
  isTimerRunning,
  onTimerToggle,
  onTimerReset,
}: InterviewHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const copyRoomCode = () => {
    // Copy the full shareable URL so participants can join directly
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Room link copied",
      description: "Share this link with participants to join.",
    })
  }

  const handleLeave = () => {
    router.push("/dashboard")
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-semibold">CodeInterview</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Room ID:</span>
          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{roomCode.slice(0, 8)}…</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Copy room link" onClick={copyRoomCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm min-w-[70px]">{formatTime(timerSeconds)}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTimerToggle}>
            {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTimerReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        <Button variant="destructive" size="sm" onClick={handleLeave}>
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </div>
    </header>
  )
}
