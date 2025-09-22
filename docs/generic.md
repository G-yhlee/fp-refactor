const obj: a<t>에서 a는 제네릭 타입입니다. 몇 가지 예제:

1. 배열 (Array)

const numbers: Array<number> = [1, 2, 3];
const strings: Array<string> = ['a', 'b', 'c'];

2. Promise

const promise: Promise<string> = Promise.resolve("hello");
const fetchData: Promise<User> = fetch('/user').then(r => r.json());

3. 커스텀 제네릭 타입

// Box 타입 정의
type Box<T> = {
value: T;
};

const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "hello" };

4. React 컴포넌트

const MyComponent: React.FC<Props> = (props) => <div>{props.name}</div>;
const [state, setState]: useState<number> = useState(0);

5. Map/Set

const userMap: Map<string, User> = new Map();
const uniqueNumbers: Set<number> = new Set([1, 2, 3]);

여기서 Array, Promise, Box, React.FC, Map, Set이 a의 역할이고, <> 안의 타입이 t의 역할입니다. 제네릭을 통해 타입을 매개변수화하여 재사용 가능한 타입을 만듭니다.
