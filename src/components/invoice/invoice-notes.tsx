interface InvoiceNotesProps {
  notes?: string
}

export function InvoiceNotes({ notes }: InvoiceNotesProps) {
  if (!notes) return null

  return (
    <div className="space-y-1">
      <h2 className="text-muted-foreground text-sm font-medium">참고사항</h2>
      <p className="text-sm whitespace-pre-wrap">{notes}</p>
    </div>
  )
}
