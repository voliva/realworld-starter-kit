/* eslint-disable */
import { useRef, useState, useSyncExternalStore } from "react";
import { StateNode, StatePromise } from "./dist";
export * from "./dist";

type VoidCb = () => void;

interface Ref<T> {
  source$: StateNode<T, any>;
  args: [(cb: VoidCb) => VoidCb, () => T];
}

export const useStateObservable = <O>(source$: StateNode<O, any>): O => {
  const [, setError] = useState();
  const callbackRef = useRef<Ref<O>>();

  if (!callbackRef.current) {
    const getValue = (src: StateNode<O, any>) => {
      const result = src.getValue();
      if (result instanceof StatePromise)
        throw result.catch((e) => {
          // if (e instanceof NoSubscribersError) return e;
          throw e;
        });
      return result as any;
    };

    const gv: <T>() => T = () => {
      return getValue(callbackRef.current!.source$);
    };

    callbackRef.current = {
      source$: null as any,
      args: [, gv] as any,
    };
  }

  const ref = callbackRef.current;
  if (ref.source$ !== source$) {
    ref.source$ = source$;
    ref.args[0] = (next: () => void) => {
      const subscription = source$.getState$().subscribe({
        next,
        error: (e) => {
          setError(() => {
            throw e;
          });
        },
        complete() {
          next();
          ref.args[0](next);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    };
  }

  return useSyncExternalStore(...ref!.args);
};
