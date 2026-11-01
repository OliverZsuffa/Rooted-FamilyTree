"""Isolated prototype for Request 015.

Run with: python prototype.py
No third-party dependencies. This is a research harness, not application code.
"""
from collections import defaultdict
from itertools import combinations


FIXTURES = [
    ("corrected_CA_AB_BA",
     {"A": 0, "B": 0, "C": 0, "CA": 1, "AB": 1, "BA": 1},
     {"CA": ["C", "A"], "AB": ["A", "B"], "BA": ["A", "B"]}),
    ("shared_parent_three_units",
     {"S": 0, "P": 0, "Q": 0, "R": 0, "X": 1, "Y": 1, "Z": 1},
     {"X": ["S", "P"], "Y": ["S", "Q"], "Z": ["S", "R"]}),
    ("overlapping_half_siblings",
     {"A": 0, "B": 0, "C": 0, "D": 0, "u": 1, "v": 1, "w": 1, "x": 1},
     {"u": ["A", "B"], "v": ["A", "C"], "w": ["A", "B"], "x": ["D", "C"]}),
    ("multi_generation_cousins",
     {"G1": 0, "G2": 0, "G3": 0, "G4": 0, "P": 1, "U": 1, "V": 1, "C": 2, "K": 2},
     {"P": ["G1", "G2"], "U": ["G1", "G2"], "V": ["G3", "G4"],
      "C": ["P", "V"], "K": ["U", "V"]}),
    ("pedigree_collapse",
     {"a": 0, "b": 0, "c": 1, "d": 1, "e": 2},
     {"c": ["a", "b"], "d": ["a", "b"], "e": ["c", "d"]}),
]


def blocks_by_generation(generations, parents):
    rows = defaultdict(list)
    for person, generation in generations.items():
        parent_set = tuple(sorted(parents.get(person, ())))
        if parent_set:
            rows[generation, parent_set].append(person)
        else:
            # No recorded parents is not evidence of a shared sibling group.
            rows[generation, (person,)].append(person)
    result = defaultdict(list)
    for (generation, _), members in rows.items():
        result[generation].append(tuple(sorted(members)))
    for generation in result:
        result[generation].sort()
    return dict(result)


def flatten(blocks):
    return [person for block in blocks for person in block]


def crossing_count(generations, parents, order):
    ranks = {g: {person: i for i, person in enumerate(row)} for g, row in order.items()}
    total = 0
    for generation in sorted(order):
        if generation + 1 not in order:
            continue
        edges = [(parent, child) for child, parent_ids in parents.items()
                 for parent in parent_ids
                 if generations[parent] == generation
                 and generations[child] == generation + 1]
        for (p1, c1), (p2, c2) in combinations(edges, 2):
            if p1 == p2 or c1 == c2:
                continue
            if (ranks[generation][p1] - ranks[generation][p2]) * (
                ranks[generation + 1][c1] - ranks[generation + 1][c2]
            ) < 0:
                total += 1
    return total


def neighbour_positions(person, generations, parents, order):
    values = []
    for child, parent_ids in parents.items():
        if child == person:
            for parent in parent_ids:
                generation = generations[parent]
                values.append(order[generation].index(parent))
        if person in parent_ids:
            generation = generations[child]
            values.append(order[generation].index(child))
    return values


def baseline(generations, parents):
    blocks = blocks_by_generation(generations, parents)
    return {g: flatten(bs) for g, bs in blocks.items()}


def d3_inspired(generations, parents, iterations=20):
    blocks = blocks_by_generation(generations, parents)
    orders = {g: list(bs) for g, bs in blocks.items()}
    for _ in range(iterations):
        for generation in sorted(orders, reverse=True):
            current = {g: flatten(bs) for g, bs in orders.items()}
            def score(block):
                values = [v for person in block
                          for v in neighbour_positions(person, generations, parents, current)]
                return (sum(values) / len(values) if values else float("inf"), block)
            orders[generation].sort(key=score)
    return {g: flatten(bs) for g, bs in orders.items()}


