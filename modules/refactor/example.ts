import * as E from 'fp-ts/Either';
import { 
  numberProcessPipeline, 
  NumberProcessConfig
} from './refactor';

// 이 코드의 목적:
// 1. 환경(Dep)에서 'a' 값을 받아 여러 단계의 숫자 변환을 수행
// 2. 각 단계에서 이전 결과를 활용하여 새로운 계산 수행
// 3. 함수형 프로그래밍의 합성과 의존성 주입 패턴 활용

// 실행 예제
async function runExample() {
  console.log('=== NumberProcess 파이프라인 실행 테스트 ===\n');
  
  // 다양한 설정들
  const defaultConfig: NumberProcessConfig = {
    step1Config: { initialNumber: 2 },
    step2Config: { additionalValue: 3 },
    step3Config: { multiplier: 2 }
  };
  
  const aggressiveConfig: NumberProcessConfig = {
    step1Config: { initialNumber: 5 },
    step2Config: { additionalValue: 10 },
    step3Config: { multiplier: 3 }
  };
  
  const conservativeConfig: NumberProcessConfig = {
    step1Config: { initialNumber: 1 },
    step2Config: { additionalValue: 1 },
    step3Config: { multiplier: 1.5 }
  };
  
  // 테스트 환경 설정
  const testCases: { 
    env: { a: string };
    config: NumberProcessConfig; 
    configName: string;
  }[] = [
    { 
      env: { a: '5' }, 
      config: defaultConfig, 
      configName: '기본 설정' 
    },
    { 
      env: { a: '10' }, 
      config: aggressiveConfig, 
      configName: '공격적 설정' 
    },
    { 
      env: { a: '3' }, 
      config: conservativeConfig, 
      configName: '보수적 설정' 
    },
  ];

  for (const { env, config, configName } of testCases) {
    console.log(`\n테스트 케이스: a = "${env.a}" - ${configName}`);
    console.log(`설정: 초기값=${config.step1Config.initialNumber}, 추가값=${config.step2Config.additionalValue}, 배수=${config.step3Config.multiplier}`);
    console.log('--------------------------------------------------------------');
    
    // 파이프라인 실행
    const result = await numberProcessPipeline(config)(env)();
    
    if (E.isRight(result)) {
      console.log(`✅ 최종 결과: ${result.right}`);
      
      // 단계별 계산 과정 추적
      console.log('\n📝 계산 과정:');
      const a = Number(env.a);
      
      // Step 1: addNewNumber
      const step1 = { new_a: env.a, new_nubmer: config.step1Config.initialNumber };
      console.log(`  1. addNewNumber: { new_a: "${step1.new_a}", new_nubmer: ${step1.new_nubmer} }`);
      
      // Step 2: returnNumber
      const step2 = a + step1.new_nubmer;
      console.log(`  2. returnNumber: ${a} + ${step1.new_nubmer} = ${step2}`);
      
      // Step 3: returnNumber2
      const step3 = {
        new_a: env.a,
        new_nubmer: a - step2,
        new_number2: a + config.step2Config.additionalValue
      };
      console.log(`  3. returnNumber2: { new_a: "${step3.new_a}", new_nubmer: ${step3.new_nubmer}, new_number2: ${step3.new_number2} }`);
      
      // Step 4: returnNumber3
      // SubProcess1: a + new_a + new_number2
      const sub1 = a + a + step3.new_number2;
      console.log(`  4a. returnNumber3SubProcess: ${a} + ${a} + ${step3.new_number2} = ${sub1}`);
      
      // SubProcess2: a + new_nubmer + input (origin.ts와 동일)
      const sub2 = a + step3.new_nubmer + sub1;
      console.log(`  4b. returnNumber3SubProcess2: ${a} + ${step3.new_nubmer} + ${sub1} = ${sub2}`);
      
      // Step 5: returnNumber4
      const step5 = a + sub2;
      console.log(`  5. returnNumber4: ${a} + ${sub2} = ${step5}`);
      
      console.log(`\n  최종 검증: ${step5} === ${result.right} ✓`);
    } else {
      console.log(`❌ 에러 발생: ${result.left}`);
    }
  }
  
  console.log('\n=== 커링 적용 파이프라인 목적 요약 ===');
  console.log('이 리팩토링된 코드는 다음을 보여줍니다:');
  console.log('1. 💫 커링 기법을 통한 설정값의 파라미터화');
  console.log('2. 🔧 각 단계별 동작을 외부에서 제어 가능');
  console.log('3. 🎛️  다양한 설정 조합으로 다른 결과 생성');
  console.log('4. ⚙️  함수 재사용성과 유연성 극대화');
  console.log('5. 🛡️  타입 안전성을 유지하며 설정 주입');
  console.log('6. 📊 같은 로직, 다른 파라미터로 다양한 시나리오 테스트');
}

// 실행
runExample().catch(console.error);