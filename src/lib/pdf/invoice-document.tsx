import path from 'node:path'

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import { formatCurrency, formatDate } from '@/lib/format'
import { STATUS_LABEL, isOverdue } from '@/lib/invoice'
import type { Invoice } from '@/types/invoice'

// 로컬 폰트를 임베드한다(원격 CDN 의존 없이 서버 파일시스템에서 직접 읽음).
// 가변 폰트 1개로 정상/굵게 두 굵기를 모두 지정 — react-pdf가 렌더링 시 실제 쓰인 글자만 서브셋한다.
const FONT_PATH = path.join(
  process.cwd(),
  'assets/fonts/NotoSansKR-Variable.ttf'
)

Font.register({
  family: 'NotoSansKR',
  fonts: [
    { src: FONT_PATH, fontWeight: 'normal' },
    { src: FONT_PATH, fontWeight: 'bold' },
  ],
})
// 하이픈 자동 삽입 비활성화 — 한글은 음절 단위로 줄바꿈되면 되므로 영문식 하이픈 규칙이 불필요.
Font.registerHyphenationCallback(word => [word])

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    padding: 40,
    color: '#111111',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginBottom: 6,
  },
  overdueBadge: {
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#fdecec',
    color: '#c0392b',
    marginBottom: 6,
    marginLeft: 6,
  },
  badgeRow: { flexDirection: 'row' },
  metaLine: { fontSize: 9, color: '#666666' },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginBottom: 20,
  },
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  partyCol: { flex: 1 },
  partyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  partyLine: { fontSize: 9, color: '#666666', marginBottom: 1 },
  table: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowLast: { borderBottomWidth: 0 },
  colItemName: { flex: 3 },
  colDescription: { flex: 3, color: '#666666' },
  colUnitPrice: { flex: 2, textAlign: 'right' },
  colQuantity: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 2, textAlign: 'right', fontWeight: 'bold' },
  tableHeaderText: { fontSize: 9, fontWeight: 'bold' },
  summaryBox: {
    alignSelf: 'flex-end',
    width: 220,
    backgroundColor: '#f7f7f7',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 9, color: '#666666' },
  summaryValue: { fontSize: 9 },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    marginVertical: 4,
  },
  summaryTotalLabel: { fontSize: 11, fontWeight: 'bold' },
  summaryTotalValue: { fontSize: 11, fontWeight: 'bold' },
  notesTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#444444', lineHeight: 1.5 },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#999999',
  },
})

interface InvoicePdfDocumentProps {
  invoice: Invoice
  displaySubtotal: number
}

export function InvoicePdfDocument({
  invoice,
  displaySubtotal,
}: InvoicePdfDocumentProps) {
  const taxLabel =
    invoice.taxRate !== undefined && invoice.taxAmount
      ? `세금 (VAT ${invoice.taxRate}%)`
      : null
  const overdue = isOverdue(invoice.dueDate, invoice.status)
  const business = invoice.businessInfo

  return (
    <Document
      title={`${invoice.invoiceNumber} 견적서`}
      author={business?.businessName}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>견적서</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaRight}>
            <View style={styles.badgeRow}>
              <Text style={styles.statusBadge}>
                {STATUS_LABEL[invoice.status]}
              </Text>
              {overdue && <Text style={styles.overdueBadge}>기한 지남</Text>}
            </View>
            <Text style={styles.metaLine}>
              발행일 {formatDate(invoice.invoiceDate)}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.metaLine}>
                만료일 {formatDate(invoice.dueDate)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.label}>발행자</Text>
            {business ? (
              <>
                <Text style={styles.partyName}>{business.businessName}</Text>
                {business.ownerName && (
                  <Text style={styles.partyLine}>{business.ownerName}</Text>
                )}
                {business.address && (
                  <Text style={styles.partyLine}>{business.address}</Text>
                )}
                {business.phone && (
                  <Text style={styles.partyLine}>{business.phone}</Text>
                )}
                {business.email && (
                  <Text style={styles.partyLine}>{business.email}</Text>
                )}
              </>
            ) : (
              <Text style={styles.partyLine}>
                발행자 정보를 불러올 수 없습니다.
              </Text>
            )}
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.label}>클라이언트</Text>
            <Text style={styles.partyName}>{invoice.clientName}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colItemName, styles.tableHeaderText]}>
              항목명
            </Text>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>
              설명
            </Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderText]}>
              단가
            </Text>
            <Text style={[styles.colQuantity, styles.tableHeaderText]}>
              수량
            </Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>금액</Text>
          </View>
          {[...invoice.items]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((item, index, arr) => (
              <View
                key={item.id}
                wrap={false}
                style={[
                  styles.tableRow,
                  index === arr.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={styles.colItemName}>{item.itemName}</Text>
                <Text style={styles.colDescription}>
                  {item.description ?? '-'}
                </Text>
                <Text style={styles.colUnitPrice}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.colQuantity}>{item.quantity}</Text>
                <Text style={styles.colAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
        </View>

        <View style={styles.summaryBox} wrap={false}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>소계</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(displaySubtotal)}
            </Text>
          </View>
          {taxLabel && (
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>{taxLabel}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.taxAmount ?? 0)}
              </Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTotalLabel}>총액</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View wrap={false}>
            <Text style={styles.notesTitle}>참고사항</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
          }
          fixed
        />
      </Page>
    </Document>
  )
}
