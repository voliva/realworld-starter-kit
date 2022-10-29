import { useRef, useState } from "react";
import { Observable } from "rxjs";
import * as original from "./dist";
import { StatePromise, Signal, StringRecord } from "./dist";
// @ts-ignore-next-line
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";

interface GetObservableFn<K> {
  <T, CK extends StringRecord<any>>(
    other: K extends CK ? StateNode<T, CK> | Signal<T, CK> : never
  ): Observable<T>;
  <T, CK extends StringRecord<any>>(
    other: StateNode<T, CK> | Signal<T, CK>,
    keys: Omit<CK, keyof K>
  ): Observable<T>;
}
export type CtxValue = <CT>(node: StateNode<CT, any>) => CT;
export type CtxFn<T, K extends StringRecord<any>> = (
  ctxValue: CtxValue,
  ctxObservable: GetObservableFn<K>,
  key: K
) => Observable<T>;

export interface StateNode<T, K extends StringRecord<any>>
  extends original.StateNode<T, K> {
  createSignal<T>(): Signal<T, K>;
  routeState<
    O extends StringRecord<((value: T) => any) | null>,
    OT extends {
      [KOT in keyof O]: null extends O[KOT]
        ? StateNode<T, K>
        : O[KOT] extends (value: T) => infer V
        ? StateNode<V, K>
        : unknown;
    }
  >(
    routes: O,
    selector: (value: T, ctx: CtxValue) => keyof O
  ): [StateNode<keyof O, K>, OT];
  substate<T>(
    getState$: CtxFn<T, K>,
    equalityFn?: (a: T, b: T) => boolean
  ): StateNode<T, K>;

  original: original.StateNode<T, K>;
}

function wrapStateNode<T, K extends StringRecord<any>>(
  node: original.StateNode<T, K>
): StateNode<T, K> {
  return {
    original: node,
    getValue: node.getValue,
    getState$: node.getState$,
    createSignal() {
      return original.createSignal(node);
    },
    routeState(routes, selector) {
      const [selectedRoute, routeNodes] = original.routeState(
        node,
        routes,
        (value, ctx) => selector(value, (node) => ctx(node.original))
      );
      return [
        wrapStateNode(selectedRoute),
        Object.fromEntries(
          Object.entries(routeNodes).map(([key, value]) => [
            key,
            wrapStateNode(value),
          ])
        ),
      ] as [StateNode<any, K>, any];
    },
    substate(getState$, equalityFn) {
      return wrapStateNode(
        original.substate(
          node,
          (ctx, value$, key) =>
            getState$(
              (node) => ctx(node.original),
              ((node: any, ...keys: any[]) =>
                (value$ as any)(
                  "original" in node ? node.original : node,
                  ...keys
                )) as any,
              key
            ),
          equalityFn
        )
      );
    },
  };
}

export function createRoot() {
  const node = original.createRoot();
  return Object.assign(wrapStateNode(node), {
    run: () => node.run(),
  });
}

export const combineStates: <States extends StringRecord<StateNode<any, any>>>(
  states: IsCompatible<
    MapKeys<States>,
    UnionToIntersection<MapKeys<States>[keyof States]>
  > extends true
    ? States
    : never
) => StringRecordNodeToNodeStringRecord<States> = (states) =>
  original.combineStates(
    Object.fromEntries(
      Object.entries(states).map(([key, value]) => [key, value.original])
    )
  ) as any;

declare type StringRecordNodeToNodeStringRecord<
  States extends StringRecord<StateNode<any, any>>
> = StateNode<
  {
    [K in keyof States]: States[K] extends StateNode<infer V, any> ? V : never;
  },
  any
>;
declare type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
/**
 * Converts Record<string, State<any, K>> to Record<string, K>
 */
declare type MapKeys<States> = {
  [K in keyof States]: States[K] extends StateNode<any, infer K> ? K : never;
};
/**
 * For each of the keys, check if they are compatible with the intersection
 */
declare type IndividualIsCompatible<KeysRecord, KeysIntersection> = {
  [K in keyof KeysRecord]: KeysRecord[K] extends KeysIntersection
    ? true
    : false;
};
/**
 * It will be compatible if one of the individual ones returns true.
 * If all of them are false, true extends false => false
 * if one of them is true, true extends boolean => true
 */
declare type IsCompatible<KeysRecord, KeysIntersection> =
  true extends IndividualIsCompatible<
    KeysRecord,
    KeysIntersection
  >[keyof KeysRecord]
    ? true
    : false;

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
      });
      return () => {
        subscription.unsubscribe();
      };
    };
  }

  return useSyncExternalStore(...ref!.args);
};
