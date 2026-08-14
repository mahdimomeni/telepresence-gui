import { useLoadingStore } from "@/stores/useLoadingStore";
import { DetachWorkload, Notify } from "../../../wailsjs/go/app/App";
import { models } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function DetachButton({ workload, onFetchWorkloads }: { workload: models.Workload; onFetchWorkloads: () => void }) {
  const isDetaching = useLoadingStore((state) => state.isLoading(`detach-${workload.name}`))
  const startLoading = useLoadingStore((state) => state.startLoading)
  const stopLoading = useLoadingStore((state) => state.stopLoading)

  const handleDetach = async () => {
    startLoading(`detach-${workload.name}`)
    try {
      await DetachWorkload({
        attachment_name: workload.name,
        namespace: workload.namespace
      })
      Notify("Telepresence Detach Active", `Successfully detached ${workload.name}`)
      onFetchWorkloads()
    } catch (error) {
      Notify("Telepresence Detach Error", `Detach failed: ${String(error)}`)
    } finally {
      stopLoading(`detach-${workload.name}`)
    }
  }

  return (
    <Button variant="destructive" onClick={handleDetach} disabled={isDetaching}>
      {isDetaching && <Spinner className="mr-2" />}
      Detach
    </Button>
  )
}