import * as React from "react";
import { Input } from "@/components/ui/input";
import { TextContextMenu } from "@/components/text-context-menu";

export const ContextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    // Combine forwarded ref and internal ref
    React.useImperativeHandle(ref, () => internalRef.current!);

    return (
      <TextContextMenu targetRef={internalRef} className={props.className}>
        <Input ref={internalRef} {...props} />
      </TextContextMenu>
    );
  }
);

ContextInput.displayName = "ContextInput";
