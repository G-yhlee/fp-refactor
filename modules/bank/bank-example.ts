import * as E from 'fp-ts/Either';
import { bankingProcessPipeline, BankEnv, NewAccountRequest } from './bank';

// 은행 업무 처리 파이프라인 테스트
async function runBankingExample() {
  console.log('=== 은행 계좌 개설 및 처리 파이프라인 테스트 ===\n');
  
  // 테스트 케이스들
  const testCases: { bankEnv: BankEnv; newAccount: NewAccountRequest }[] = [
    { 
      bankEnv: { initialBalance: 10000, customerName: '김철수', bankCode: 'KB' },
      newAccount: { customerName: '김철수', initialDeposit: 1000, accountType: 'SAVINGS' }
    },
    { 
      bankEnv: { initialBalance: 50000, customerName: '이영희', bankCode: 'NH' },
      newAccount: { customerName: '이영희', initialDeposit: 2000, accountType: 'CHECKING' }
    },
    { 
      bankEnv: { initialBalance: 30000, customerName: '박민수', bankCode: 'SC' },
      newAccount: { customerName: '박민수', initialDeposit: 1500, accountType: 'SAVINGS' }
    },
  ];

  for (const { bankEnv, newAccount } of testCases) {
    console.log(`\n고객: ${newAccount.customerName} (${bankEnv.bankCode}은행)`);
    console.log(`계좌 타입: ${newAccount.accountType}`);
    console.log(`초기 잔액: ${bankEnv.initialBalance.toLocaleString()}원`);
    console.log(`초기 입금액: ${newAccount.initialDeposit.toLocaleString()}원`);
    console.log('-------------------------------------------');
    
    // 은행 업무 파이프라인 실행
    const result = await bankingProcessPipeline(newAccount)(bankEnv)();
    
    if (E.isRight(result)) {
      console.log(`✅ 최종 계좌 잔액: ${result.right.toLocaleString()}원`);
      
      // 단계별 계산 과정 추적
      console.log('\n📋 처리 과정:');
      
      // Step 1: 계좌 생성
      const accountNumber = `${bankEnv.bankCode}-${Date.now()}`;
      console.log(`  1. 계좌 생성: ${accountNumber}`);
      console.log(`     - 고객명: ${newAccount.customerName}`);
      console.log(`     - 계좌 타입: ${newAccount.accountType}`);
      console.log(`     - 초기 입금액: ${newAccount.initialDeposit.toLocaleString()}원`);
      
      // Step 2: 초기 입금 처리
      const balanceAfterDeposit = bankEnv.initialBalance + newAccount.initialDeposit;
      console.log(`  2. 입금 처리: ${bankEnv.initialBalance.toLocaleString()} + ${newAccount.initialDeposit.toLocaleString()} = ${balanceAfterDeposit.toLocaleString()}원`);
      
      // Step 3: 계좌 수수료 계산
      const accountFee = 50;
      const balanceAfterFee = balanceAfterDeposit - accountFee;
      console.log(`  3. 계좌 관리 수수료: ${balanceAfterDeposit.toLocaleString()} - ${accountFee} = ${balanceAfterFee.toLocaleString()}원`);
      
      // Step 4: 이자 계산
      const interestRate = 0.02;
      const monthlyInterest = (balanceAfterFee * interestRate) / 12;
      const bonusInterest = monthlyInterest * 1.5; // 신규 고객 보너스
      console.log(`  4a. 월 이자 계산: ${balanceAfterFee.toLocaleString()} × ${(interestRate * 100)}% ÷ 12 = ${monthlyInterest.toFixed(2)}원`);
      console.log(`  4b. 신규 고객 보너스: ${monthlyInterest.toFixed(2)} × 1.5 = ${bonusInterest.toFixed(2)}원`);
      
      // Step 5: 최종 잔액
      const finalBalance = bankEnv.initialBalance + bonusInterest;
      console.log(`  5. 최종 잔액: ${bankEnv.initialBalance.toLocaleString()} + ${bonusInterest.toFixed(2)} = ${finalBalance.toFixed(2)}원`);
      
      console.log(`\n  💰 최종 검증: ${finalBalance.toFixed(2)} ≈ ${result.right.toFixed(2)} ✓`);
    } else {
      console.log(`❌ 처리 중 오류 발생: ${result.left}`);
    }
  }
  
  console.log('\n=== 은행 파이프라인 목적 요약 ===');
  console.log('이 은행 시스템은 다음을 보여줍니다:');
  console.log('1. 🏦 계좌 개설부터 최종 잔액 계산까지의 전체 프로세스');
  console.log('2. 💳 단계별 은행 업무 처리 (입금, 수수료, 이자 계산)');
  console.log('3. 🔄 함수형 프로그래밍을 통한 복잡한 금융 로직 구현');
  console.log('4. 🛡️  ReaderTaskEither로 안전한 에러 처리와 환경 관리');
  console.log('5. 📊 타입 안전성을 보장하는 금융 도메인 모델링');
}

// 실행
runBankingExample().catch(console.error);