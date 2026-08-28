import { CheckCheck, ClipboardPaste, Copy, Redo2, Scissors, Trash2, Undo2 } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useState } from "react";

interface TextContextMenuProps {
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  className: string | undefined;
}

export function TextContextMenu({ children, targetRef, className }: TextContextMenuProps) {
  const [canCopy, setCanCopy] = useState(false);
  const [canSelectAll, setCanSelectAll] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && targetRef.current) {
      const el = targetRef.current;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const totalLength = el.value.length;
      const isPassword = el.type === "password";

      const selectedLength = end - start;

      setCanCopy(selectedLength > 0 && !isPassword);

      const isEverythingSelected = totalLength > 0 && selectedLength === totalLength;
      const isEmpty = totalLength === 0;

      setCanSelectAll(!isEmpty && !isEverythingSelected);
    }
  };

  const handleCut = async () => {
    const el = targetRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selectedText = el.value.substring(start, end);

    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
      el.setRangeText("", start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handleCopy = async () => {
    const el = targetRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selectedText = el.value.substring(start, end);

    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
    }
  };

  const handlePaste = async () => {
    const el = targetRef.current;
    if (!el) return;

    try {
      const text = await navigator.clipboard.readText();
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;

      el.setRangeText(text, start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    } catch {
      console.warn("Clipboard read permission denied");
    }
  };

  const handleDelete = () => {
    const el = targetRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    if (start !== end) {
      el.setRangeText("", start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    }
  };

  const handleSelectAll = () => {
    const el = targetRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

  const executeCommand = (command: "undo" | "redo") => {
    if (typeof document !== "undefined") {
      // Cast to access the method without triggering the TS deprecation notice
      const doc = document as unknown as {
        execCommand?: (commandId: string, showUI?: boolean, value?: string) => boolean;
      };
      doc.execCommand?.(command, false);
    }
  };

  const handleUndo = () => {
    targetRef.current?.focus();
    executeCommand("undo");
  };

  const handleRedo = () => {
    targetRef.current?.focus();
    executeCommand("redo");
  };

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem onClick={handleUndo}>
            <Undo2 />
            Undo
          </ContextMenuItem>
          <ContextMenuItem onClick={handleRedo}>
            <Redo2 />
            Redo
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem onClick={handleCut} disabled={!canCopy}>
            <Scissors />
            Cut
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopy} disabled={!canCopy}>
            <Copy />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={handlePaste}>
            <ClipboardPaste />
            Paste
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDelete} variant="destructive" disabled={!canCopy}>
            <Trash2 />
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem onClick={handleSelectAll} disabled={!canSelectAll}>
            <CheckCheck />
            Select All
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
