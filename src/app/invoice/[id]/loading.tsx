import { Container } from '@/components/layout/container'
import { InvoiceSkeleton } from '@/components/invoice/invoice-skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function InvoiceLoadingPage() {
  return (
    <Container className="py-12">
      <Card>
        <CardContent className="space-y-8 sm:p-8">
          <InvoiceSkeleton />
        </CardContent>
      </Card>
    </Container>
  )
}
