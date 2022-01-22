/*
 * This file is ported from
 *
 * Scala (https://www.scala-lang.org)
 *
 * Copyright EPFL and Lightbend, Inc.
 *
 * Licensed under Apache License 2.0
 * (http://www.apache.org/licenses/LICENSE-2.0).
 */

import type { List } from "../definition"
import { _Nil, Cons, isNil } from "../definition"

/**
 * @ets_data_first chain_
 */
export function chain<A, B>(f: (a: A) => List<B>): (ma: List<A>) => List<B> {
  return (ma) => chain_(ma, f)
}

export function chain_<A, B>(self: List<A>, f: (a: A) => List<B>): List<B> {
  let rest = self
  let h: Cons<B> | undefined = undefined
  let t: Cons<B> | undefined = undefined
  while (!isNil(rest)) {
    let bs = f(rest.head)
    while (!isNil(bs)) {
      const nx = new Cons(bs.head, _Nil)
      if (t === undefined) {
        h = nx
      } else {
        t.tail = nx
      }
      t = nx
      bs = bs.tail
    }
    rest = rest.tail
  }
  if (h === undefined) return _Nil
  else return h
}