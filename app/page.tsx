import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Video, Users, Clock, CheckCircle, Shield } from "lucide-react"

export default function HomePage() {
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
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl mx-auto">
          Technical Interviews Made Simple
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Conduct seamless technical interviews with live video, collaborative coding, and real-time code execution. All
          in one platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Video className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Live Video Calls</CardTitle>
              <CardDescription>
                Crystal clear WebRTC-based video conferencing with screen sharing capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Code2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Collaborative Editor</CardTitle>
              <CardDescription>
                Real-time code collaboration with syntax highlighting for 40+ languages.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Code Execution</CardTitle>
              <CardDescription>Run code instantly with our secure, isolated execution environment.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Question Bank</CardTitle>
              <CardDescription>Curated library of coding questions across all difficulty levels.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Timer & Notes</CardTitle>
              <CardDescription>Built-in timer and note-taking for structured interview sessions.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>End-to-end encryption with automatic interview recording options.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 CodeInterview. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
