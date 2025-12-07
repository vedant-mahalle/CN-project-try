"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { VideoPanel } from "./video-panel"
import { CodeEditor } from "./code-editor"
import { QuestionsPanel } from "./questions-panel"
import { InterviewHeader } from "./interview-header"
import { NotesPanel } from "./notes-panel"
import { EvaluationPanel } from "./evaluation-panel"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Question {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  starterCode: string
  language: string
}

const sampleQuestions: Question[] = [
  {
    id: "1",
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]

**Example 3:**
Input: nums = [3,3], target = 6
Output: [0,1]`,
    difficulty: "easy",
    starterCode: `function twoSum(nums, target) {
  // Write your solution here
  
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6)); // Expected: [1, 2]`,
    language: "javascript",
  },
  {
    id: "2",
    title: "Valid Parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true

**Example 3:**
Input: s = "(]"
Output: false`,
    difficulty: "easy",
    starterCode: `function isValid(s) {
  // Write your solution here
  
}

// Test cases
console.log(isValid("()")); // Expected: true
console.log(isValid("()[]{}")); // Expected: true
console.log(isValid("(]")); // Expected: false`,
    language: "javascript",
  },
  {
    id: "3",
    title: "Reverse Linked List",
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

**Example 2:**
Input: head = [1,2]
Output: [2,1]

**Example 3:**
Input: head = []
Output: []`,
    difficulty: "medium",
    starterCode: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  // Write your solution here
  
}`,
    language: "javascript",
  },
]

interface InterviewRoomProps {
  roomCode: string
}

export function InterviewRoom({ roomCode }: InterviewRoomProps) {
  const searchParams = useSearchParams()
  const role = (searchParams.get("role") as "interviewer" | "candidate" | null) ?? "candidate"
  const isInterviewer = role === "interviewer"

  const [selectedQuestion, setSelectedQuestion] = useState<Question>(sampleQuestions[0])
  const [code, setCode] = useState(sampleQuestions[0].starterCode)
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("questions")
  const [notes, setNotes] = useState("")
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestion(question)
    setCode(question.starterCode)
    setLanguage(question.language)
    setOutput("")
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput("Running code...")

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      })
      const data = await response.json()
      setOutput(data.output || data.error || "No output")
    } catch (error) {
      setOutput("Error executing code. Please try again.")
    } finally {
      setIsRunning(false)
    }
  }

  const candidateView = (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - Video */}
        <ResizablePanel defaultSize={32} minSize={22}>
          <div className="h-full flex flex-col">
            <VideoPanel roomCode={roomCode} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Code Editor + Questions */}
        <ResizablePanel defaultSize={68}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65}>
              <CodeEditor
                code={code}
                language={language}
                onChange={setCode}
                onLanguageChange={setLanguage}
                onRun={handleRunCode}
                isRunning={isRunning}
                output={output}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={35}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2">
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>
                <TabsContent value="questions" className="flex-1 m-0 overflow-hidden">
                  <QuestionsPanel
                    questions={sampleQuestions}
                    selectedQuestion={selectedQuestion}
                    onSelect={handleQuestionSelect}
                  />
                </TabsContent>
                <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
                  <NotesPanel notes={notes} onChange={setNotes} />
                </TabsContent>
                <TabsContent value="evaluation" className="flex-1 m-0 overflow-hidden">
                  <EvaluationPanel />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )

  const interviewerView = (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={60}>
          <div className="h-full flex flex-col">
            <VideoPanel roomCode={roomCode} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={25}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="code">Code view</TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="flex-1 m-0 overflow-hidden">
              <QuestionsPanel
                questions={sampleQuestions}
                selectedQuestion={selectedQuestion}
                onSelect={handleQuestionSelect}
              />
            </TabsContent>
            <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
              <NotesPanel notes={notes} onChange={setNotes} />
            </TabsContent>
            <TabsContent value="evaluation" className="flex-1 m-0 overflow-hidden">
              <EvaluationPanel />
            </TabsContent>
            <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
              <div className="h-full overflow-auto bg-muted/30 p-3 font-mono text-sm">
                <div className="mb-2 text-xs uppercase text-muted-foreground">Candidate code (local view)</div>
                <pre className="whitespace-pre-wrap break-words">{code}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-background">
      <InterviewHeader
        roomCode={roomCode}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        onTimerToggle={() => setIsTimerRunning(!isTimerRunning)}
        onTimerReset={() => setTimerSeconds(0)}
      />

      {isInterviewer ? interviewerView : candidateView}
    </div>
  )
}
