import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, ArrowRight } from "lucide-react"

export default function DemoPage() {
  const demoRoomCode = "DEMO123"

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md p-8">
        <div className="inline-flex items-center gap-2 mb-8">
          <Code2 className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold">CodeInterview</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">Try the Demo</h1>
        <p className="text-muted-foreground mb-8">
          Experience our interview platform with a live demo. No sign up required.
        </p>

        <div className="space-y-4">
          <Link href={`/interview/${demoRoomCode}`}>
            <Button size="lg" className="w-full">
              Enter Demo Interview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" size="lg" className="w-full bg-transparent">
              Back to Home
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          The demo includes video calling, collaborative coding, and code execution features.
        </p>
      </div>
    </div>
  )
}
