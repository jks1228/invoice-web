import type { BusinessInfo } from '@/types/invoice'

interface InvoicePartiesProps {
  clientName: string
  businessInfo?: BusinessInfo
}

export function InvoiceParties({
  clientName,
  businessInfo,
}: InvoicePartiesProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-1">
        <h2 className="text-muted-foreground text-sm font-medium">발행자</h2>
        {businessInfo ? (
          <div className="text-sm">
            <p className="font-semibold">{businessInfo.businessName}</p>
            {businessInfo.ownerName && <p>{businessInfo.ownerName}</p>}
            {businessInfo.address && (
              <p className="text-muted-foreground">{businessInfo.address}</p>
            )}
            {businessInfo.phone && (
              <p className="text-muted-foreground">{businessInfo.phone}</p>
            )}
            {businessInfo.email && (
              <p className="text-muted-foreground">{businessInfo.email}</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            발행자 정보를 불러올 수 없습니다.
          </p>
        )}
      </div>
      <div className="space-y-1">
        <h2 className="text-muted-foreground text-sm font-medium">
          클라이언트
        </h2>
        <p className="text-sm font-semibold">{clientName}</p>
      </div>
    </div>
  )
}
