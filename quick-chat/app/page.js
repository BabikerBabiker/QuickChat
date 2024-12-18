"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { auth } from "../lib/firebase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/chat");
      } else {
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <p>Loading...</p>;
}