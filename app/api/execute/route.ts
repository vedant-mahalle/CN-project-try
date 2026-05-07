import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "node:child_process"
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { z } from "zod"
import { getAuthFromNextRequest, setAuthCookiesForNextResponse } from "@/lib/auth-server"
import { findUserById, getSession } from "@/lib/auth-store"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/request-security"

const requestSchema = z.object({
  code: z.string().min(1).max(10000),
  language: z.string().min(1).max(20),
})

const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET

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

const EXEC_TIMEOUT_MS = 10_000

const TS_NODE_BIN = join(process.cwd(), "node_modules", ".bin", "ts-node")

function runLocally(code: string, language: string): { output: string; executionTime: string } {
  const tmpId = randomBytes(8).toString("hex")
  const tmpDir = `/tmp/ci_exec_${tmpId}`
  mkdirSync(tmpDir, { recursive: true })

  try {
    let cmd: string

    switch (language) {
      case "javascript": {
        const f = join(tmpDir, "code.js")
        writeFileSync(f, code)
        cmd = `node "${f}"`
        break
      }
      case "typescript": {
        const f = join(tmpDir, "code.ts")
        writeFileSync(f, code)
        cmd = `"${TS_NODE_BIN}" --skipProject "${f}"`
        break
      }
      case "python": {
        const f = join(tmpDir, "code.py")
        writeFileSync(f, code)
        cmd = `python3 "${f}"`
        break
      }
      case "java": {
        const classMatch = code.match(/public\s+class\s+(\w+)/)
        const className = classMatch?.[1] ?? "Main"
        const f = join(tmpDir, `${className}.java`)
        writeFileSync(f, code)
        cmd = `javac "${f}" && java -cp "${tmpDir}" ${className}`
        break
      }
      case "cpp": {
        const f = join(tmpDir, "code.cpp")
        const out = join(tmpDir, "a.out")
        writeFileSync(f, code)
        cmd = `g++ -o "${out}" "${f}" && "${out}"`
        break
      }
      case "c": {
        const f = join(tmpDir, "code.c")
        const out = join(tmpDir, "a.out")
        writeFileSync(f, code)
        cmd = `gcc -o "${out}" "${f}" && "${out}"`
        break
      }
      case "go": {
        const f = join(tmpDir, "code.go")
        writeFileSync(f, code)
        cmd = `go run "${f}"`
        break
      }
      case "rust": {
        const f = join(tmpDir, "code.rs")
        const out = join(tmpDir, "code_out")
        writeFileSync(f, code)
        cmd = `rustc -o "${out}" "${f}" && "${out}"`
        break
      }
      default:
        return { output: `Unsupported language: ${language}`, executionTime: "N/A" }
    }

    const start = Date.now()
    let output: string
    try {
      output = execSync(`${cmd} 2>&1`, {
        timeout: EXEC_TIMEOUT_MS,
        encoding: "utf8",
        shell: "/bin/bash",
        env: { ...process.env, HOME: process.env.HOME ?? "/tmp" },
      })
    } catch (err: any) {
      const out = (err.stdout ?? "").trim()
      return { output: out || err.message || "Execution failed", executionTime: "N/A" }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2)
    return {
      output: output.trim() || "Code executed successfully (no output)",
      executionTime: `${elapsed}s`,
    }
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}

export async function POST(request: NextRequest) {
  if (!enforceSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  if (!enforceRateLimit(request, "execute", 25, 1.2)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const auth = getAuthFromNextRequest(request)

  try {
    const { code, language } = requestSchema.parse(await request.json())

    const langConfig = LANGUAGE_CONFIG[language]
    if (!langConfig) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 })
    }

    let result: NextResponse

    if (JDOODLE_CLIENT_ID && JDOODLE_CLIENT_SECRET) {
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
      if (!response.ok || data.error) {
        return NextResponse.json({ error: data.error || "Execution failed" }, { status: 400 })
      }

      result = NextResponse.json({
        output: data.output || "No output",
        executionTime: data.cpuTime ? `${data.cpuTime}s` : "N/A",
        memory: data.memory ? `${data.memory} KB` : "N/A",
      })
    } else {
      const { output, executionTime } = runLocally(code, language)
      result = NextResponse.json({ output, executionTime })
    }

    if (auth?.refreshed && auth.refreshTokenId) {
      const user = findUserById(auth.user.id)
      const session = getSession(auth.sessionId)
      if (user && session) {
        setAuthCookiesForNextResponse(result, user, session.id, auth.refreshTokenId)
      }
    }

    return result
  } catch (error) {
    console.error("Code execution error:", error)
    return NextResponse.json({ error: "Failed to execute code" }, { status: 500 })
  }
}
