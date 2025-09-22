# fp-ts를 활용한 은행 업무 도메인 모델링

## 연구 결과 요약

실제 은행 업무를 fp-ts로 구현하는 방식에 대한 인터넷 조사 결과, **직접적인 은행 업무 fp-ts 예제는 매우 드물지만**, 함수형 도메인 모델링의 일반적인 패턴들이 존재합니다.

## 발견된 주요 리소스

### 1. 도메인 모델링 라이브러리
- **[ruizb/domain-modeling-ts](https://github.com/ruizb/domain-modeling-ts)**: fp-ts 생태계를 사용한 도메인 모델링
- **[fraktalio/fmodel-ts](https://github.com/fraktalio/fmodel-ts)**: 함수형 도메인 모델링 (Event Sourcing & CQRS)

### 2. ReaderTaskEither 실전 패턴
- **[rzeigler의 Gist](https://gist.github.com/rzeigler/356912ed0a98d3d6cd4f4de7bbd9ac96)**: HTTP 요청과 로깅을 위한 실전 패턴
- **[Dev.to 아티클](https://dev.to/peerhenry/functional-programming-in-typescript-using-fp-ts-readertaskeither-1pei)**: ReaderTaskEither의 핵심 개념 설명

### 3. 추가 참고 자료
- **[TypeScript + fp-ts: ReaderTaskEither Foundations](https://andywhite.xyz/posts/2021-01-27-rte-foundations/)**: RTE 기초 개념
- **[fp-ts 공식 문서](https://gcanti.github.io/fp-ts/)**: fp-ts 라이브러리 공식 문서
- **[F# for Fun and Profit - Domain Driven Design](https://fsharpforfunandprofit.com/ddd/)**: 함수형 도메인 모델링 개념

## 실제 은행 시스템에서의 fp-ts 활용 방법

### 1. 의존성 주입 패턴
```typescript
// 환경 정의
type BankingEnv = {
  database: DatabaseClient;
  logger: Logger;
  riskEngine: RiskEngine;
  auditService: AuditService;
}

// 계좌 조회
const getAccount = (accountId: string): RTE.ReaderTaskEither<BankingEnv, Error, Account> =>
  pipe(
    RTE.ask<BankingEnv>(),
    RTE.chain(({ database, logger }) => 
      RTE.fromTaskEither(database.getAccount(accountId))
    )
  );
```

### 2. 트랜잭션 파이프라인
```typescript
const processTransfer = (request: TransferRequest): RTE.ReaderTaskEither<BankingEnv, Error, TransferResult> =>
  pipe(
    validateTransfer(request),
    RTE.chain(checkBalance),
    RTE.chain(performRiskAssessment),
    RTE.chain(executeTransfer),
    RTE.chain(auditTransaction)
  );
```

### 3. 에러 처리와 복구
```typescript
const getAccountWithFallback = (accountId: string): RTE.ReaderTaskEither<BankingEnv, Error, Account> =>
  pipe(
    getAccountFromPrimary(accountId),
    RTE.orElse(() => getAccountFromSecondary(accountId)),
    RTE.orElse(() => getAccountFromCache(accountId))
  );
```

## 실제 금융 시스템 특징

### 강점
1. **타입 안전성**: 컴파일 타임에 비즈니스 규칙 검증
2. **합성 가능성**: 복잡한 금융 로직을 작은 함수들로 분해
3. **테스트 용이성**: 의존성 주입으로 모킹 간편
4. **에러 추적**: Either를 통한 명시적 에러 처리

### 도전과제
1. **학습 곡선**: 팀원들의 함수형 프로그래밍 이해 필요
2. **성능**: 함수 합성으로 인한 오버헤드
3. **디버깅**: 파이프라인이 복잡해질 때 추적 어려움

## 현실적인 적용 방안

### 점진적 도입
```typescript
// 기존 명령형 코드
async function processPayment(request: PaymentRequest) {
  const account = await getAccount(request.accountId);
  const balance = await getBalance(account);
  if (balance < request.amount) throw new Error('Insufficient funds');
  return await executePayment(request);
}

// fp-ts 버전
const processPaymentFP = (request: PaymentRequest): RTE.ReaderTaskEither<BankingEnv, Error, PaymentResult> =>
  pipe(
    getAccount(request.accountId),
    RTE.chain(checkSufficientFunds(request.amount)),
    RTE.chain(executePayment(request))
  );
```

### 하이브리드 접근
- 핵심 비즈니스 로직: fp-ts 활용
- UI/API 계층: 기존 방식 유지
- 점진적 마이그레이션

## 결론

우리가 만든 `bank.ts`는 실제 은행 시스템의 축소판으로, 다음과 같은 실제 패턴들을 반영합니다:

1. **단계적 처리**: 계좌 개설 → 입금 → 수수료 → 이자 계산
2. **환경 확장**: 중간 단계에서 새로운 컨텍스트 추가
3. **타입 안전성**: 각 단계의 입출력 타입 명시
4. **합성 가능성**: 작은 함수들을 조합하여 복잡한 비즈니스 로직 구현

실제 은행에서는 이런 패턴에 더해 **데이터베이스 트랜잭션**, **외부 API 호출**, **감사 로깅**, **리스크 평가** 등이 추가될 것입니다.