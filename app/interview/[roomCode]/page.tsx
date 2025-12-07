"use client"

import * as React from "react"
import { InterviewRoom } from "@/components/interview/interview-room"

interface InterviewPageProps {
  params: Promise<{ roomCode: string }>
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const resolvedParams = React.use(params)
  return <InterviewRoom roomCode={resolvedParams.roomCode} />
}
