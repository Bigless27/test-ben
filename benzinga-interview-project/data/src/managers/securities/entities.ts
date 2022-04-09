import { StockSymbol } from '../../entities';

export interface InstrumentIdentifier {
  asOf: string;
  shareClassId: string;
}

export interface AlphaBeta {
  alpha: number;
  beta: number;
  id: InstrumentIdentifier;
}

export interface FinancialId {
  aorRestate: string;
  asOf: string;
  companyId: string;
  period: string;
  reportType: string;
}

export interface BalanceSheet {
  accountsPayable: number;
  accountsReceivable: number;
  accumulatedDepreciation: number;
  capitalStock: number;
  cashAndCashEquivalents: number;
  cashCashEquivalentsAndMarketableSecurities: number;
  commercialPaper: number;
  commonStock: number;
  commonStockEquity: number;
  currencyId: string;
  currentAccruedExpenses: number;
  currentAssets: number;
  currentDebt: number;
  currentDebtAndCapitalLeaseObligation: number;
  currentDeferredLiabilities: number;
  currentDeferredRevenue: number;
  currentLiabilities: number;
  fiscalYearEnd: number;
  gainsLossesNotAffectingRetainedEarnings: number;
  goodwill: number;
  goodwillAndOtherIntangibleAssets: number;
  grossPpe: number;
  id: FinancialId;
  inventory: number;
  investedCapital: number;
  investmentsAndAdvances: number;
  isCalculated: false;
  landAndImprovements: number;
  leases: number;
  longTermDebt: number;
  longTermDebtAndCapitalLeaseObligation: number;
  machineryFurnitureEquipment: number;
  netDebt: number;
  netPpe: number;
  netTangibleAssets: number;
  nonCurrentDeferredLiabilities: number;
  nonCurrentDeferredRevenue: number;
  nonCurrentDeferredTaxesLiabilities: number;
  ordinarySharesNumber: number;
  otherCapitalStock: number;
  otherCurrentAssets: number;
  otherCurrentBorrowings: number;
  otherCurrentLiabilities: number;
  otherIntangibleAssets: number;
  otherNonCurrentAssets: number;
  otherNonCurrentLiabilities: number;
  otherPayable: number;
  otherProperties: number;
  otherReceivables: number;
  otherShortTermInvestments: number;
  payables: number;
  payablesAndAccruedExpenses: number;
  periodEndingDate: string;
  receivables: number;
  retainedEarnings: number;
  shareIssued: number;
  stockholdersEquity: number;
  tangibleBookValue: number;
  totalAssets: number;
  totalCapitalization: number;
  totalDebt: number;
  totalEquity: number;
  totalEquityGrossMinorityInterest: number;
  totalLiabilities: number;
  totalLiabilitiesNetMinorityInterest: number;
  totalNonCurrentAssets: number;
  totalNonCurrentLiabilities: number;
  totalNonCurrentLiabilitiesNetMinorityInterest: number;
  workingCapital: number;
}

export interface CashFlowStatement {
  beginningCashPosition: number;
  capitalExpenditure: number;
  cashDividendsPaid: number;
  changeInAccountPayable: number;
  changeInInventory: number;
  changeInOtherWorkingCapital: number;
  changeInPayable: number;
  changeInPayablesAndAccruedExpense: number;
  changeInReceivables: number;
  changeInWorkingCapital: number;
  changesInAccountReceivables: number;
  changesInCash: number;
  commonStockIssuance: number;
  commonStockPayments: number;
  currencyId: 'USD';
  deferredIncomeTax: number;
  deferredTax: number;
  depreciationAmortizationDepletion: number;
  depreciationAndAmortization: number;
  endCashPosition: number;
  financingCashFlow: number;
  fiscalYearEnd: number;
  freeCashFlow: number;
  id: FinancialId;
  incomeTaxPaidSupplementalData: number;
  interestPaidSupplementalData: number;
  investingCashFlow: number;
  isCalculated: boolean;
  issuanceOfCapitalStock: number;
  longTermDebtPayments: number;
  netBusinessPurchaseAndSale: number;
  netCommonStockIssuance: number;
  netIncome: number;
  netIncomeFromContinuingOperations: number;
  netIntangiblesPurchaseAndSale: number;
  netInvestmentPurchaseAndSale: number;
  netIssuancePaymentsOfDebt: number;
  netLongTermDebtIssuance: number;
  netOtherFinancingCharges: number;
  netOtherInvestingChanges: number;
  netPpePurchaseAndSale: number;
  netShortTermDebtIssuance: number;
  operatingCashFlow: number;
  otherNonCashItems: number;
  periodEndingDate: string;
  purchaseOfBusiness: number;
  purchaseOfIntangibles: number;
  purchaseOfInvestment: number;
  purchaseOfPpe: number;
  purchaseOfShortTermInvestments: number;
  repaymentOfDebt: number;
  repurchaseOfCapitalStock: number;
  saleOfInvestment: number;
  saleOfShortTermInvestments: number;
  stockBasedCompensation: number;
}

export interface IncomeStatement {
  costOfRevenue: number;
  currencyId: string;
  ebit: number;
  ebitda: number;
  fiscalYearEnd: number;
  grossProfit: number;
  id: FinancialId;
  interestExpense: number;
  interestExpenseNonOperating: number;
  interestIncome: number;
  interestIncomeNonOperating: number;
  interestandSimilarIncome: number;
  isCalculated: boolean;
  netIncome: number;
  netIncomeCommonStockholders: number;
  netIncomeContinuousOperations: number;
  netIncomeFromContinuingAndDiscontinuedOperation: number;
  netIncomeFromContinuingOperationNetMinorityInterest: number;
  netIncomeIncludingNoncontrollingInterests: number;
  netInterestIncome: number;
  netNonOperatingInterestIncomeExpense: number;
  nonOperatingExpenses: number;
  nonOperatingIncome: number;
  normalizedEbitda: number;
  normalizedIncome: number;
  operatingExpense: number;
  operatingIncome: number;
  operatingRevenue: number;
  otherIncomeExpense: number;
  periodEndingDate: string;
  pretaxIncome: number;
  reconciledCostOfRevenue: number;
  reconciledDepreciation: number;
  researchAndDevelopment: number;
  sellingGeneralAndAdministration: number;
  taxProvision: number;
  totalExpenses: number;
  totalRevenue: number;
}

