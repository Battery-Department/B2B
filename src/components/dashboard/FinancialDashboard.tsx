import React from 'react'
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react'

// Design System Colors
const colors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#6B7280',
  gray500: '#9CA3AF',
  gray400: '#D1D5DB',
  gray300: '#E5E7EB',
  gray200: '#F3F4F6',
  gray100: '#F9FAFB',
  
  white: '#FFFFFF',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE'
}

const typography = {
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.gray900,
    lineHeight: '28px'
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: '400',
    color: colors.gray600,
    lineHeight: '16px'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.gray900,
    lineHeight: '32px'
  },
  body: {
    fontSize: '14px',
    fontWeight: '400',
    color: colors.gray700,
    lineHeight: '20px'
  },
  small: {
    fontSize: '12px',
    fontWeight: '400',
    color: colors.gray600,
    lineHeight: '16px'
  }
}

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
}

const componentStyles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: '8px',
    padding: spacing.md,
    border: `1px solid ${colors.gray300}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  }
}

interface FinancialDashboardProps {
  onViewDetails?: () => void
  onMakePayment?: () => void
  onDownloadInvoice?: () => void
}

export default function FinancialDashboard({ 
  onViewDetails, 
  onMakePayment,
  onDownloadInvoice 
}: FinancialDashboardProps) {
  // Mock financial data - in real app, this would come from API
  const financialData = {
    currentBalance: 3875.50,
    creditLimit: 50000,
    availableCredit: 46124.50,
    lastPayment: {
      amount: 5200.00,
      date: 'May 15, 2024'
    },
    nextPaymentDue: {
      amount: 3875.50,
      date: 'June 15, 2024',
      daysUntil: 14
    },
    monthlySpending: {
      current: 4875.00,
      previous: 4333.00,
      change: 12.5
    },
    paymentTerms: 'Net 30',
    accountStatus: 'good_standing',
    recentTransactions: [
      { id: 1, date: 'May 28', description: 'Order #BD-2405-001', amount: -3150.00, type: 'charge' },
      { id: 2, date: 'May 26', description: 'Order #BD-2405-002', amount: -1225.00, type: 'charge' },
      { id: 3, date: 'May 15', description: 'Payment received', amount: 5200.00, type: 'payment' },
      { id: 4, date: 'May 14', description: 'Order #BD-2405-008', amount: -2925.00, type: 'charge' }
    ]
  }

  const creditUtilization = ((financialData.creditLimit - financialData.availableCredit) / financialData.creditLimit) * 100

  return (
    <div style={componentStyles.card}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <h3 style={typography.sectionHeader}>
          Financial Overview
        </h3>
        <button
          onClick={onViewDetails}
          style={{
            ...typography.small,
            color: colors.primary,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: spacing.xs,
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray100
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          View Details
          <ArrowUpRight size={12} />
        </button>
      </div>

      {/* Account Status */}
      <div style={{
        padding: spacing.md,
        backgroundColor: colors.successLight,
        borderRadius: '6px',
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm
      }}>
        <CheckCircle size={16} color={colors.success} />
        <span style={{ ...typography.body, color: colors.success, fontWeight: '500' }}>
          Account in Good Standing
        </span>
      </div>

      {/* Balance Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        {/* Current Balance */}
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.gray100,
          borderRadius: '6px',
          border: `1px solid ${colors.gray200}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <DollarSign size={16} color={colors.gray600} />
            <span style={typography.cardLabel}>Current Balance</span>
          </div>
          <p style={{ ...typography.metricValue, marginBottom: spacing.xs }}>
            ${financialData.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {financialData.nextPaymentDue.daysUntil <= 7 && (
            <p style={{ 
              ...typography.small, 
              color: colors.warning,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <AlertCircle size={12} />
              Due in {financialData.nextPaymentDue.daysUntil} days
            </p>
          )}
        </div>

        {/* Available Credit */}
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.gray100,
          borderRadius: '6px',
          border: `1px solid ${colors.gray200}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <CreditCard size={16} color={colors.gray600} />
            <span style={typography.cardLabel}>Available Credit</span>
          </div>
          <p style={{ ...typography.metricValue, marginBottom: spacing.xs }}>
            ${financialData.availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={typography.small}>
            of ${(financialData.creditLimit / 1000).toFixed(0)}k limit
          </p>
        </div>
      </div>

      {/* Credit Utilization Bar */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.sm
        }}>
          <span style={typography.cardLabel}>Credit Utilization</span>
          <span style={{ 
            ...typography.small, 
            fontWeight: '600',
            color: creditUtilization > 80 ? colors.error : creditUtilization > 60 ? colors.warning : colors.success
          }}>
            {creditUtilization.toFixed(1)}%
          </span>
        </div>
        <div style={{
          height: '8px',
          backgroundColor: colors.gray200,
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${creditUtilization}%`,
            backgroundColor: creditUtilization > 80 ? colors.error : creditUtilization > 60 ? colors.warning : colors.success,
            transition: 'width 0.5s ease',
            borderRadius: '4px'
          }} />
        </div>
      </div>

      {/* Payment Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        {/* Last Payment */}
        <div>
          <p style={{ ...typography.cardLabel, marginBottom: spacing.xs }}>Last Payment</p>
          <p style={{ ...typography.body, fontWeight: '600' }}>
            ${financialData.lastPayment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={typography.small}>{financialData.lastPayment.date}</p>
        </div>

        {/* Next Payment Due */}
        <div>
          <p style={{ ...typography.cardLabel, marginBottom: spacing.xs }}>Next Payment Due</p>
          <p style={{ ...typography.body, fontWeight: '600' }}>
            ${financialData.nextPaymentDue.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style={typography.small}>{financialData.nextPaymentDue.date}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ marginBottom: spacing.lg }}>
        <h4 style={{ ...typography.body, fontWeight: '600', marginBottom: spacing.md }}>
          Recent Transactions
        </h4>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: spacing.sm
        }}>
          {financialData.recentTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.sm,
                backgroundColor: colors.gray50,
                borderRadius: '4px',
                border: `1px solid ${colors.gray200}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                {transaction.type === 'payment' ? (
                  <ArrowDownRight size={14} color={colors.success} />
                ) : (
                  <ArrowUpRight size={14} color={colors.gray600} />
                )}
                <div>
                  <p style={{ ...typography.body, fontSize: '13px' }}>{transaction.description}</p>
                  <p style={typography.small}>{transaction.date}</p>
                </div>
              </div>
              <span style={{
                ...typography.body,
                fontWeight: '600',
                color: transaction.type === 'payment' ? colors.success : colors.gray900
              }}>
                {transaction.type === 'payment' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Spending Trend */}
      <div style={{
        padding: spacing.md,
        backgroundColor: colors.gray100,
        borderRadius: '6px',
        marginBottom: spacing.lg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={typography.cardLabel}>Monthly Spending</p>
          <p style={{ ...typography.body, fontWeight: '600', fontSize: '16px' }}>
            ${financialData.monthlySpending.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          color: financialData.monthlySpending.change > 0 ? colors.error : colors.success
        }}>
          {financialData.monthlySpending.change > 0 ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
          <span style={{ ...typography.small, fontWeight: '600' }}>
            {Math.abs(financialData.monthlySpending.change)}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <button
          onClick={onMakePayment}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <CreditCard size={16} />
          Make Payment
        </button>
        <button
          onClick={onDownloadInvoice}
          style={{
            flex: 1,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.white,
            color: colors.gray700,
            border: `1px solid ${colors.gray300}`,
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray100
            e.currentTarget.style.borderColor = colors.gray400
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.white
            e.currentTarget.style.borderColor = colors.gray300
          }}
        >
          <FileText size={16} />
          Download Statement
        </button>
      </div>
    </div>
  )
}