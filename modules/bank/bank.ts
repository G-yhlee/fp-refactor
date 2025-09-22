import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';

// Bank Domain Types
type BankEnv = { 
  initialBalance: number;
  customerName: string;
  bankCode: string;
};

type Process<TDep, TOutput> = RTE.ReaderTaskEither<TDep, Error, TOutput>;
type BankProcess<TOutput = number> = Process<BankEnv, TOutput>;

// Input Types for Pipeline
type NewAccountRequest = {
  customerName: string;
  initialDeposit: number;
  accountType: 'SAVINGS' | 'CHECKING';
};

// Step 1: Account Creation Types
type AccountCreationOutput = { 
  accountNumber: string; 
  depositAmount: number;
  customerName: string;
  accountType: string;
};

// Step 2: Deposit Processing Types
type DepositProcessingOutput = {
  accountNumber: string;
  depositAmount: number;
  totalBalance: number;
  interestRate: number;
};

// Step 3: Interest Calculation Types
type InterestCalculationEnv = BankEnv & DepositProcessingOutput;
type InterestCalculationProcess<TOutput = number> = Process<InterestCalculationEnv, TOutput>;

// Utility: Environment Expansion Helper
const expandBankEnvironment = <Dep1, Dep2, TOutput>(
  expandEnv: (env: Dep1) => Dep2,
  newProcess: Process<Dep2, TOutput>
): Process<Dep1, TOutput> =>
  pipe(
    newProcess,
    RTE.local<Dep1, Dep2>(expandEnv)
  );

// Step 1: Create New Account
const createNewAccount = (newAccount: NewAccountRequest): BankProcess<AccountCreationOutput> => 
  pipe(
    RTE.ask<BankEnv>(),
    RTE.map((env) => ({ 
      accountNumber: `${env.bankCode}-${Date.now()}`,
      depositAmount: newAccount.initialDeposit,
      customerName: newAccount.customerName,
      accountType: newAccount.accountType
    }))
  );

// Step 2: Process Initial Deposit
const processInitialDeposit = (input: AccountCreationOutput): BankProcess =>
  pipe(
    RTE.ask<BankEnv>(),
    RTE.map((env) => env.initialBalance + input.depositAmount)
  );

// Account Configuration Types
type AccountConfig = {
  accountFee: number;
  interestRate: number;
};

// Step 3: Calculate Account Fees and Update Balance (Curried)
const calculateAccountFees = (config: AccountConfig) => (currentBalance: number): BankProcess<DepositProcessingOutput> =>
  pipe(
    RTE.ask<BankEnv>(),
    RTE.map((env) => {
      const finalBalance = currentBalance - config.accountFee;
      return {
        accountNumber: `${env.bankCode}-ACCOUNT`,
        depositAmount: finalBalance,
        totalBalance: finalBalance,
        interestRate: config.interestRate
      };
    })
  );

// Step 4: Interest Calculation - Sub Processes
const calculateMonthlyInterest: InterestCalculationProcess = pipe(
  RTE.ask<InterestCalculationEnv>(),
  RTE.map(({ totalBalance, interestRate }) => 
    totalBalance * interestRate / 12 // 월 이자
  )
);

// Interest Bonus Configuration
type InterestBonusConfig = {
  bonusMultiplier: number;
};

const applyInterestBonus = (config: InterestBonusConfig) => (monthlyInterest: number): InterestCalculationProcess =>
  pipe(
    RTE.of(monthlyInterest * config.bonusMultiplier)
  );

// Step 4: Calculate Final Interest - Main (Curried)
const calculateFinalInterest = (bonusConfig: InterestBonusConfig) => (input: DepositProcessingOutput): BankProcess =>
  expandBankEnvironment(
    (env: BankEnv) => ({ ...env, ...input }),
    pipe(
      calculateMonthlyInterest, 
      RTE.chain(applyInterestBonus(bonusConfig))
    )
  );

// Step 5: Finalize Account Balance
const finalizeAccountBalance = (interest: number): BankProcess =>
  pipe(
    RTE.ask<BankEnv>(),
    RTE.map((env) => env.initialBalance + interest)
  );

// Configuration for the banking pipeline
type BankingConfig = {
  accountConfig: AccountConfig;
  bonusConfig: InterestBonusConfig;
};

// Main Banking Process Pipeline (Curried)
export const bankingProcessPipeline = (config: BankingConfig) => (newAccount: NewAccountRequest): BankProcess =>
  pipe(
    createNewAccount(newAccount),
    RTE.chain(processInitialDeposit),
    RTE.chain(calculateAccountFees(config.accountConfig)),
    RTE.chain(calculateFinalInterest(config.bonusConfig)),
    RTE.chain(finalizeAccountBalance)
  );

// Export types for testing
export type { 
  BankEnv, 
  NewAccountRequest, 
  AccountCreationOutput, 
  DepositProcessingOutput,
  BankingConfig,
  AccountConfig,
  InterestBonusConfig
};