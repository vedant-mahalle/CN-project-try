"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  starterCode: string
  language: string
}

interface QuestionsPanelProps {
  questions: Question[]
  selectedQuestion: Question
  onSelect: (question: Question) => void
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  hard: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
}

export function QuestionsPanel({ questions, selectedQuestion, onSelect }: QuestionsPanelProps) {
  return (
    <div className="h-full flex">
      {/* Question List */}
      <div className="w-64 border-r border-border">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-sm">Questions ({questions.length})</h3>
        </div>
        <ScrollArea className="h-[calc(100%-49px)]">
          <div className="p-2 space-y-1">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => onSelect(question)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedQuestion.id === question.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {index + 1}. {question.title}
                  </span>
                </div>
                <Badge className={cn("text-xs", difficultyColors[question.difficulty])}>{question.difficulty}</Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Question Details */}
      <div className="flex-1">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{selectedQuestion.title}</h2>
            <Badge className={cn(difficultyColors[selectedQuestion.difficulty])}>{selectedQuestion.difficulty}</Badge>
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-73px)]">
          <div className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedQuestion.description.split("\n").map((line, i) => (
                <p key={i} className="whitespace-pre-wrap mb-2">
                  {line.startsWith("**") ? <strong>{line.replace(/\*\*/g, "")}</strong> : line}
                </p>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
