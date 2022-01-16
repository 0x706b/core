// ets_tracing: off

import * as C from "../../Collections/Immutable/Chunk"
import * as Tp from "../../Collections/Immutable/Tuple"
import type { Managed } from "../definition"
import { managedApply } from "../definition"
import * as T from "./_internal/effect-api"

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Chunk<B>`.
 *
 * For a parallel version of this method, see `forEachPar_`.
 * If you do not need the results, see `forEachUnit_` for a more efficient implementation.
 */
export function forEach_<R, E, A, B>(
  as: Iterable<A>,
  f: (a: A) => Managed<R, E, B>,
  __trace?: string
): Managed<R, E, C.Chunk<B>> {
  return managedApply(
    T.map_(
      T.forEach_(as, (a) => f(a).effect, __trace),
      (res) => {
        const fins = C.map_(res, (k) => k.get(0))
        const as = C.map_(res, (k) => k.get(1))

        return Tp.tuple(
          (e) => T.forEach_(C.reverse(fins), (fin) => fin(e), __trace),
          as
        )
      }
    )
  )
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Chunk<B>`.
 *
 * For a parallel version of this method, see `forEachPar`.
 * If you do not need the results, see `forEachUnit` for a more efficient implementation.
 *
 * @ets_data_first forEach_
 */
export function forEach<R, E, A, B>(f: (a: A) => Managed<R, E, B>, __trace?: string) {
  return (as: Iterable<A>) => forEach_(as, f, __trace)
}
