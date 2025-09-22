import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";

// Base Types
type Dep = { a: string };
type Process<TDep, TOutput> = RTE.ReaderTaskEither<TDep, Error, TOutput>;
type NumberProcess<TOutput = number> = Process<Dep, TOutput>;

// Configuration Types
type Step1Config = {
  initialNumber: number;
};

type Step2Config = {
  additionalValue: number;
};

type Step3Config = {
  multiplier: number;
};

// Step 1: Add New Number Types
type AddNewNumberOutput = {
  new_a: string;
  new_nubmer: number;
};

// Step 2: Return Number 2 Types
type ReturnNumber2Output = {
  new_a: string;
  new_nubmer: number;
  new_number2: number;
};

// Step 3: Return Number 3 Types
type ReturnNumber3Env = Dep & ReturnNumber2Output;
type ReturnNumber3Process<TOutput = number> = Process<
  ReturnNumber3Env,
  TOutput
>;

// Utility: Environment Expansion Helper (original: bipe)
const bipe = <Dep1, Dep2, TOutput>(
  expandEnv: (env: Dep1) => Dep2,
  newProcess: Process<Dep2, TOutput>
): Process<Dep1, TOutput> => pipe(newProcess, RTE.local<Dep1, Dep2>(expandEnv));

// Step 1: Add New Number (Curried)
const addNewNumber = (config: Step1Config): NumberProcess<AddNewNumberOutput> =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => ({
      new_a: dep.a,
      new_nubmer: config.initialNumber,
    }))
  );

// Step 2: Return Number
const returnNumber = (input: AddNewNumberOutput): NumberProcess =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => Number(dep.a) + input.new_nubmer)
  );

// Step 3: Return Number 2 (Curried)
const returnNumber2 =
  (config: Step2Config) =>
  (input: number): NumberProcess<ReturnNumber2Output> =>
    pipe(
      RTE.ask<Dep>(),
      RTE.map((dep) => ({
        new_a: dep.a,
        new_nubmer: Number(dep.a) - input,
        new_number2: Number(dep.a) + config.additionalValue,
      }))
    );

// Step 4: Return Number 3 - Sub Processes
const returnNumber3SubProcess: ReturnNumber3Process = pipe(
  RTE.ask<ReturnNumber3Env>(),
  RTE.map(
    ({ a, new_a, new_number2 }) => Number(a) + Number(new_a) + new_number2
  )
);

const returnNumber3SubProcess2 = (
  previousResult: number
): ReturnNumber3Process =>
  pipe(
    RTE.ask<ReturnNumber3Env>(),
    RTE.map(({ a, new_nubmer }) => Number(a) + new_nubmer + previousResult)
  );

// Step 4: Return Number 3 - Main
const returnNumber3 = (input: ReturnNumber2Output): NumberProcess =>
  bipe(
    (env: Dep) => ({ ...env, ...input }),
    pipe(returnNumber3SubProcess, RTE.chain(returnNumber3SubProcess2))
  );

// Step 5: Return Number 4
const returnNumber4 = (input: number): NumberProcess =>
  pipe(
    RTE.ask<Dep>(),
    RTE.map((dep) => Number(dep.a) + input)
  );


// Configuration for the number processing pipeline
type NumberProcessConfig = {
  step1Config: Step1Config;
  step2Config: Step2Config;
  step3Config: Step3Config;
};

// Main Process Pipeline (Curried)
export const numberProcessPipeline =
  (config: NumberProcessConfig): NumberProcess =>
    pipe(
      addNewNumber(config.step1Config),
      RTE.chain(returnNumber),
      RTE.chain(returnNumber2(config.step2Config)),
      RTE.chain(returnNumber3),
      RTE.chain(returnNumber4)
    );

// Export types for testing
export type {
  NumberProcessConfig,
  Step1Config,
  Step2Config,
  Step3Config,
  AddNewNumberOutput,
  ReturnNumber2Output,
};
