# ReaderTaskEither 실전 패턴 가이드

## 참고 자료
- **[fp-ts ReaderTaskEither 공식 문서](https://gcanti.github.io/fp-ts/modules/ReaderTaskEither.ts.html)**
- **[Using ReaderTaskEither from fp-ts](https://gist.github.com/rzeigler/356912ed0a98d3d6cd4f4de7bbd9ac96)**: 실전 사용 예제
- **[Functional programming in typescript using fp-ts: ReaderTaskEither](https://dev.to/peerhenry/functional-programming-in-typescript-using-fp-ts-readertaskeither-1pei)**: 개념 설명
- **[TypeScript + fp-ts: ReaderTaskEither Foundations](https://andywhite.xyz/posts/2021-01-27-rte-foundations/)**: 기초 개념

## ReaderTaskEither란?

ReaderTaskEither는 세 가지 모나드의 조합입니다:
- **Reader**: 의존성 주입 (환경에서 값 읽기)
- **Task**: 비동기 작업 처리
- **Either**: 에러 처리 (성공/실패)

```typescript
type ReaderTaskEither<Environment, Error, Value> = 
  (env: Environment) => Promise<Either<Error, Value>>
```

## 핵심 패턴들

### 1. 의존성 주입 패턴
```typescript
// 환경 정의
type AppEnv = {
  logger: Logger;
  database: Database;
  config: Config;
}

// 환경 사용
const logMessage = (message: string): RTE.ReaderTaskEither<AppEnv, never, void> =>
  pipe(
    RTE.ask<AppEnv>(),
    RTE.map(({ logger }) => logger.info(message))
  );
```

### 2. 에러 처리와 복구
```typescript
const fetchUserWithFallback = (userId: string): RTE.ReaderTaskEither<AppEnv, Error, User> =>
  pipe(
    fetchUserFromPrimary(userId),
    RTE.orElse(() => fetchUserFromCache(userId)),
    RTE.orElse(() => RTE.left(new Error('User not found')))
  );
```

### 3. 순차적 파이프라인
```typescript
const processOrder = (orderId: string): RTE.ReaderTaskEither<AppEnv, Error, OrderResult> =>
  pipe(
    validateOrder(orderId),
    RTE.chain(checkInventory),
    RTE.chain(calculatePrice),
    RTE.chain(processPayment),
    RTE.chain(createShipment)
  );
```

### 4. 환경 확장 패턴
```typescript
// 원본 환경
type BaseEnv = { logger: Logger }

// 확장된 환경
type ExtendedEnv = BaseEnv & { userContext: UserContext }

const withUserContext = <A>(
  userContext: UserContext,
  action: RTE.ReaderTaskEither<ExtendedEnv, Error, A>
): RTE.ReaderTaskEither<BaseEnv, Error, A> =>
  pipe(
    action,
    RTE.local((baseEnv: BaseEnv) => ({ ...baseEnv, userContext }))
  );
```

### 5. 병렬 처리 패턴
```typescript
const fetchUserProfile = (userId: string): RTE.ReaderTaskEither<AppEnv, Error, UserProfile> =>
  pipe(
    RTE.Do,
    RTE.bind('user', () => fetchUser(userId)),
    RTE.bind('preferences', () => fetchPreferences(userId)),
    RTE.bind('permissions', () => fetchPermissions(userId)),
    RTE.map(({ user, preferences, permissions }) => ({
      ...user,
      preferences,
      permissions
    }))
  );
```

## 실제 사용 예제

### HTTP 서버에서의 활용
```typescript
type ServerEnv = {
  database: Database;
  logger: Logger;
  auth: AuthService;
}

const handleGetUser = (req: Request): RTE.ReaderTaskEither<ServerEnv, Error, User> =>
  pipe(
    validateRequest(req),
    RTE.chain(extractUserId),
    RTE.chain(authenticateUser),
    RTE.chain(fetchUserData),
    RTE.chainFirst(logAccess)
  );

// 실행
app.get('/user/:id', async (req, res) => {
  const result = await handleGetUser(req)({
    database: db,
    logger: logger,
    auth: authService
  })();
  
  if (E.isRight(result)) {
    res.json(result.right);
  } else {
    res.status(500).json({ error: result.left.message });
  }
});
```

### 데이터베이스 트랜잭션
```typescript
type DBEnv = { 
  transaction: DatabaseTransaction;
  logger: Logger;
}

const transferMoney = (from: string, to: string, amount: number): RTE.ReaderTaskEither<DBEnv, Error, TransferResult> =>
  pipe(
    debitAccount(from, amount),
    RTE.chain(() => creditAccount(to, amount)),
    RTE.chain(() => recordTransaction(from, to, amount)),
    RTE.chainFirst(logTransfer)
  );
```

## 테스트 패턴

### Mock 환경 생성
```typescript
const createMockEnv = (): AppEnv => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  },
  database: {
    findUser: jest.fn().mockResolvedValue(mockUser),
    saveUser: jest.fn().mockResolvedValue(true)
  },
  config: {
    apiUrl: 'http://test.com'
  }
});

// 테스트
test('should process user successfully', async () => {
  const mockEnv = createMockEnv();
  const result = await processUser('123')(mockEnv)();
  
  expect(E.isRight(result)).toBe(true);
  expect(mockEnv.logger.info).toHaveBeenCalled();
});
```

## 모범 사례

### 1. 환경 인터페이스 분리
```typescript
// 좋은 예
type WithLogger = { logger: Logger }
type WithDatabase = { database: Database }
type WithConfig = { config: Config }

type AppEnv = WithLogger & WithDatabase & WithConfig

// 함수별로 필요한 의존성만 명시
const logAction = <E extends WithLogger>(msg: string): RTE.ReaderTaskEither<E, never, void> => ...
```

### 2. 에러 타입 명시
```typescript
type ValidationError = { type: 'validation'; field: string; message: string }
type NetworkError = { type: 'network'; statusCode: number }
type DatabaseError = { type: 'database'; query: string }

type AppError = ValidationError | NetworkError | DatabaseError
```

### 3. 유틸리티 함수 활용
```typescript
const liftPromise = <E, A>(promise: Promise<A>): RTE.ReaderTaskEither<E, Error, A> =>
  RTE.fromTaskEither(TE.tryCatch(() => promise, E.toError));

const fromNullable = <E, A>(value: A | null, error: E): RTE.ReaderTaskEither<any, E, A> =>
  value ? RTE.right(value) : RTE.left(error);
```

## 결론

ReaderTaskEither는 복잡한 비즈니스 로직을 **타입 안전하고**, **테스트 가능하며**, **합성 가능한** 방식으로 구현할 수 있게 해줍니다. 특히 의존성이 많고 에러 처리가 중요한 엔터프라이즈 애플리케이션에서 큰 가치를 제공합니다.