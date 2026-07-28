"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for advanced recovery

export default function Error({
  error, // The error object caught by the boundary
  reset, // A function to attempt to re-render the segment
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  // Log the error to an error reporting service
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReset = () => {
    // Attempt client-side recovery
    reset();
    // For server-side recovery, you might use router.refresh() or more complex logic
  };

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p> {/* Displaying the decoded error message */}
      <button onClick={handleReset}>Try again</button>
    </div>
  );
}