export interface Financial {
  aorRestate: string;
  asOf: string;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  incomeStatement: IncomeStatement;
  period: string;
  reportType: string;
}

export interface EarningRatio {
  dilutedContEpsGrowth: number;
  dilutedEpsGrowth: number;
  dpsGrowth: number;
  equityPerShareGrowth: number;
  fiscalYearEnd: number;
}

export interface EarningReport {
  basicAverageShares: number;
  basicContinuousOperations: number;
  basicEps: number;
  continuingAndDiscontinuedBasicEps: number;
  continuingAndDiscontinuedDilutedEps: number;
  currencyId: string;
  dilutedAverageShares: number;
  dilutedContinuousOperations: number;
  dilutedEps: number;
  dividendPerShare: number;
  fiscalYearEnd: number;
  id: FinancialId;
  normalizedBasicEps: number;
  normalizedDilutedEps: number;
}

export interface Company {
  cik: string;
  countryId: string;
  cusip: string;
  isin: string;
  primaryExchange: string;
  primarySymbol: StockSymbol;
  sedol: string;
  standardName: string;
  valoren: string;
}

export interface CompanyProfile {
  address1: string;
  city: string;
  companyStatus: string;
  country: string;
  countryId: string;
  fax: string;
  fiscalYearEnd: string;
  homepage: string;
  legalName: string;
  longDescription: string;
  phone: string;
  postalCode: string;
  province: string;
  shortDescription: string;
  shortName: string;
  standardName: string;
}

export interface AssetClassification {
  msGroupCode: number;
  msGroupName: string;
  msIndustryCode: number;
  msIndustryName: string;
  msSectorCode: number;
  msSectorName: string;
  msSuperSectorCode: number;
  msSuperSectorName: string;
  naics: string;
  naicsName: string;
  sic: string;
  sicName: string;
}

export interface ShareClass {
  currency: string;
  ipoDate: number;
  isDepositaryReceipt: boolean;
  isPrimary: true;
  securityType: string;
  shareClassId: string;
}

export interface ShareClassProfile {
  asOf: string;
  enterpriseValue: number;
  marketCap: number;
}

export interface OperationRatio {
  assetsTurnover: number;
  cashConversionCycle: number;
  commonEquityToAssets: number;
  currentRatio: number;
  daysInInventory: number;
  daysInPayment: number;
  daysInSales: number;
  debttoAssets: number;
  ebitMargin: number;
  ebitdaMargin: number;
  financialLeverage: number;
  fiscalYearEnd: number;
  fixAssetsTuronver: number;
  grossMargin: number;
  id: FinancialId;
  interestCoverage: number;
  inventoryTurnover: number;
  isCalculated: boolean;
  longTermDebtEquityRatio: number;
  longTermDebtTotalCapitalRatio: number;
  netIncomeContOpsGrowth: number;
  netIncomeGrowth: number;
  netMargin: number;
  normalizedNetProfitMargin: number;
  normalizedRoic: number;
  operationIncomeGrowth: number;
  operationMargin: number;
  operationRevenueGrowth3MonthAvg: number;
  paymentTurnover: number;
  pretaxMargin: number;
  quickRatio: number;
  receivableTurnover: number;
  revenueGrowth: number;
  roa: number;
  roe: number;
  roic: number;
  salesPerEmployee: number;
  taxRate: number;
  totalDebtEquityRatio: number;
}

export interface ValuationRatio {
  bookValuePerShare: number;
  bookValueYield: number;
  buyBackYield: number;
  cashReturn: number;
  cfYield: number;
  cfoPerShare: number;
  earningYield: number;
  evToEbitda: number;
  fcfPerShare: number;
  fcfRatio: number;
  fcfYield: number;
  forwardDividend: number;
  forwardDividendYield: number;
  forwardEarningYield: number;
  forwardPeRatio: number;
  id: InstrumentIdentifier;
  normalizedPeRatio: number;
  payoutRatio: number;
  pbRatio: number;
  pcfRatio: number;
  peRatio: number;
  pegPayback: number;
  pegRatio: number;
  priceChange1M: number;
  pricetoEbitda: number;
  psRatio: number;
  ratioPe5YearAverage: number;
  salesPerShare: number;
  salesYield: number;
  sustainableGrowthRate: number;
  tangibleBookValuePerShare: number;
  tangibleBvPerShare3YrAvg: number;
  tangibleBvPerShare5YrAvg: number;
  totalYield: number;
  trailingDividendYield: number;
  workingCapitalPerShare: number;
  workingCapitalPerShare3YrAvg: number;
  workingCapitalPerShare5YrAvg: number;
}

export interface Financials {
  alphaBeta: AlphaBeta[];
  assetClassification: AssetClassification;
  company: Company;
  companyProfile: CompanyProfile;
  earningRatios: EarningRatio[];
  earningReports: EarningReport[];
  error?: string;
  financials: Financial[];
  id: string;
  idType: string;
  operationRatios: OperationRatio[];
  shareClass: ShareClass;
  shareClassProfile: ShareClassProfile;
  symbol: StockSymbol;
  valuationRatios: ValuationRatio[];
}
