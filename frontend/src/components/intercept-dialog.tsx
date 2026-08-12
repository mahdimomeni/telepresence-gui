import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
// import { InterceptWorkload } from "../../wailsjs/go/main/App" // Adjust path if needed

interface InterceptDialogProps {
  workloadName: string
  onSuccess?: () => void
}

export function InterceptDialog({ workloadName, onSuccess }: InterceptDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [port, setPort] = useState("8080")
  const [envFile, setEnvFile] = useState("")

  const handleIntercept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
    //   await InterceptWorkload({
    //     workload: workloadName,
    //     port: port,
    //     env_file: envFile,
    //   })
      
      toast.add({
        type: "success",
        description: `Successfully intercepted ${workloadName}`,
      })
      
      setOpen(false)
      if (onSuccess) onSuccess()
      
    } catch (error) {
      toast.add({
        type: "error",
        description: `Intercept failed: ${String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="default" size="sm">
          Intercept
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleIntercept}>
          <DialogHeader>
            <DialogTitle>Intercept Workload</DialogTitle>
            <DialogDescription>
              Configure local routing for <strong>{workloadName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">
                Local Port
              </Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 8080"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="envFile" className="text-right">
                Env File
              </Label>
              <Input
                id="envFile"
                value={envFile}
                onChange={(e) => setEnvFile(e.target.value)}
                className="col-span-3"
                placeholder="/path/to/.env (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" className="mr-2" />}
              Start Intercept
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}