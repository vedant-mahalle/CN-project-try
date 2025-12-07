export interface User {
  id: string
  email: string
  fullName: string
  role: "interviewer" | "candidate"
  avatarUrl?: string
}

export interface Interview {
  id: string
  title: string
  interviewerId: string
  candidateId?: string
  scheduledAt: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  roomCode: string
  notes?: string
  rating?: number
}

export interface Question {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  language: string
  starterCode: string
  testCases?: TestCase[]
}

export interface TestCase {
  input: string
  expectedOutput: string
}

export interface CodeHistory {
  id: string
  interviewId: string
  questionId: string
  code: string
  language: string
  output?: string
  executedAt: string
}

export interface Evaluation {
  overallRating: number
  criteria: {
    problemSolving: number
    codeQuality: number
    communication: number
    technicalKnowledge: number
  }
  feedback: string
}
