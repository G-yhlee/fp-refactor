# 실제 프로덕션에서의 fp-ts 활용 사례

## 인터넷 조사 결과

### 발견된 주요 리소스

1. **[GitHub - ruizb/domain-modeling-ts](https://github.com/ruizb/domain-modeling-ts)**
   - Scott Wlaschin의 "Domain Modeling Made Functional" 영감
   - fp-ts + newtype-ts 활용
   - fp-ts + io-ts 런타임 검증

2. **[GitHub - fraktalio/fmodel-ts](https://github.com/fraktalio/fmodel-ts)**
   - Event Sourcing & CQRS 패턴
   - 함수형 도메인 모델링
   - 실제 프로덕션용 라이브러리

3. **[rzeigler/fp-ts-gist](https://gist.github.com/rzeigler/356912ed0a98d3d6cd4f4de7bbd9ac96)**
   - HTTP 요청 처리 예제
   - 의존성 주입 패턴
   - 에러 복구 전략

### 추가 참고 자료
- **[fp-ts 공식 생태계](https://gcanti.github.io/fp-ts/ecosystem/)**: fp-ts 관련 라이브러리들
- **[fp-ts 치트시트](https://github.com/inato/fp-ts-cheatsheet)**: 주요 함수들 정리
- **[Domain Driven Design with F#](https://fsharpforfunandprofit.com/ddd/)**: 함수형 도메인 모델링 개념
- **[Functional and Reactive Domain Modeling](https://livebook.manning.com/book/functional-and-reactive-domain-modeling/chapter-1)**: 함수형 도메인 모델링 서적

## 실제 은행/금융 시스템 적용 방법

### 1. 계좌 관리 시스템
```typescript
type BankingEnv = {
  database: DatabasePool;
  auditLogger: AuditLogger;
  riskEngine: RiskEngine;
  notificationService: NotificationService;
}

// 계좌 개설
const openAccount = (request: AccountOpenRequest): RTE.ReaderTaskEither<BankingEnv, BankingError, Account> =>
  pipe(
    validateCustomerInfo(request),
    RTE.chain(performKYCCheck),
    RTE.chain(createAccountRecord),
    RTE.chain(initializeBalance),
    RTE.chainFirst(sendWelcomeNotification),
    RTE.chainFirst(auditAccountCreation)
  );

// 실행
const result = await openAccount(request)({
  database: dbPool,
  auditLogger: logger,
  riskEngine: engine,
  notificationService: notifications
})();
```

### 2. 거래 처리 시스템
```typescript
type TransactionEnv = {
  database: Database;
  fraudDetection: FraudService;
  externalBank: ExternalBankAPI;
  messaging: MessageQueue;
}

const processTransfer = (transfer: TransferRequest): RTE.ReaderTaskEither<TransactionEnv, TransferError, TransferResult> =>
  pipe(
    // 1. 검증 단계
    validateTransferRequest(transfer),
    RTE.chain(checkAccountExists),
    RTE.chain(verifyFunds),
    
    // 2. 리스크 평가
    RTE.chain(assessFraudRisk),
    RTE.chain(checkTransferLimits),
    
    // 3. 실행 단계
    RTE.chain(reserveFunds),
    RTE.chain(executeTransfer),
    RTE.chain(updateBalances),
    
    // 4. 후처리
    RTE.chainFirst(publishTransferEvent),
    RTE.chainFirst(notifyParties),
    RTE.chainFirst(recordAuditTrail)
  );
```

### 3. 대출 승인 시스템
```typescript
type LoanEnv = {
  creditBureau: CreditBureauAPI;
  underwritingEngine: UnderwritingEngine;
  database: Database;
  documentService: DocumentService;
}

const processLoanApplication = (application: LoanApplication): RTE.ReaderTaskEither<LoanEnv, LoanError, LoanDecision> =>
  pipe(
    // 병렬 데이터 수집
    RTE.Do,
    RTE.bind('creditScore', () => fetchCreditScore(application.applicantId)),
    RTE.bind('incomeVerification', () => verifyIncome(application.documents)),
    RTE.bind('collateralAssessment', () => assessCollateral(application.collateral)),
    
    // 승인 로직
    RTE.chain(({ creditScore, incomeVerification, collateralAssessment }) =>
      evaluateLoanEligibility({
        application,
        creditScore,
        incomeVerification,
        collateralAssessment
      })
    ),
    
    // 결과 처리
    RTE.chain(generateLoanOffer),
    RTE.chainFirst(saveDecision),
    RTE.chainFirst(notifyApplicant)
  );
```

## 현실적인 도입 전략

### 1. 단계적 마이그레이션
```typescript
// Phase 1: 유틸리티 함수부터 시작
const safeParseInt = (str: string): E.Either<Error, number> =>
  pipe(
    str,
    (s) => parseInt(s, 10),
    (n) => isNaN(n) ? E.left(new Error('Invalid number')) : E.right(n)
  );

// Phase 2: 비즈니스 로직 함수화
const calculateInterest = (principal: number, rate: number, time: number): E.Either<Error, number> =>
  pipe(
    E.Do,
    E.bind('p', () => principal > 0 ? E.right(principal) : E.left(new Error('Invalid principal'))),
    E.bind('r', () => rate >= 0 ? E.right(rate) : E.left(new Error('Invalid rate'))),
    E.bind('t', () => time > 0 ? E.right(time) : E.left(new Error('Invalid time'))),
    E.map(({ p, r, t }) => p * r * t / 100)
  );

// Phase 3: 전체 파이프라인 구성
const processLoanCalculation = (request: LoanRequest): RTE.ReaderTaskEither<AppEnv, Error, LoanResult> =>
  pipe(
    parseAndValidateRequest(request),
    RTE.chain(calculateMonthlyPayment),
    RTE.chain(generateAmortizationSchedule),
    RTE.chainFirst(logCalculation)
  );
```

### 2. 팀 교육 방안
```typescript
// 기존 개발자들을 위한 점진적 접근

// Step 1: Either부터 시작
function divide(a: number, b: number): E.Either<string, number> {
  return b === 0 ? E.left('Division by zero') : E.right(a / b);
}

// Step 2: pipe 사용법
const result = pipe(
  divide(10, 2),
  E.map(x => x * 2),
  E.fold(
    error => `Error: ${error}`,
    value => `Result: ${value}`
  )
);

// Step 3: ReaderTaskEither로 확장
const safeDivideAsync = (a: number, b: number): RTE.ReaderTaskEither<LoggerEnv, string, number> =>
  pipe(
    RTE.fromEither(divide(a, b)),
    RTE.chainFirst(result => logOperation(`${a} / ${b} = ${result}`))
  );
```

### 3. 기존 코드와의 통합
```typescript
// 기존 Express.js 핸들러와 통합
const wrapHandler = <E, A>(
  handler: RTE.ReaderTaskEither<E, Error, A>,
  env: E
) => async (req: Request, res: Response) => {
  const result = await handler(env)();
  
  if (E.isRight(result)) {
    res.json({ success: true, data: result.right });
  } else {
    res.status(500).json({ success: false, error: result.left.message });
  }
};

// 사용
app.get('/account/:id', wrapHandler(getAccountHandler, appEnv));
```

## 성능 고려사항

### 1. 함수 합성 최적화
```typescript
// 비효율적인 방법
const inefficient = pipe(
  data,
  Array.map(transform1),
  Array.map(transform2),
  Array.map(transform3) // 3번의 순회
);

// 효율적인 방법
const efficient = pipe(
  data,
  Array.map(pipe(transform1, transform2, transform3)) // 1번의 순회
);
```

### 2. 지연 평가 활용
```typescript
// 필요한 경우에만 계산
const lazyCalculation = pipe(
  RTE.ask<ExpensiveComputationEnv>(),
  RTE.chain(env => condition ? performExpensiveOperation(env) : RTE.right(defaultValue))
);
```

## 모니터링과 디버깅

### 1. 파이프라인 추적
```typescript
const withTracing = <E extends WithLogger, A>(
  name: string,
  operation: RTE.ReaderTaskEither<E, Error, A>
): RTE.ReaderTaskEither<E, Error, A> =>
  pipe(
    logInfo(`Starting ${name}`),
    RTE.chain(() => operation),
    RTE.chainFirst(() => logInfo(`Completed ${name}`)),
    RTE.orElse(error => pipe(
      logError(`Failed ${name}: ${error.message}`),
      RTE.left(error)
    ))
  );

// 사용
const tracedOperation = pipe(
  withTracing('user-validation', validateUser(userId)),
  RTE.chain(user => withTracing('balance-check', checkBalance(user.accountId))),
  RTE.chain(balance => withTracing('transfer-execution', executeTransfer(balance)))
);
```

### 2. 에러 수집
```typescript
type ErrorContext = {
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

const captureError = (context: ErrorContext) => (error: Error): RTE.ReaderTaskEither<ErrorReportingEnv, never, void> =>
  pipe(
    RTE.ask<ErrorReportingEnv>(),
    RTE.chainTaskEitherK(({ errorReporter }) =>
      TE.tryCatch(
        () => errorReporter.capture({ ...context, error }),
        () => new Error('Failed to report error')
      )
    ),
    RTE.orElse(() => RTE.right(undefined)) // 에러 리포팅 실패해도 원본 에러는 유지
  );
```

## 결론

fp-ts는 복잡한 금융 시스템에서 **타입 안전성**, **합성 가능성**, **테스트 용이성**을 제공하는 강력한 도구입니다. 

**도입 시 주의사항:**
- 팀의 함수형 프로그래밍 이해도 고려
- 점진적 도입 전략 필수
- 성능 최적화와 모니터링 체계 구축
- 기존 시스템과의 통합 방안 수립

실제 프로덕션에서는 우리가 만든 간단한 예제보다 훨씬 복잡하지만, 핵심 패턴은 동일합니다.