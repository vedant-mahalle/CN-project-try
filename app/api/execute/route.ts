import { type NextRequest, NextResponse } from "next/server"

// JDoodle API credentials - in production, use environment variables
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || "demo"
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || "demo"

const LANGUAGE_CONFIG: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: "nodejs", versionIndex: "4" },
  typescript: { language: "typescript", versionIndex: "0" },
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
  c: { language: "c", versionIndex: "5" },
  go: { language: "go", versionIndex: "4" },
  rust: { language: "rust", versionIndex: "4" },
}

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 })
    }

    const langConfig = LANGUAGE_CONFIG[language]
    if (!langConfig) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 })
    }

    // For demo purposes, execute JavaScript locally
    if (language === "javascript" && JDOODLE_CLIENT_ID === "demo") {
      try {
        // Create a safe execution environment
        const logs: string[] = []
        const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(String).join(" ")),
          error: (...args: any[]) => logs.push("Error: " + args.map(String).join(" ")),
          warn: (...args: any[]) => logs.push("Warning: " + args.map(String).join(" ")),
        }

        // Execute the code with the mock console
        const fn = new Function("console", code)
        fn(mockConsole)

        return NextResponse.json({
          output: logs.join("\n") || "Code executed successfully (no output)",
          executionTime: "< 1s",
        })
      } catch (err: any) {
        return NextResponse.json({
          output: `Error: ${err.message}`,
          executionTime: "< 1s",
        })
      }
    }

    // Use JDoodle API for code execution
    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({
      output: data.output || "No output",
      executionTime: data.cpuTime ? `${data.cpuTime}s` : "N/A",
      memory: data.memory ? `${data.memory} KB` : "N/A",
    })
  } catch (error) {
    console.error("Code execution error:", error)
    return NextResponse.json({ error: "Failed to execute code" }, { status: 500 })
  }
}
