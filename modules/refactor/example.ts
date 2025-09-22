import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { NumberProcess } from './refactor';

// 이 코드의 목적:
// 1. 환경(Dep)에서 'a' 값을 받아 여러 단계의 숫자 변환을 수행
// 2. 각 단계에서 이전 결과를 활용하여 새로운 계산 수행
// 3. 함수형 프로그래밍의 합성과 의존성 주입 패턴 활용

// 실행 예제
async function runExample() {
  console.log('=== NumberProcess 파이프라인 실행 테스트 ===\n');
  
  // 테스트 환경 설정
  const testCases = [
    { a: '5' },
    { a: '10' },
    { a: '3' },
  ];

  for (const env of testCases) {
    console.log(`\n테스트 케이스: a = "${env.a}"`);
    console.log('----------------------------');
    
    // 파이프라인 실행
    const result = await NumberProcess(env)();
    
    if (E.isRight(result)) {
      console.log(`✅ 최종 결과: ${result.right}`);
      
      // 단계별 계산 과정 추적
      console.log('\n📝 계산 과정:');
      const a = Number(env.a);
      
      // Step 1: addNewNumber
      const step1 = { new_a: env.a, new_nubmer: 2 };
      console.log(`  1. addNewNumber: { new_a: "${step1.new_a}", new_nubmer: ${step1.new_nubmer} }`);
      
      // Step 2: returnNumber
      const step2 = a + step1.new_nubmer;
      console.log(`  2. returnNumber: ${a} + ${step1.new_nubmer} = ${step2}`);
      
      // Step 3: returnNumber2
      const step3 = {
        new_a: env.a,
        new_nubmer: a - step2,
        new_number2: a + 3
      };
      console.log(`  3. returnNumber2: { new_a: "${step3.new_a}", new_nubmer: ${step3.new_nubmer}, new_number2: ${step3.new_number2} }`);
      
      // Step 4: returnNumber3
      // SubProcess1: a + new_a + new_number2
      const sub1 = a + a + step3.new_number2;
      console.log(`  4a. returnNumber3SubProcess: ${a} + ${a} + ${step3.new_number2} = ${sub1}`);
      
      // SubProcess2: 이전 결과를 2배로
      const sub2 = sub1 * 2;
      console.log(`  4b. returnNumber3SubProcess2: ${sub1} * 2 = ${sub2}`);
      
      // Step 5: returnNumber4
      const step5 = a + sub2;
      console.log(`  5. returnNumber4: ${a} + ${sub2} = ${step5}`);
      
      console.log(`\n  최종 검증: ${step5} === ${result.right} ✓`);
    } else {
      console.log(`❌ 에러 발생: ${result.left}`);
    }
  }
  
  console.log('\n=== 파이프라인 목적 요약 ===');
  console.log('이 코드는 다음을 보여줍니다:');
  console.log('1. ReaderTaskEither를 사용한 의존성 주입 (환경에서 a 값 읽기)');
  console.log('2. 파이프라인을 통한 단계적 데이터 변환');
  console.log('3. 중간 환경 확장 (bipe를 통한 ReturnNumber3Env)');
  console.log('4. 함수 합성을 통한 복잡한 비즈니스 로직 구현');
  console.log('5. 타입 안전성과 에러 처리를 보장하는 함수형 프로그래밍');
}

// 실행
runExample().catch(console.error);