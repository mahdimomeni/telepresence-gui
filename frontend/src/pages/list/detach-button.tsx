import { useLoadingStore } from "@/stores/useLoadingStore";
import { models } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CoreService } from "@/services/core";
import { TelepresenceService } from "@/services/telepresence";

export function DetachButton({ workload, onFetchWorkloads }: { workload: models.Workload; onFetchWorkloads: () => void }) {
  const isDetaching = useLoadingStore((state) => state.isLoading(`detach-${workload.name}`))
  const startLoading = useLoadingStore((state) => state.startLoading)
  const stopLoading = useLoadingStore((state) => state.stopLoading)

  const handleDetach = async () => {
    startLoading(`detach-${workload.name}`)
    try {
      await TelepresenceService.detachWorkload({
        attachment_name: workload.name,
        namespace: workload.namespace
      })
      CoreService.notify("Telepresence Detach Active", `Successfully detached ${workload.name}`)
      onFetchWorkloads()
    } catch (error) {
      CoreService.notify("Telepresence Detach Error", `Detach failed: ${String(error)}`)
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