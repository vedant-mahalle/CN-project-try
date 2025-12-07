"use client"

import { useRef } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Loader2, Terminal, Copy, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
]

interface CodeEditorProps {
  code: string
  language: string
  onChange: (value: string) => void
  onLanguageChange: (language: string) => void
  onRun: () => void
  isRunning: boolean
  output: string
}

export function CodeEditor({ code, language, onChange, onLanguageChange, onRun, isRunning, output }: CodeEditorProps) {
  const { toast } = useToast()
  const editorRef = useRef<any>(null)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code copied",
      description: "The code has been copied to your clipboard.",
    })
  }

  const clearCode = () => {
    onChange("")
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Editor Toolbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearCode}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={onRun} disabled={isRunning} size="sm">
          {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Run Code
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "Geist Mono, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbers: "on",
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Output Panel */}
      {output && (
        <div className="h-32 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Output</span>
          </div>
          <pre className="p-4 text-sm font-mono overflow-auto h-[calc(100%-40px)] text-foreground">{output}</pre>
        </div>
      )}
    </div>
  )
}
