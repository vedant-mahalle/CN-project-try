"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const CRITERIA = [
  { id: "problem-solving", label: "Problem Solving" },
  { id: "code-quality", label: "Code Quality" },
  { id: "communication", label: "Communication" },
  { id: "technical-knowledge", label: "Technical Knowledge" },
]

export function EvaluationPanel() {
  const { toast } = useToast()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState("")
  const [overallRating, setOverallRating] = useState(0)

  const handleRating = (criteriaId: string, rating: number) => {
    setRatings({ ...ratings, [criteriaId]: rating })
  }

  const handleSubmit = () => {
    toast({
      title: "Evaluation saved",
      description: "The interview evaluation has been saved successfully.",
    })
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="space-y-6 max-w-2xl">
        {/* Overall Rating */}
        <div>
          <Label className="text-sm font-medium">Overall Rating</Label>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setOverallRating(star)} className="p-1">
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    star <= overallRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Criteria Ratings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Detailed Evaluation</Label>
          {CRITERIA.map((criteria) => (
            <div key={criteria.id} className="flex items-center justify-between">
              <span className="text-sm">{criteria.label}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => handleRating(criteria.id, star)} className="p-0.5">
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        star <= (ratings[criteria.id] || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div>
          <Label htmlFor="feedback" className="text-sm font-medium">
            Feedback & Notes
          </Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your feedback for the candidate..."
            className="mt-2 min-h-[100px]"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Save Evaluation
        </Button>
      </div>
    </div>
  )
}