def layered_sweeps(generations, parents, sweeps=20):
    blocks = blocks_by_generation(generations, parents)
    orders = {g: list(bs) for g, bs in blocks.items()}
    for _ in range(sweeps):
        before = {g: flatten(bs) for g, bs in orders.items()}
        for generation in sorted(orders):
            current = {g: flatten(bs) for g, bs in orders.items()}
            def score(block):
                vals = []
                for person in block:
                    for child, parent_ids in parents.items():
                        if child == person:
                            vals.extend(current[generation - 1].index(p)
                                        for p in parent_ids if generation - 1 in current)
                        if person in parent_ids and generation + 1 in current:
                            vals.append(current[generation + 1].index(child))
                return (sum(vals) / len(vals) if vals else float("inf"), block)
            orders[generation].sort(key=score)
        for generation in sorted(orders, reverse=True):
            current = {g: flatten(bs) for g, bs in orders.items()}
            def score(block):
                vals = []
                for person in block:
                    for child, parent_ids in parents.items():
                        if child == person and generation - 1 in current:
                            vals.extend(current[generation - 1].index(p)
                                        for p in parent_ids if p in current[generation - 1])
                        if person in parent_ids and generation + 1 in current:
                            vals.append(current[generation + 1].index(child))
                return (sum(vals) / len(vals) if vals else float("inf"), block)
            orders[generation].sort(key=score)
        if before == {g: flatten(bs) for g, bs in orders.items()}:
            break
    return {g: flatten(bs) for g, bs in orders.items()}


def global_block_swaps(generations, parents, max_passes=30):
    blocks = blocks_by_generation(generations, parents)
    orders = {g: flatten(bs) for g, bs in blocks.items()}
    def objective(candidate):
        crossings = crossing_count(generations, parents, candidate)
        ranks = {g: {p: i for i, p in enumerate(row)} for g, row in candidate.items()}
        span = sum(abs(ranks[generations[p]][p] - ranks[generations[c]][c])
                   for c, ps in parents.items() for p in ps
                   if generations[c] == generations[p] + 1)
        return crossings, span
    for _ in range(max_passes):
        best_score = objective(orders)
        best = None
        for generation, generation_blocks in blocks.items():
            for i, j in combinations(range(len(generation_blocks)), 2):
                candidate_blocks = list(generation_blocks)
                candidate_blocks[i], candidate_blocks[j] = candidate_blocks[j], candidate_blocks[i]
                candidate = dict(orders)
                candidate[generation] = flatten(candidate_blocks)
                score = objective(candidate)
                if score < best_score:
                    best_score, best = score, (generation, candidate_blocks, candidate)
        if best is None:
            break
        generation, blocks[generation], orders = best
    return orders


def main():
    methods = [
        ("baseline", baseline),
        ("D3-inspired", d3_inspired),
        ("layered-sweeps", layered_sweeps),
        ("global-block-swaps", global_block_swaps),
    ]
    print("Fixture | " + " | ".join(name for name, _ in methods))
    for name, generations, parents in FIXTURES:
        counts = [crossing_count(generations, parents, method(generations, parents))
                  for _, method in methods]
        print(name + " | " + " | ".join(map(str, counts)))
        for method_name, method in methods:
            result = method(generations, parents)
            people = [p for row in result.values() for p in row]
            assert len(people) == len(set(people)) == len(generations)
            for child, parent_ids in parents.items():
                if len(parent_ids) > 0:
                    siblings = [p for p in result[generations[child]]
                                if tuple(sorted(parents.get(p, ()))) == tuple(sorted(parent_ids))]
                    positions = [result[generations[child]].index(p) for p in siblings]
                    assert max(positions) - min(positions) + 1 == len(siblings)
            reversed_generations = dict(reversed(list(generations.items())))
            reversed_parents = dict(reversed(list(parents.items())))
            assert method(reversed_generations, reversed_parents) == result, method_name + " is not permutation stable"


if __name__ == "__main__":
    main()
