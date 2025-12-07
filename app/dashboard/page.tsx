"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Plus, Video, Calendar, Clock, Users, LogOut } from "lucide-react"
import { CreateInterviewDialog } from "@/components/dashboard/create-interview-dialog"
import { JoinInterviewDialog } from "@/components/dashboard/join-interview-dialog"

interface User {
  id: string
  email: string
  fullName: string
  role: string
}

interface Interview {
  id: string
  title: string
  roomCode: string
  status: string
  scheduledAt: string
  candidateName?: string
}

const mockInterviews: Interview[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    roomCode: "ABC123",
    status: "scheduled",
    scheduledAt: "2025-01-15T10:00:00",
    candidateName: "Alice Johnson",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    roomCode: "XYZ789",
    status: "completed",
    scheduledAt: "2025-01-10T14:00:00",
    candidateName: "Bob Smith",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleCreateInterview = (interview: Interview) => {
    setInterviews([interview, ...interviews])
    setShowCreateDialog(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CodeInterview</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.fullName} ({user.role})
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Interview
          </Button>
          <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
            <Video className="h-4 w-4 mr-2" />
            Join Interview
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Interviews</CardDescription>
              <CardTitle className="text-3xl">{interviews.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Scheduled</CardDescription>
              <CardTitle className="text-3xl">{interviews.filter((i) => i.status === "scheduled").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{interviews.filter((i) => i.status === "completed").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">3</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Interview List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Interviews</CardTitle>
            <CardDescription>Manage and join your scheduled interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{interview.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {interview.candidateName && <span>{interview.candidateName}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(interview.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        interview.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {interview.status}
                    </span>
                    {interview.status === "scheduled" && (
                      <Link href={`/interview/${interview.roomCode}`}>
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <CreateInterviewDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateInterview}
      />
      <JoinInterviewDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
    </div>
  )
}
