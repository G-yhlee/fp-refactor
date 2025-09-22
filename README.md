# fp-ts 리팩토링 프로젝트

fp-ts의 ReaderTaskEither를 활용한 함수형 프로그래밍 패턴 학습 및 리팩토링 프로젝트입니다.

## 프로젝트 구조

```
fp-refactor/
├── modules/
│   ├── origin/          # 원본 코드
│   ├── refactor/        # 리팩토링된 코드 (커링 적용)
│   └── bank/            # 은행 도메인 예제
├── docs/                # 참고 문서
└── package.json
```

## 설치

```bash
npm install
```

## 테스트 실행

### 개별 모듈 테스트

```bash
# 원본 코드 테스트
npm run test:origin

# 리팩토링된 코드 테스트  
npm run test:refactor

# 은행 도메인 예제 테스트
npm run test:bank
```

### 전체 테스트 실행

```bash
npm run test:all
```

## 개발 모드 실행

```bash
# 원본 코드 실행
npm run dev:origin

# 리팩토링된 코드 실행
npm run dev:refactor  

# 은행 도메인 예제 실행
npm run dev:bank
```

## 모듈 설명

### 1. Origin Module (`modules/origin/`)
- 원본 하드코딩된 숫자 처리 파이프라인
- 고정된 값들을 사용한 5단계 계산 프로세스
- ReaderTaskEither 기본 사용법

### 2. Refactor Module (`modules/refactor/`)
- 커링 기법을 적용한 리팩토링 버전
- 설정 가능한 파라미터 (초기값, 추가값 등)
- origin과 동일한 로직이지만 유연한 구조

### 3. Bank Module (`modules/bank/`)
- 실제 도메인(은행)을 모델링한 예제
- 계좌 생성, 입금, 수수료, 이자 계산
- 커링을 활용한 설정 주입 패턴

## 주요 개념

### ReaderTaskEither
세 가지 모나드의 조합:
- **Reader**: 의존성 주입 (환경 읽기)
- **Task**: 비동기 작업
- **Either**: 에러 처리

### 커링 (Currying)
함수의 파라미터를 단계별로 나누어 받는 기법:
```typescript
// 일반 함수
function add(a: number, b: number): number

// 커링 함수
const add = (a: number) => (b: number): number
```

### 파이프라인 구조
```typescript
pipe(
  step1,
  RTE.chain(step2),
  RTE.chain(step3),
  // ...
)
```

## 예제 실행 결과

### Origin 모듈
```
테스트 케이스: a = "5"
✅ 최종 결과: 26
```

### Refactor 모듈
설정값에 따라 다른 결과 생성:
- 기본 설정: 초기값=2, 추가값=3
- 공격적 설정: 초기값=5, 추가값=10
- 보수적 설정: 초기값=1, 추가값=1

### Bank 모듈
실제 은행 업무 시뮬레이션:
- 계좌 생성
- 입금 처리
- 수수료 차감
- 이자 계산
- 최종 잔액

## 참고 자료

- [fp-ts 공식 문서](https://gcanti.github.io/fp-ts/)
- [ReaderTaskEither 가이드](docs/readertaskeither-patterns.md)
- [은행 도메인 패턴](docs/fp-ts-banking-patterns.md)
- [실제 사례](docs/real-world-examples.md)

## 라이센스

ISC