/**
 * Fixture to check that useEffect suppressed with biome-ignore is allowed.
 */
import { useEffect } from "react";

export function useMountEffect(effect: () => void | (() => void)) {
	// biome-ignore lint/plugin/no-use-effect: useMountEffect implementation
	useEffect(effect, []);
}
