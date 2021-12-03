// ets_tracing: off

import * as CK from "../../../../Collections/Immutable/Chunk"
import * as HM from "../../../../Collections/Immutable/HashMap"
import * as L from "../../../../Collections/Immutable/List"
import * as Tp from "../../../../Collections/Immutable/Tuple"
import * as T from "../../../../Effect"
import type * as Ex from "../../../../Exit"
import type { Predicate } from "../../../../Function"
import { pipe } from "../../../../Function"
import * as M from "../../../../Managed"
import type * as O from "../../../../Option"
import * as P from "../../../../Promise"
import type * as Q from "../../../../Queue"
import type * as C from "../core"
import * as DistributedWithDynamic from "./distributedWithDynamic"

/**
 * More powerful version of `Stream#broadcast`. Allows to provide a function that determines what
 * queues should receive which elements. The decide function will receive the indices of the queues
 * in the resulting list.
 */
export function distributedWith_<R, E, A>(
  self: C.Stream<R, E, A>,
  n: number,
  maximumLag: number,
  decide: (a: A) => T.UIO<Predicate<number>>
): M.RIO<R, L.List<Q.Dequeue<Ex.Exit<O.Option<E>, A>>>> {
  return M.chain_(
    T.toManaged(P.make<never, (a: A) => T.UIO<Predicate<number>>>()),
    (prom) => {
      return M.chain_(
        DistributedWithDynamic.distributedWithDynamic_(
          self,
          maximumLag,
          (a: A) => T.chain_(P.await(prom), (_) => _(a)),
          (_) => T.unit
        ),
        (next) =>
          pipe(
            T.collectAll(
              CK.map_(CK.range(0, n - 1), (id) =>
                T.map_(next, ({ tuple: [key, queue] }) =>
                  Tp.tuple(Tp.tuple(key, id), queue)
                )
              )
            ),
            T.chain((entries) => {
              const {
                tuple: [mappings, queues]
              } = CK.reduceRight_(
                entries,
                Tp.tuple(
                  HM.make<number, number>(),
                  L.empty<Q.Dequeue<Ex.Exit<O.Option<E>, A>>>()
                ),
                ({ tuple: [mapping, queue] }, { tuple: [mappings, queues] }) =>
                  Tp.tuple(
                    HM.set_(mappings, Tp.get_(mapping, 0), Tp.get_(mapping, 1)),
                    L.prepend_(queues, queue)
                  )
              )

              return T.as_(
                P.succeed_(prom, (a: A) =>
                  T.map_(
                    decide(a),
                    (f) => (key: number) => f(HM.unsafeGet_(mappings, key))
                  )
                ),
                queues
              )
            }),
            T.toManaged
          )
      )
    }
  )
}

/**
 * More powerful version of `Stream#broadcast`. Allows to provide a function that determines what
 * queues should receive which elements. The decide function will receive the indices of the queues
 * in the resulting list.
 *
 * @ets_data_first distributedWith_
 */
export function distributedWith<A>(
  n: number,
  maximumLag: number,
  decide: (a: A) => T.UIO<Predicate<number>>
) {
  return <R, E>(self: C.Stream<R, E, A>) =>
    distributedWith_(self, n, maximumLag, decide)
}
