type AddNewNumberOutput = { new_a: string; new_nubmer: number };
const addNewNumber: NumberProcess<AddNewNumberOutput> = pipe(
  RTE.ask<Dep>(),
  RTE.map((dep) => ({ new_a: dep.a, new_nubmer: 2 }))
);

const returnNumber = (input: AddNewNumberOutput): NumberProcess =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => Number(dep.a) + input.new_nubmer)
  );

type ReturnNumber2Output = {
  new_a: string;
  new_nubmer: number;
  new_number2: number;
};

const returnNumber2 = (input: number): NumberProcess<ReturnNumber2Output> =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => ({
      new_a: dep.a,
      new_nubmer: Number(dep.a) - input,
      new_number2: Number(dep.a) + 3,
    }))
  );

const returnNumber3SubProcess: ReturnNumber3Process = pipe(
  RTE.ask<ReturnNumber3Env>(),
  RTE.map(
    ({ a, new_a, new_number2 }) => Number(a) + Number(new_a) + new_number2
  )
);

const returnNumber3SubProcess2 = (input: number): ReturnNumber3Process =>
  pipe(
    RTE.ask<ReturnNumber3Env>(),
    RTE.map(({ a, new_nubmer }) => Number(a) + new_nubmer + input)
  );

const bipe = <Dep1, Dep2, TOutput>(
  expandEnv: (env: Dep1) => Dep2,
  newProcess: Process<Dep2, TOutput>
): Process<Dep1, TOutput> =>
  pipe(
    //
    newProcess,
    RTE.local<Dep1, Dep2>(expandEnv)
  );
const returnNumber3 = (input: ReturnNumber2Output): NumberProcess =>
  pipe(
    // new env
    bipe(
      (env: Dep) => ({ ...env, ...input }),
      // branch process
      pipe(returnNumber3SubProcess, RTE.chain(returnNumber3SubProcess2))
    )
  );

type ReturnNumber3Env = Dep & ReturnNumber2Output;
type ReturnNumber3Process<TOutput = number> = Process<
  ReturnNumber3Env,
  TOutput
>;

const returnNumber4 = (input: number): NumberProcess =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => Number(dep.a) + input)
  );

type Dep = { a: string };
type NumberProcess<TOutput = number> = Process<Dep, TOutput>;
const NumberProcess: NumberProcess = pipe(
  addNewNumber,
  RTE.chain(returnNumber),
  RTE.chain(returnNumber2),
  RTE.chain(returnNumber3),
  RTE.chain(returnNumber4)
);
