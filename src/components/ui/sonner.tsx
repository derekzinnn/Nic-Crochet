"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Branded toast host — mounted once in the root layout. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans rounded-2xl",
          title: "font-sans",
          description: "font-sans",
        },
      }}
      {...props}
    />
  );
}
