/**
 * Fixture to check that direct useEffect calls are disallowed.
 */
import { useEffect, useState } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
}
