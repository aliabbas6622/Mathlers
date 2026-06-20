from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Union
from sympy import simplify, Rational, Symbol, solve

class DeterministicSolver:
    """
    DETERMINISTIC MATH SOLVER
    Pure computation layer. No LLM usage.
    Uses Decimal and Sympy for precision.
    """

    @staticmethod
    def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
        return Decimal(str(value))

    def solve_percentage_change(self, current: float, previous: float) -> Dict[str, Any]:
        """Calculates percentage increase/decrease."""
        curr = self._to_decimal(current)
        prev = self._to_decimal(previous)

        if prev == 0:
            raise ValueError("Previous value cannot be zero for percentage change.")

        change = curr - prev
        percentage = (change / prev) * 100

        # Round to 2 decimal places for formatted answer
        formatted = percentage.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return {
            "exact_answer": float(percentage),
            "formatted_answer": f"{formatted}%",
            "step_by_step": [
                f"Identify new value: {current}",
                f"Identify previous value: {previous}",
                f"Calculate difference: {current} - {previous} = {float(change)}",
                f"Divide by previous value: {float(change)} / {previous} = {float(change/prev)}",
                f"Multiply by 100 to get percentage: {float(change/prev)} * 100 = {float(percentage)}%"
            ]
        }

    def solve_ratio(self, val1: float, val2: float) -> Dict[str, Any]:
        """Calculates simplified ratio between two values."""
        v1 = int(val1 * 100) if isinstance(val1, float) else int(val1)
        v2 = int(val2 * 100) if isinstance(val2, float) else int(val2)

        r = Rational(v1, v2)
        simplified_v1 = r.numerator
        simplified_v2 = r.denominator

        return {
            "exact_answer": (simplified_v1, simplified_v2),
            "formatted_answer": f"{simplified_v1}:{simplified_v2}",
            "step_by_step": [
                f"Take first value: {val1}",
                f"Take second value: {val2}",
                f"Express as fraction: {val1}/{val2}",
                f"Simplify fraction to lowest terms: {simplified_v1}/{simplified_v2}",
                f"Format as ratio: {simplified_v1}:{simplified_v2}"
            ]
        }

    def solve_speed(self, distance: float, time: float) -> Dict[str, Any]:
        """Calculates speed given distance and time."""
        d = self._to_decimal(distance)
        t = self._to_decimal(time)

        if t == 0:
            raise ValueError("Time cannot be zero.")

        speed = d / t
        formatted = speed.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return {
            "exact_answer": float(speed),
            "formatted_answer": f"{formatted}",
            "step_by_step": [
                f"Identify distance: {distance}",
                f"Identify time: {time}",
                f"Use formula Speed = Distance / Time",
                f"Calculate: {distance} / {time} = {float(speed)}"
            ]
        }

    def solve_average(self, values: List[float]) -> Dict[str, Any]:
        """Calculates mean of a list of values."""
        if not values:
            raise ValueError("Values list cannot be empty.")

        count = len(values)
        total = sum(self._to_decimal(v) for v in values)
        avg = total / count

        formatted = avg.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return {
            "exact_answer": float(avg),
            "formatted_answer": f"{formatted}",
            "step_by_step": [
                f"Sum all values: {' + '.join(map(str, values))} = {float(total)}",
                f"Count number of values: {count}",
                f"Divide total by count: {float(total)} / {count} = {float(avg)}"
            ]
        }

    def solve_algebra(self, equation_str: str, variable: str = 'x') -> Dict[str, Any]:
        """Solves a basic linear equation."""
        # Simple implementation for linear equations like 'x + 5 = 10'
        # Expects format 'expression = value'
        lhs_str, rhs_str = equation_str.split('=')

        x = Symbol(variable)
        lhs = simplify(lhs_str.strip())
        rhs = simplify(rhs_str.strip())

        solution = solve(lhs - rhs, x)

        if not solution:
            raise ValueError("No solution found for the equation.")

        ans = solution[0]

        return {
            "exact_answer": float(ans),
            "formatted_answer": str(ans),
            "step_by_step": [
                f"Given equation: {equation_str}",
                f"Rearrange to solve for {variable}: {lhs_str.strip()} - ({rhs_str.strip()}) = 0",
                f"Solve for {variable}: {ans}"
            ]
        }

    def convert_units(self, value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
        """Basic unit conversions (e.g., m to km, seconds to minutes)."""
        # Minimalist implementation for now
        conversions = {
            ('m', 'km'): Decimal('0.001'),
            ('km', 'm'): Decimal('1000'),
            ('seconds', 'minutes'): Decimal(1)/Decimal(60),
            ('minutes', 'seconds'): Decimal(60),
            ('USD', 'cents'): Decimal(100),
            ('cents', 'USD'): Decimal('0.01')
        }

        factor = conversions.get((from_unit, to_unit))
        if factor is None:
            raise ValueError(f"Conversion from {from_unit} to {to_unit} not supported.")

        result = self._to_decimal(value) * factor
        formatted = result.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP).normalize()

        return {
            "exact_answer": float(result),
            "formatted_answer": f"{formatted} {to_unit}",
            "step_by_step": [
                f"Identify value: {value} {from_unit}",
                f"Identify conversion factor: 1 {from_unit} = {float(factor)} {to_unit}",
                f"Multiply value by factor: {value} * {float(factor)} = {float(result)} {to_unit}"
            ]
        }
