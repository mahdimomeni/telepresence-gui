import * as React from "react"
import { Field, FieldLabel } from "./ui/field"
import { ButtonGroup } from "./ui/button-group"
import { ContextInput } from "./context-input"
import { Button } from "./ui/button"
import { Folder } from "lucide-react"

interface BrowseInputProps {
  label: string
  id: string
  placeholder: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onBrowse: React.MouseEventHandler
}



export function BrowseInput({ label, id, placeholder, name, value, onChange, onBrowse }: BrowseInputProps) {

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <ButtonGroup className="w-full">
        <ContextInput
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="rounded-r-none w-full"
        />
        <Button
          variant="outline"
          onClick={onBrowse}
          size="icon"
          className="rounded-l-none"
        >
          <Folder />
        </Button>
      </ButtonGroup>
    </Field>
  )
}